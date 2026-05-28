import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import db from "../config/database";

const router = Router();

/* =======================
   GET cash/bank journal
   ======================= */
router.get("/", (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const offset = (page - 1) * limit;

  const searchQuery = (req.query.searchQuery as string | undefined)?.trim();
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  const type = (req.query.type as "all" | "receipt" | "payment") || "all";
  const status =
    (req.query.status as "all" | "pending" | "completed" | "cancelled") ||
    "all";

  const where: string[] = [];
  const params: Record<string, any> = {
    limit,
    offset,
  };

  if (searchQuery) {
    where.push(`
      (
        counterparty LIKE @search
        OR description LIKE @search
        OR document_number LIKE @search
        OR notes LIKE @search
      )
    `);
    params.search = `%${searchQuery}%`;
  }

  if (from) {
    where.push(`date >= @from`);
    params.from = from;
  }

  if (to) {
    where.push(`date <= @to`);
    params.to = to;
  }

  if (type !== "all") {
    where.push(`transaction_type = @type`);
    params.type = type;
  }

  if (status !== "all") {
    where.push(`status = @status`);
    params.status = status;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = db
    .prepare(`
      SELECT COUNT(*) as count
      FROM cash_bank_journal
      ${whereClause}
    `)
    .get(params) as { count: number };

  const data = db
    .prepare(`
      SELECT *
      FROM cash_bank_journal
      ${whereClause}
      ORDER BY date DESC, created_at DESC
      LIMIT @limit OFFSET @offset
    `)
    .all(params);

  res.json({
    page,
    limit,
    total: total.count,
    pages: Math.ceil(total.count / limit),
    data,
  });
});

/* =======================
   POST cash/bank journal
   ======================= */
router.post("/", (req: Request, res: Response) => {
  const {
    date,
    transaction_type,
    cash_account_id,
    bank_account_id,
    counterparty,
    description,
    amount,
    currency,
    status,
    document_number,
    notes,
  } = req.body;

  if (
    !transaction_type ||
    !["receipt", "payment"].includes(transaction_type) ||
    !counterparty ||
    !amount ||
    amount <= 0
  ) {
    return res.status(400).json({
      message: "Invalid cash/bank journal data",
    });
  }

  if (!cash_account_id && !bank_account_id) {
    return res.status(400).json({
      message: "Either cash_account_id or bank_account_id must be provided",
    });
  }

  const id = randomUUID();

  db.prepare(`
    INSERT INTO cash_bank_journal (
      id,
      date,
      transaction_type,
      cash_account_id,
      bank_account_id,
      counterparty,
      description,
      amount,
      currency,
      status,
      document_number,
      notes
    ) VALUES (
      @id,
      COALESCE(@date, date('now')),
      @transaction_type,
      @cash_account_id,
      @bank_account_id,
      @counterparty,
      COALESCE(@description, ''),
      @amount,
      COALESCE(@currency, 'UAH'),
      COALESCE(@status, 'completed'),
      COALESCE(@document_number, ''),
      COALESCE(@notes, '')
    )
  `).run({
    id,
    date,
    transaction_type,
    cash_account_id: cash_account_id || null,
    bank_account_id: bank_account_id || null,
    counterparty,
    description,
    amount,
    currency,
    status,
    document_number,
    notes,
  });

  const created = db
    .prepare(`SELECT * FROM cash_bank_journal WHERE id = ?`)
    .get(id);

  res.status(201).json(created);
});

/* =======================
   GET Cash & Bank Balance
   ======================= */
router.get("/cash-bank-balance", (req: Request, res: Response) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  const where: string[] = [`status = 'completed'`];
  const params: Record<string, any> = {};

  if (from) {
    where.push(`date >= @from`);
    params.from = from;
  }

  if (to) {
    where.push(`date <= @to`);
    params.to = to;
  }

  const whereClause = `WHERE ${where.join(" AND ")}`;

  const result = db
    .prepare(`
      SELECT
        SUM(
          CASE
            WHEN transaction_type = 'receipt' AND cash_account_id IS NOT NULL
            THEN amount ELSE 0
          END
        ) AS cash_income,

        SUM(
          CASE
            WHEN transaction_type = 'payment' AND cash_account_id IS NOT NULL
            THEN amount ELSE 0
          END
        ) AS cash_expense,

        SUM(
          CASE
            WHEN transaction_type = 'receipt' AND bank_account_id IS NOT NULL
            THEN amount ELSE 0
          END
        ) AS bank_income,

        SUM(
          CASE
            WHEN transaction_type = 'payment' AND bank_account_id IS NOT NULL
            THEN amount ELSE 0
          END
        ) AS bank_expense
      FROM cash_bank_journal
      ${whereClause}
    `)
    .get(params) as {
      cash_income: number;
      cash_expense: number;
      bank_income: number;
      bank_expense: number;
    };

  const cashIncome = Number(result.cash_income || 0);
  const cashExpense = Number(result.cash_expense || 0);
  const bankIncome = Number(result.bank_income || 0);
  const bankExpense = Number(result.bank_expense || 0);

  const cash = cashIncome - cashExpense;
  const bank = bankIncome - bankExpense;

  res.json({
    cash,
    bank,
    total: cash + bank,
  });
});

export default router;
