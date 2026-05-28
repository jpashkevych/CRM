import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import db from "../config/database";

const router = Router();

/* =======================
   GET all accounts
   ======================= */
router.get("/accounts", (_req: Request, res: Response) => {
  const accounts = db
    .prepare(`
      SELECT *
      FROM accounts
      ORDER BY code ASC
    `)
    .all();

  res.json(accounts);
});

/* =======================
   GET journal entries
   ======================= */
router.get("/", (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const offset = (page - 1) * limit;

  const searchQuery = (req.query.searchQuery as string | undefined)?.trim();
  const searchValue = searchQuery ? `%${searchQuery}%` : null;

  const where = searchValue
    ? `
      WHERE
        je.description LIKE @search
        OR je.document_id LIKE @search
        OR d.number LIKE @search
        OR da.code LIKE @search
        OR da.name LIKE @search
        OR ca.code LIKE @search
        OR ca.name LIKE @search
    `
    : "";

  const total = db
    .prepare(`
      SELECT COUNT(*) as count
      FROM journal_entries je
      LEFT JOIN accounts da ON da.id = je.debit_account_id
      LEFT JOIN accounts ca ON ca.id = je.credit_account_id
      LEFT JOIN documents d ON d.id = je.document_id
      ${where}
    `)
    .get({ search: searchValue }) as { count: number };

  const data = db
    .prepare(`
      SELECT
        je.*,
        da.code AS debit_account_code,
        da.name AS debit_account_name,
        ca.code AS credit_account_code,
        ca.name AS credit_account_name,
        d.number AS document_number
      FROM journal_entries je
      LEFT JOIN accounts da ON da.id = je.debit_account_id
      LEFT JOIN accounts ca ON ca.id = je.credit_account_id
      LEFT JOIN documents d ON d.id = je.document_id
      ${where}
      ORDER BY je.date DESC, je.created_at DESC
      LIMIT @limit OFFSET @offset
    `)
    .all({
      search: searchValue,
      limit,
      offset,
    });

  res.json({
    page,
    limit,
    total: total.count,
    pages: Math.ceil(total.count / limit),
    data,
  });
});


/* =======================
   POST journal entry
   ======================= */
router.post("/", (req: Request, res: Response) => {
  const {
    date,
    document_id,
    debit_account_id,
    credit_account_id,
    amount,
    description,
  } = req.body;

  if (!debit_account_id || !credit_account_id || !amount || amount <= 0) {
    return res.status(400).json({
      message: "Invalid journal entry data",
    });
  }

  const id = randomUUID();

  db.prepare(`
    INSERT INTO journal_entries (
      id,
      date,
      document_id,
      debit_account_id,
      credit_account_id,
      amount,
      description
    ) VALUES (
      @id,
      COALESCE(@date, date('now')),
      @document_id,
      @debit_account_id,
      @credit_account_id,
      @amount,
      COALESCE(@description, '')
    )
  `).run({
    id,
    date,
    document_id: document_id || null,
    debit_account_id,
    credit_account_id,
    amount,
    description,
  });

  const created = db
    .prepare(`SELECT * FROM journal_entries WHERE id = ?`)
    .get(id);

  res.status(201).json(created);
});


/* =======================
   GET Trial Balance (ОСВ)
   ======================= */
router.get("/trial-balance", (req: Request, res: Response) => {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  const where: string[] = [];
  const params: Record<string, any> = {};

  if (from) {
    where.push(`je.date >= @from`);
    params.from = from;
  }

  if (to) {
    where.push(`je.date <= @to`);
    params.to = to;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  /**
   * Обороти по рахунках
   */
  const turnovers = db
    .prepare(`
      SELECT
        a.id AS account_id,
        a.code,
        a.name,
        a.type,
        SUM(
          CASE WHEN je.debit_account_id = a.id THEN je.amount ELSE 0 END
        ) AS debit,
        SUM(
          CASE WHEN je.credit_account_id = a.id THEN je.amount ELSE 0 END
        ) AS credit
      FROM accounts a
      LEFT JOIN journal_entries je
        ON je.debit_account_id = a.id
        OR je.credit_account_id = a.id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.code
    `)
    .all(params) as Array<{
      account_id: string;
      code: string;
      name: string;
      type: string;
      debit: number;
      credit: number;
    }>;

  /**
   * Розрахунок сальдо 
   */
  const result = turnovers.map((row) => {
    const debit = Number(row.debit || 0);
    const credit = Number(row.credit || 0);

    let balance = 0;

    if (row.type === "asset" || row.type === "expense") {
      balance = debit - credit;
    } else {
      balance = credit - debit;
    }

    return {
      account: {
        id: row.account_id,
        code: row.code,
        name: row.name,
        type: row.type,
      },
      debit,
      credit,
      balance,
    };
  });

  res.json({
    from: from || null,
    to: to || null,
    data: result,
  });
});

/* =======================
   GET Account Card
   ======================= */
router.get(
  "/account-card/:accountId",
  (req: Request, res: Response) => {
    const { accountId } = req.params;
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      return res.status(400).json({
        message: "from and to dates are required",
      });
    }

    /** Отримуємо рахунок */
    const account = db
      .prepare(`SELECT * FROM accounts WHERE id = ?`)
      .get(accountId) as {
      id: string;
      code: string;
      name: string;
      type: string;
    };

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    /** Початкове сальдо */
    const before = db
      .prepare(`
        SELECT
          SUM(CASE WHEN debit_account_id = @id THEN amount ELSE 0 END) AS debit,
          SUM(CASE WHEN credit_account_id = @id THEN amount ELSE 0 END) AS credit
        FROM journal_entries
        WHERE date < @from
      `)
      .get({ id: accountId, from }) as {
      debit: number;
      credit: number;
    };

    const debitBefore = Number(before.debit || 0);
    const creditBefore = Number(before.credit || 0);

    let openingBalance = 0;
    if (account.type === "asset" || account.type === "expense") {
      openingBalance = debitBefore - creditBefore;
    } else {
      openingBalance = creditBefore - debitBefore;
    }

    /** Усі проводки за період */
    const entries = db
      .prepare(`
        SELECT
          je.id,
          je.date,
          je.created_at,
          je.amount,
          je.description,
          je.debit_account_id,
          je.credit_account_id,

          da.code AS debit_code,
          da.name AS debit_name,

          ca.code AS credit_code,
          ca.name AS credit_name,

          d.number AS document_number
        FROM journal_entries je
        LEFT JOIN accounts da ON da.id = je.debit_account_id
        LEFT JOIN accounts ca ON ca.id = je.credit_account_id
        LEFT JOIN documents d ON d.id = je.document_id
        WHERE (je.debit_account_id = @id OR je.credit_account_id = @id)
          AND je.date >= @from
          AND je.date <= @to
        ORDER BY je.date, je.created_at
      `)
      .all({ id: accountId, from, to }) as any[];

    /** Формування картки рахунку */
    let runningBalance = openingBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    const transactions = entries.map((e) => {
      const amount = Number(e.amount);
      let debit = 0;
      let credit = 0;

      const isDebit = e.debit_account_id === accountId;

      if (isDebit) {
        debit = amount;
        totalDebit += amount;

        if (account.type === "asset" || account.type === "expense") {
          runningBalance += amount;
        } else {
          runningBalance -= amount;
        }
      } else {
        credit = amount;
        totalCredit += amount;

        if (account.type === "asset" || account.type === "expense") {
          runningBalance -= amount;
        } else {
          runningBalance += amount;
        }
      }

      return {
        id: e.id,
        date: e.date,
        description: e.description || "",
        debit,
        credit,
        balance: runningBalance,
        correspondent_account_code: isDebit ? e.credit_code : e.debit_code,
        correspondent_account_name: isDebit ? e.credit_name : e.debit_name,
        document_number: e.document_number || null,
      };
    });

    res.json({
      account,
      from,
      to,
      openingBalance,
      totalDebit,
      totalCredit,
      closingBalance: runningBalance,
      transactions,
    });
  }
);

export default router;
