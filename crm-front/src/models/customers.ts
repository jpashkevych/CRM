import type { Pagination } from "./products";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  total_spent: number;
  created_at: string;
}

export interface CustomersResponse {
  data: Customer[];
  pagination: Pagination;
}
