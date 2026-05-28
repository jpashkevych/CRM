import type { Pagination } from "./products";

export type DocumentStatus = "draft" | "issued" | "paid" | "cancelled";

export type DocumentType = "invoice" | "act" | "payment";

export interface Document {
  id: string;
  type: DocumentType;
  number: string;
  date: string;
  customer_id: string;
  customer_name?: string;
  order_id?: string;
  amount: number;
  status: DocumentStatus;
  notes?: string;
  created_at: string;
}
export interface DocumentInsert {
  type: string;
  number: string;
  date?: string;
  customer_id: string;
  order_id?: string;
  amount: number;
  status?: DocumentStatus;
  notes?: string;
}

export interface DocumentsResponse {
  data: Document[];
  pagination: Pagination;
}
