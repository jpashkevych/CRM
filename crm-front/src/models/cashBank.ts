export type TransactionType = "receipt" | "payment";
export type TransactionTypeFilter = "all" | TransactionType;

export type JournalStatus = "pending" | "completed" | "cancelled";
export type JournalStatusFilter = "all" | JournalStatus;

export interface CashBankJournal {
  id: string;
  date: string;
  transaction_type: TransactionType;
  cash_account_id?: string | null;
  bank_account_id?: string | null;
  counterparty: string;
  description?: string;
  amount: number;
  currency: string;
  status: JournalStatus;
  document_number?: string;
  notes?: string;
  created_at: string;
}

export interface CashBankJournalResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
  data: CashBankJournal[];
}

export interface GetCashBankJournalParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
  from?: string;
  to?: string;
  type?: TransactionTypeFilter;
  status?: JournalStatusFilter;
}

export interface CreateCashBankJournalDto {
  date?: string;
  transaction_type: TransactionType;
  cash_account_id?: string | null;
  bank_account_id?: string | null;
  counterparty: string;
  description?: string;
  amount: number;
  currency?: string;
  status?: JournalStatus;
  document_number?: string;
  notes?: string;
}

export interface CashBankBalanceParams {
  from?: string;
  to?: string;
}

export interface CashBankBalanceResponse {
  cash: number;
  bank: number;
  total: number;
}
