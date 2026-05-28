export interface SummaryStats {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface SalesByDay {
  date: string;
  amount: number;
}

export interface SalesResponse {
  salesByDay: SalesByDay[];
}

export interface TopCustomer {
  name: string;
  spent: number;
}

export interface LowStockProduct {
  name: string;
  stock: number;
}

export interface AdditionalStats {
  topCustomer: TopCustomer | null;
  lowStockProducts: LowStockProduct[];
  pendingOrders: number;
}