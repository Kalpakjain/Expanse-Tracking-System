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
  account_id: string | null;
  account_name: string;
  account_display_name: string;
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
  account_id: string | null;
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

export type UpdateTransactionInput = CreateTransactionInput;

export type PaymentAccount = {
  id: string;
  name: string;
  type: "cash" | "bank" | "upi" | "credit_card" | "wallet";
  institution_name: string;
  opening_balance: number;
  current_balance: number;
  currency_code: string;
  color: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreatePaymentAccountInput = {
  name: string;
  type: "cash" | "bank" | "upi" | "credit_card" | "wallet";
  institution_name: string;
  opening_balance: number;
  currency_code: string;
  color: string;
  is_default: boolean;
};

export type DashboardSummary = {
  total_income: number;
  total_expenses: number;
  balance: number;
  transaction_count: number;
  category_count: number;
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  is_demo: boolean;
  created_at: string;
};

export type AuthSession = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type AuthRegisterInput = {
  email: string;
  full_name: string;
  password: string;
};

export type AuthLoginInput = {
  email: string;
  password: string;
};

export type Budget = {
  id: string;
  category_id: string;
  category_name: string;
  month: number;
  year: number;
  limit_amount: number;
  spent_amount: number;
  remaining_amount: number;
  utilization_percent: number;
  currency_code: string;
  alert_threshold_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateBudgetInput = {
  category_id: string;
  month: number;
  year: number;
  limit_amount: number;
  currency_code: string;
  alert_threshold_percent: number;
};

export type CategoryReportItem = {
  category_id: string;
  category_name: string;
  category_color: string;
  spent_amount: number;
  transaction_count: number;
  budget_limit: number | null;
  remaining_amount: number | null;
  utilization_percent: number | null;
};

export type ReportsOverview = {
  summary: DashboardSummary;
  category_breakdown: CategoryReportItem[];
  smart_insights: SmartInsight[];
  budgets: Budget[];
  monthly_budget_total: number;
  over_budget_count: number;
  budgeted_categories: number;
};

export type SmartInsight = {
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
};

export type NotificationPreferences = {
  id: string;
  phone_number: string;
  daily_digest_enabled: boolean;
  budget_alerts_enabled: boolean;
  weekly_report_enabled: boolean;
  preferred_send_hour: number;
  timezone: string;
  currency_code: string;
  created_at: string;
  updated_at: string;
};

export type NotificationPreferencesInput = {
  phone_number: string;
  daily_digest_enabled: boolean;
  budget_alerts_enabled: boolean;
  weekly_report_enabled: boolean;
  preferred_send_hour: number;
  timezone: string;
  currency_code: string;
};

export type Receipt = {
  id: string;
  file_name: string;
  content_type: string;
  file_size: number;
  status: string;
  extracted_text: string;
  merchant_name: string;
  suggested_amount: number | null;
  suggested_category_id: string | null;
  suggested_category_name: string | null;
  confidence_score: number;
  created_at: string;
  updated_at: string;
};
