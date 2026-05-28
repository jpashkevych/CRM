import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import db from "../config/database";

const router = Router();

/* =======================
   GET documents
   Pagination + search
   ======================= */
router.get("/", (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const offset = (page - 1) * limit;

  const searchQuery = (req.query.searchQuery as string | undefined)?.trim();
  const searchValue = searchQuery ? `%${searchQuery}%` : null;

  const whereClause = searchQuery
    ? `
      WHERE d.number LIKE ?
         OR d.type LIKE ?
         OR d.status LIKE ?
         OR c.name LIKE ?
    `
    : "";

  /* ===== total count ===== */
  const totalRow = searchQuery
    ? db
        .prepare<[string, string, string, string], { count: number }>(
          `
          SELECT COUNT(*) as count
          FROM documents d
          JOIN customers c ON c.id = d.customer_id
          ${whereClause}
        `,
        )
        .get(searchValue!, searchValue!, searchValue!, searchValue!)
    : db
        .prepare<[], { count: number }>(
          `
          SELECT COUNT(*) as count FROM documents
        `,
        )
        .get();

  const total = totalRow?.count ?? 0;

  /* ===== documents ===== */
  const documents = searchQuery
    ? db
        .prepare<[string, string, string, string, number, number], any>(
          `
          SELECT
            d.*,
            c.name AS customer_name
          FROM documents d
          JOIN customers c ON c.id = d.customer_id
          ${whereClause}
          ORDER BY d.created_at DESC
          LIMIT ? OFFSET ?
        `,
        )
        .all(
          searchValue!,
          searchValue!,
          searchValue!,
          searchValue!,
          limit,
          offset,
        )
    : db
        .prepare<[number, number], any>(
          `
          SELECT
            d.*,
            c.name AS customer_name
          FROM documents d
          JOIN customers c ON c.id = d.customer_id
          ORDER BY d.created_at DESC
          LIMIT ? OFFSET ?
        `,
        )
        .all(limit, offset);

  res.json({
    data: documents,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/* =======================
   POST create document
   ======================= */
router.post("/", (req: Request, res: Response) => {
  const {
    type,
    number,
    date,
    customer_id,
    order_id,
    amount,
    status = "draft",
    notes = "",
  } = req.body;

  if (!type || !number || !customer_id || amount === undefined) {
    return res.status(400).json({ message: "Invalid document data" });
  }

  const id = randomUUID();

  try {
    db.prepare(
      `
      INSERT INTO documents (
        id, type, number, date,
        customer_id, order_id,
        amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(id, type, number, date, customer_id, order_id, amount, status, notes);

    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ message: "Failed to create document" });
  }
});

/* =======================
   PUT update document
   ======================= */
router.put("/:id", (req: Request, res: Response) => {
  const { type, number, date, customer_id, order_id, amount, notes } = req.body;

  const result = db
    .prepare(
      `
    UPDATE documents SET
      type = COALESCE(?, type),
      number = COALESCE(?, number),
      date = COALESCE(?, date),
      customer_id = COALESCE(?, customer_id),
      order_id = COALESCE(?, order_id),
      amount = COALESCE(?, amount),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `,
    )
    .run(
      type,
      number,
      date,
      customer_id,
      order_id,
      amount,
      notes,
      req.params.id,
    );

  if (result.changes === 0) {
    return res.status(404).json({ message: "Document not found" });
  }

  res.json({ message: "Document updated" });
});

/* =======================
   PATCH change status
   ======================= */
router.patch("/:id/status", (req: Request, res: Response) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  const result = db
    .prepare(
      `
    UPDATE documents
    SET status = ?
    WHERE id = ?
  `,
    )
    .run(status, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: "Document not found" });
  }

  res.json({ message: "Status updated" });
});

/* =======================
   DELETE document
   ======================= */
router.delete("/:id", (req: Request, res: Response) => {
  const result = db
    .prepare(
      `
    DELETE FROM documents WHERE id = ?
  `,
    )
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: "Document not found" });
  }

  res.json({ message: "Document deleted" });
});

export default router;
