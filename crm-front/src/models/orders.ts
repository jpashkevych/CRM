import type { Pagination } from "./products";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  status: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrdersResponse {
  data: Order[];
  pagination: Pagination;
}
