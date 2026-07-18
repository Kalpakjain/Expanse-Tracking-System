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
  email_verified: boolean;
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

export type AuthRegisterResponse = {
  email: string;
  verification_required: boolean;
  dev_verification_code: string | null;
};

export type AuthLoginInput = {
  email: string;
  password: string;
};

export type VerifyEmailInput = {
  email: string;
  code: string;
};

export type ResetPasswordInput = {
  email: string;
  code: string;
  password: string;
};

export type ChangePasswordInput = {
  current_password: string;
  new_password: string;
};

export type GroupMember = {
  user_id: string;
  full_name: string;
  email: string;
  is_placeholder: boolean;
};

export type Group = {
  id: string;
  name: string;
  created_by: string;
  members: GroupMember[];
  created_at: string;
};

export type CreateGroupInput = {
  name: string;
  member_names: string[];
};

export type GroupExpenseSplitInput = {
  user_id: string;
  value: number;
};

export type GroupExpenseSplit = {
  user_id: string;
  full_name: string;
  amount_owed: number;
  is_settled: boolean;
};

export type GroupExpense = {
  id: string;
  group_id: string;
  paid_by: string;
  paid_by_name: string;
  amount: number;
  description: string;
  expense_date: string;
  split_type: string;
  splits: GroupExpenseSplit[];
  created_at: string;
};

export type CreateGroupExpenseInput = {
  group_id?: string;
  paid_by: string | null;
  amount: number;
  description: string;
  category_id: string | null;
  expense_date: string;
  split_type: "equal" | "percentage" | "custom";
  splits: GroupExpenseSplitInput[] | null;
};

export type Settlement = {
  id: string;
  group_id: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  amount: number;
  note: string;
  settled_at: string;
};

export type CreateSettlementInput = {
  group_id?: string;
  to_user_id: string;
  amount: number;
  note: string;
};

export type GroupBalanceEntry = {
  user_id: string;
  full_name: string;
  net_balance: number;
};

export type GroupBalanceRead = {
  group_id: string;
  balances: GroupBalanceEntry[];
};

export type CategoryReportItem = {
  category_id: string;
  category_name: string;
  category_color: string;
  spent_amount: number;
  transaction_count: number;
};

export type ReportsOverview = {
  summary: DashboardSummary;
  category_breakdown: CategoryReportItem[];
  smart_insights: SmartInsight[];
};

export type SmartInsight = {
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
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
  duplicate_count: number;
  created_at: string;
  updated_at: string;
};

export type CreateReceiptTransactionInput = {
  account_name: string;
  account_id: string | null;
  category_id: string | null;
  amount: number | null;
  transaction_date: string;
  payment_method: string;
  description: string;
  notes: string;
};
