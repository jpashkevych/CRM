import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import db from "../config/database";

const router = Router();

/* =======================
   GET orders
   ======================= */
router.get("/", (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const offset = (page - 1) * limit;

  const searchQuery = (req.query.searchQuery as string | undefined)?.trim();
  const searchValue = searchQuery ? `%${searchQuery}%` : null;

  const whereClause = searchQuery
    ? `
      WHERE o.id LIKE ?
         OR o.status LIKE ?
         OR c.name LIKE ?
         OR c.email LIKE ?
         OR p.name LIKE ?
    `
    : "";

  const totalRow = searchQuery
    ? db
        .prepare<[string, string, string, string, string], { count: number }>(
          `
          SELECT COUNT(DISTINCT o.id) as count
          FROM orders o
          JOIN customers c ON c.id = o.customer_id
          JOIN order_items oi ON oi.order_id = o.id
          JOIN products p ON p.id = oi.product_id
          ${whereClause}
        `
        )
        .get(searchValue!, searchValue!, searchValue!, searchValue!, searchValue!)
    : db
        .prepare<[], { count: number }>(
          `
          SELECT COUNT(*) as count
          FROM orders
        `
        )
        .get();

  const total = totalRow?.count ?? 0;

  const orders = searchQuery
    ? db
        .prepare<
          [string, string, string, string, string, number, number],
          any
        >(
          `
          SELECT DISTINCT o.*,
            c.name as customer_name,
            c.email as customer_email
          FROM orders o
          JOIN customers c ON c.id = o.customer_id
          JOIN order_items oi ON oi.order_id = o.id
          JOIN products p ON p.id = oi.product_id
          ${whereClause}
          ORDER BY o.created_at DESC
          LIMIT ? OFFSET ?
        `
        )
        .all(
          searchValue!,
          searchValue!,
          searchValue!,
          searchValue!,
          searchValue!,
          limit,
          offset
        )
    : db
        .prepare<[number, number], any>(
          `
          SELECT o.*,
            c.name as customer_name,
            c.email as customer_email
          FROM orders o
          JOIN customers c ON c.id = o.customer_id
          ORDER BY o.created_at DESC
          LIMIT ? OFFSET ?
        `
        )
        .all(limit, offset);

  const orderIds = orders.map((o: any) => o.id);
  let items: any[] = [];
  if (orderIds.length) {
    items = db
      .prepare(
        `
      SELECT
        oi.id,
        oi.order_id,
        oi.product_id,
        p.name as product_name,
        oi.quantity,
        oi.price,
        oi.subtotal
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id IN (${orderIds.map(() => "?").join(",")})
    `
      )
      .all(...orderIds);
  }

  const ordersWithItems = orders.map((order: any) => ({
    ...order,
    items: items.filter((i) => i.order_id === order.id),
  }));

  res.json({
    data: ordersWithItems,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});


/* =======================
   GET order by id
   ======================= */
router.get("/:id", (req: Request, res: Response) => {
  const order = db
    .prepare(
      `
    SELECT * FROM orders WHERE id = ?
  `
    )
    .get(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const items = db
    .prepare(
      `
    SELECT
      oi.*,
      p.name as product_name
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `
    )
    .all(req.params.id);

  res.json({ ...order, items });
});

/* =======================
   CREATE order (with items)
   ======================= */
router.post("/", (req: Request, res: Response) => {
  const { customer_id, notes, items } = req.body;

  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Invalid order data" });
  }

  const orderId = randomUUID();
  let totalAmount = 0;

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_id, total_amount, notes)
    VALUES (?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO order_items (
      id, order_id, product_id, quantity, price, subtotal
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const updateProductStock = db.prepare(`
    UPDATE products SET stock = stock - ? WHERE id = ?
  `);

  const updateCustomerSpent = db.prepare(`
    UPDATE customers SET total_spent = total_spent + ? WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    insertOrder.run(orderId, customer_id, 0, notes);

    for (const item of items) {
      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;

      insertItem.run(
        randomUUID(),
        orderId,
        item.product_id,
        item.quantity,
        item.price,
        subtotal
      );

      updateProductStock.run(item.quantity, item.product_id);
    }

    db.prepare(
      `
    UPDATE orders SET total_amount = ? WHERE id = ?
  `
    ).run(totalAmount, orderId);
    updateCustomerSpent.run(totalAmount, customer_id);
  });

  try {
    transaction();
    res.status(201).json({ id: orderId });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create order" });
  }
});

/* =======================
   UPDATE order
   ======================= */
interface OrderRow {
  status: string;
  customer_id: string;
  total_amount: number;
}

interface OrderItemRow {
  product_id: string;
  quantity: number;
}

router.put("/:id", (req: Request, res: Response) => {
  const { status, notes } = req.body;
  const orderId = req.params.id;

  // Отримуємо попередній статус і дані замовлення
  const order: OrderRow | undefined = db
    .prepare(`SELECT status, customer_id, total_amount FROM orders WHERE id = ?`)
    .get(orderId) as OrderRow;

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const prevStatus = order.status;

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE orders SET
        status = COALESCE(?, status),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(status, notes, orderId);

    if (status === "cancelled" && prevStatus !== "cancelled") {
      db.prepare(`
        UPDATE customers
        SET total_spent = total_spent - ?
        WHERE id = ?
      `).run(order.total_amount, order.customer_id);

      const items: OrderItemRow[] = db
        .prepare(`SELECT product_id, quantity FROM order_items WHERE order_id = ?`)
        .all(orderId) as OrderItemRow[];

      const updateStock = db.prepare(`
        UPDATE products SET stock = stock + ? WHERE id = ?
      `);

      for (const item of items) {
        updateStock.run(item.quantity, item.product_id);
      }
    }
  });

  try {
    transaction();
    res.json({ message: "Order updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update order" });
  }
});



/* =======================
   DELETE order
   ======================= */
router.delete("/:id", (req: Request, res: Response) => {
  const result = db
    .prepare(
      `
    DELETE FROM orders WHERE id = ?
  `
    )
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json({ message: "Order deleted" });
});

export default router;
