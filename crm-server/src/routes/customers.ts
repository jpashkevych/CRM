import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import db from '../config/database';

const router = Router();

/* =======================
   GET customers
   ======================= */
router.get('/', (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const offset = (page - 1) * limit;

  const searchQuery = (req.query.searchQuery as string | undefined)?.trim();
  const searchValue = searchQuery ? `%${searchQuery}%` : null;

  const whereClause = searchQuery
    ? `WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?`
    : '';

  /* ===== total count ===== */
  const totalRow = searchQuery
    ? db
        .prepare<[string, string, string], { count: number }>(`
          SELECT COUNT(*) as count
          FROM customers
          ${whereClause}
        `)
        .get(searchValue!, searchValue!, searchValue!)
    : db
        .prepare<[], { count: number }>(`
          SELECT COUNT(*) as count
          FROM customers
        `)
        .get();

  const total = totalRow?.count ?? 0;

  /* ===== customers ===== */
  const customers = searchQuery
    ? db
        .prepare<
          [string, string, string, number, number],
          any
        >(`
          SELECT *
          FROM customers
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `)
        .all(searchValue!, searchValue!, searchValue!, limit, offset)
    : db
        .prepare<[number, number], any>(`
          SELECT *
          FROM customers
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `)
        .all(limit, offset);

  res.json({
    data: customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/* =======================
   GET customer by id
   ======================= */
router.get('/:id', (req: Request, res: Response) => {
  const customer = db
    .prepare(`SELECT * FROM customers WHERE id = ?`)
    .get(req.params.id);

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  res.json(customer);
});

/* =======================
   CREATE customer
   ======================= */
router.post('/', (req: Request, res: Response) => {
  const { name, email, phone, address, notes } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  const id = randomUUID();

  try {
    db.prepare(`
      INSERT INTO customers (id, name, email, phone, address, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, email, phone, address, notes);

    res.status(201).json({ id });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ message: 'Email already exists' });
    }

    res.status(500).json({ message: 'Failed to create customer' });
  }
});

/* =======================
   UPDATE customer
   ======================= */
router.put('/:id', (req: Request, res: Response) => {
  const { name, email, phone, address, notes, total_spent } = req.body;

  try {
    const result = db.prepare(`
      UPDATE customers SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        notes = COALESCE(?, notes),
        total_spent = COALESCE(?, total_spent)
      WHERE id = ?
    `).run(
      name,
      email,
      phone,
      address,
      notes,
      total_spent,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer updated' });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ message: 'Email already exists' });
    }

    res.status(500).json({ message: 'Failed to update customer' });
  }
});

/* =======================
   DELETE customer
   ======================= */
router.delete('/:id', (req: Request, res: Response) => {
  const result = db
    .prepare(`DELETE FROM customers WHERE id = ?`)
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  res.json({ message: 'Customer deleted' });
});

export default router;
