export type Category = {
  id: string;
  name: string;
  type: "expense" | "income";
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateCategoryInput = {
  name: string;
  type: "expense" | "income";
  color: string;
  icon: string;
};

export type Transaction = {
  id: string;
  account_name: string;
  category_id: string;
  category_name: string;
  type: "expense" | "income";
  amount: number;
  currency_code: string;
  merchant_name: string;
  description: string;
  transaction_date: string;
  payment_method: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type CreateTransactionInput = {
  account_name: string;
  category_id: string;
  type: "expense" | "income";
  amount: number;
  currency_code: string;
  merchant_name: string;
  description: string;
  transaction_date: string;
  payment_method: string;
  notes: string;
};

export type DashboardSummary = {
  total_income: number;
  total_expenses: number;
  balance: number;
  transaction_count: number;
  category_count: number;
};
