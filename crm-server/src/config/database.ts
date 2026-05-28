import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

const db = new Database('data.db');

// зв'язки
db.pragma('foreign_keys = ON');

/* CUSTOMERS*/
db.exec(`
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  notes TEXT,
  total_spent REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

/* PRODUCTS*/
db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  category TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

/* ORDERS*/
db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  total_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
`);

/* ORDER ITEMS*/
db.exec(`
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`);

/* DOCUMENTS*/
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('invoice', 'act', 'payment')),
    number TEXT NOT NULL,
    date TEXT NOT NULL DEFAULT (date('now')),
    customer_id TEXT NOT NULL,
    order_id TEXT,
    amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
  )
`);

/* ACCOUNTS*/
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

/* JOURNAL ENTRIES*/
db.exec(`
  CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL DEFAULT (date('now')),
    document_id TEXT,
    debit_account_id TEXT NOT NULL,
    credit_account_id TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
    FOREIGN KEY (debit_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (credit_account_id) REFERENCES accounts(id) ON DELETE RESTRICT
  )
`);

// Insert basic chart of accounts
const insertAccount = db.prepare(`
  INSERT OR IGNORE INTO accounts (id, code, name, type)
  VALUES (?, ?, ?, ?)
`);

const accounts = [
  ['30', 'Каса', 'asset'],
  ['31', 'Рахунки в банках', 'asset'],
  ['36', 'Розрахунки з покупцями', 'asset'],
  ['28', 'Товари', 'asset'],
  ['63', 'Розрахунки з постачальниками', 'liability'],
  ['70', 'Дохід від реалізації', 'revenue'],
  ['90', 'Собівартість реалізації', 'expense'],
  ['92', 'Адміністративні витрати', 'expense'],
  ['93', 'Витрати на збут', 'expense']
];

const insertMany = db.transaction((accounts) => {
  for (const [code, name, type] of accounts) {
    insertAccount.run(randomUUID(), code, name, type);
  }
});

insertMany(accounts);

/* CASH BANK*/
db.exec(`
  CREATE TABLE IF NOT EXISTS cash_bank_journal (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL DEFAULT (date('now')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receipt', 'payment')),
  cash_account_id TEXT REFERENCES accounts(id) ON DELETE RESTRICT,
  bank_account_id TEXT REFERENCES accounts(id) ON DELETE RESTRICT,
  counterparty TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount REAL NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'UAH',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  document_number TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
)
`);

export default db;
