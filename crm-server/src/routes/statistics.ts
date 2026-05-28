import express, { Request, Response } from 'express';
import db from "../config/database";

const router = express.Router();

/* =======================
   GET summary statistics
   ======================= */
router.get('/', (req: Request, res: Response) => {
  try {
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
    
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
    
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status != ?').get('cancelled') as { count: number };
    
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE status != ?').get('cancelled') as { revenue: number };

    res.json({
      totalCustomers: totalCustomers.count,
      totalProducts: totalProducts.count,
      totalOrders: totalOrders.count,
      totalRevenue: totalRevenue.revenue
    });
  } catch (error) {
    console.error('Помилка отримання статистики:', error);
    res.status(500).json({ error: 'Помилка сервера при отриманні статистики' });
  }
});


/* =======================
   GET sales by last 7 days
   ======================= */
router.get('/sales', (req: Request, res: Response) => {
  try {
    const salesByDay = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_amount), 0) as amount
      FROM orders
      WHERE created_at >= datetime('now', '-7 days')
        AND status != ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all('cancelled') as Array<{ date: string; amount: number }>;

    const last7Days: Array<{ date: string; amount: number }> = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingDay = salesByDay.find(day => day.date === dateStr);
      last7Days.push({
        date: dateStr,
        amount: existingDay ? existingDay.amount : 0
      });
    }

    res.json({ salesByDay: last7Days });
  } catch (error) {
    console.error('Помилка отримання продажів:', error);
    res.status(500).json({ error: 'Помилка сервера при отриманні продажів' });
  }
});

/* =======================
   GET additional stats
   ======================= */
router.get('/additional', (req: Request, res: Response) => {
  try {
    const topCustomerResult = db.prepare(`
      SELECT 
        c.name,
        COALESCE(SUM(o.total_amount), 0) as spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.status != ?
      GROUP BY c.id, c.name
      ORDER BY spent DESC
      LIMIT 1
    `).get('cancelled') as { name: string; spent: number } | undefined;

    const topCustomer = topCustomerResult && topCustomerResult.spent > 0 
      ? { name: topCustomerResult.name, spent: topCustomerResult.spent }
      : null;

    const lowStockProducts = db.prepare(`
      SELECT name, stock
      FROM products
      WHERE stock < 10
      ORDER BY stock ASC
    `).all() as Array<{ name: string; stock: number }>;

    const pendingOrdersResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE status = ?
    `).get('pending') as { count: number };

    res.json({
      topCustomer,
      lowStockProducts,
      pendingOrders: pendingOrdersResult.count
    });
  } catch (error) {
    console.error('Помилка отримання додаткової статистики:', error);
    res.status(500).json({ error: 'Помилка сервера при отриманні додаткової статистики' });
  }
});

export default router;