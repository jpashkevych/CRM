import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import db from '../config/database';

const router = Router();

/* =======================
   GET all products
   ======================= */
router.get('/', (req: Request, res: Response) => {
  res.setHeader(
    'Cache-Control',
    'no-cache, no-store, must-revalidate'
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const offset = (page - 1) * limit;

  const searchQuery = (req.query.searchQuery as string | undefined)?.trim();

  const whereClause = searchQuery
    ? `WHERE name LIKE ? OR description LIKE ?`
    : '';

  const searchValue = searchQuery ? `%${searchQuery}%` : null;

  /* ===== total count ===== */
  const totalRow = searchQuery
    ? db
        .prepare<
          [string, string],
          { count: number }
        >(`
          SELECT COUNT(*) as count
          FROM products
          ${whereClause}
        `)
        .get(searchValue!, searchValue!)
    : db
        .prepare<[], { count: number }>(`
          SELECT COUNT(*) as count
          FROM products
        `)
        .get();

  const total = totalRow?.count ?? 0;

  /* ===== products ===== */
  const products = searchQuery
    ? db
        .prepare<
          [string, string, number, number],
          any
        >(`
          SELECT *
          FROM products
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `)
        .all(searchValue!, searchValue!, limit, offset)
    : db
        .prepare<[number, number], any>(`
          SELECT *
          FROM products
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `)
        .all(limit, offset);

  res.json({
    data: products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});



/* =======================
   GET product by id
   ======================= */
router.get('/:id', (req: Request, res: Response) => {
  const product = db.prepare(`
    SELECT * FROM products WHERE id = ?
  `).get(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
});

/* =======================
   CREATE product
   ======================= */
router.post('/', (req: Request, res: Response) => {
  const {
    name,
    description,
    price,
    stock = 0,
    category
  } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  const id = randomUUID();

  db.prepare(`
    INSERT INTO products (id, name, description, price, stock, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, description, price, stock, category);

  res.status(201).json({ id });
});

/* =======================
   UPDATE product
   ======================= */
router.put('/:id', (req: Request, res: Response) => {
  const { name, description, price, stock, category } = req.body;

  const result = db.prepare(`
    UPDATE products SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      stock = COALESCE(?, stock),
      category = COALESCE(?, category)
    WHERE id = ?
  `).run(name, description, price, stock, category, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json({ message: 'Product updated' });
});

/* =======================
   DELETE product
   ======================= */
router.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare(`
    DELETE FROM products WHERE id = ?
  `).run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json({ message: 'Product deleted' });
});

export default router;
