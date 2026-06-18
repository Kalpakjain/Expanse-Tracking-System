import type {
  AuthLoginInput,
  AuthRegisterInput,
  AuthSession,
  Budget,
  Category,
  CreateBudgetInput,
  CreateCategoryInput,
  CreatePaymentAccountInput,
  CreateTransactionInput,
  DashboardSummary,
  NotificationPreferences,
  NotificationPreferencesInput,
  PaymentAccount,
  Receipt,
  ReportsOverview,
  Transaction,
  UpdateTransactionInput,
  User,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
const AUTH_TOKEN_KEY = "fintrack_access_token";

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function postJson<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export function register(payload: AuthRegisterInput) {
  return postJson<AuthSession, AuthRegisterInput>("/api/v1/auth/register", payload);
}

export function login(payload: AuthLoginInput) {
  return postJson<AuthSession, AuthLoginInput>("/api/v1/auth/login", payload);
}

export function getCurrentUser() {
  return fetchJson<User>("/api/v1/auth/me");
}

export function getSummary() {
  return fetchJson<DashboardSummary>("/api/v1/reports/summary");
}

export function getTransactions() {
  return fetchJson<Transaction[]>("/api/v1/transactions");
}

export function getCategories() {
  return fetchJson<Category[]>("/api/v1/categories");
}

export function getAccounts() {
  return fetchJson<PaymentAccount[]>("/api/v1/accounts");
}

export function createAccount(payload: CreatePaymentAccountInput) {
  return postJson<PaymentAccount, CreatePaymentAccountInput>("/api/v1/accounts", payload);
}

export async function updateAccount(accountId: string, payload: CreatePaymentAccountInput) {
  const response = await fetch(`${API_BASE_URL}/api/v1/accounts/${accountId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<PaymentAccount>;
}

export async function deactivateAccount(accountId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/accounts/${accountId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
}

export function createCategory(payload: CreateCategoryInput) {
  return postJson<Category, CreateCategoryInput>("/api/v1/categories", payload);
}

export function createTransaction(payload: CreateTransactionInput) {
  return postJson<Transaction, CreateTransactionInput>("/api/v1/transactions", payload);
}

export async function updateTransaction(transactionId: string, payload: UpdateTransactionInput) {
  const response = await fetch(`${API_BASE_URL}/api/v1/transactions/${transactionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<Transaction>;
}

export async function deleteTransaction(transactionId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/transactions/${transactionId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
}

export function getBudgets() {
  return fetchJson<Budget[]>("/api/v1/budgets");
}

export function createBudget(payload: CreateBudgetInput) {
  return postJson<Budget, CreateBudgetInput>("/api/v1/budgets", payload);
}

export async function deleteBudget(budgetId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/budgets/${budgetId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
}

export function getReportsOverview() {
  return fetchJson<ReportsOverview>("/api/v1/reports/overview");
}

export function getNotificationPreferences() {
  return fetchJson<NotificationPreferences>("/api/v1/settings/notifications");
}

export async function updateNotificationPreferences(
  payload: NotificationPreferencesInput,
) {
  const response = await fetch(`${API_BASE_URL}/api/v1/settings/notifications`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<NotificationPreferences>;
}

export function getReceipts() {
  return fetchJson<Receipt[]>("/api/v1/receipts");
}

export async function uploadReceipt(payload: {
  file: File;
  merchant_hint: string;
  amount_hint: string;
}) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("merchant_hint", payload.merchant_hint);
  if (payload.amount_hint) {
    formData.append("amount_hint", payload.amount_hint);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/receipts`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<Receipt>;
}
