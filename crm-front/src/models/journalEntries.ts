export interface Account {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  created_at: string;
}

export interface TrialBalanceRow {
  account: Account,
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceResponse {
  from: string | null;
  to: string | null;
  data: TrialBalanceRow[];
}

export interface TrialBalanceParams {
  from?: string;
  to?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  document_id?: string | null;
  debit_account_id: string;
  credit_account_id: string;
  debit_account_code?: string | null;
  credit_account_code?: string | null;  
  debit_account_name: string;
  credit_account_name: string;
  document_number?: string;
  amount: number;
  description?: string;
  created_at: string;
}

export interface JournalResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
  data: JournalEntry[];
}

export interface GetJournalParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

export interface CreateJournalEntryDto {
  date?: string;
  document_id?: string | null;
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  description?: string;
}

export interface AccountCardTransaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  correspondent_account_code: string;
  correspondent_account_name: string;
  document_number: string | null;
}

export interface AccountCardResponse {
  account: Account;
  from: string;
  to: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  transactions: AccountCardTransaction[];
}

export interface AccountCardParams {
  accountId: string;
  from: string;
  to: string;
}
