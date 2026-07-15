import type {
  AuthLoginInput,
  AuthRegisterInput,
  AuthRegisterResponse,
  AuthSession,
  Budget,
  Category,
  ChangePasswordInput,
  CreateBudgetInput,
  CreateCategoryInput,
  CreateGroupExpenseInput,
  CreateGroupInput,
  CreatePaymentAccountInput,
  CreateReceiptTransactionInput,
  CreateSettlementInput,
  CreateTransactionInput,
  DashboardSummary,
  Group,
  GroupBalanceEntry,
  GroupBalanceRead,
  GroupExpense,
  NotificationPreferences,
  NotificationPreferencesInput,
  NotificationPreview,
  PaymentAccount,
  Receipt,
  ReportsOverview,
  ResetPasswordInput,
  Settlement,
  Transaction,
  UpdateTransactionInput,
  VerifyEmailInput,
  UpdateBudgetInput,
  User,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
const AUTH_TOKEN_KEY = "fintrack_access_token";

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? window.sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function saveAuthSession(session: AuthSession, rememberMe = true) {
  if (typeof window === "undefined") {
    return;
  }
  const persistentStorage = rememberMe ? window.localStorage : window.sessionStorage;
  const temporaryStorage = rememberMe ? window.sessionStorage : window.localStorage;
  temporaryStorage.removeItem(AUTH_TOKEN_KEY);
  persistentStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
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
    throw new Error(await responseErrorMessage(response));
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
    throw new Error(await responseErrorMessage(response));
  }

  return response.json() as Promise<TResponse>;
}

async function responseErrorMessage(response: Response) {
  try {
    const body = await response.json();
    if (typeof body.detail === "string") {
      return body.detail;
    }
    if (Array.isArray(body.detail) && body.detail[0]?.msg) {
      return body.detail[0].msg;
    }
  } catch {
    // Fall through to the generic status message.
  }
  return `Request failed with status ${response.status}`;
}

export function register(payload: AuthRegisterInput) {
  return postJson<AuthRegisterResponse, AuthRegisterInput>("/api/v1/auth/register", payload);
}

export function login(payload: AuthLoginInput) {
  return postJson<AuthSession, AuthLoginInput>("/api/v1/auth/login", payload);
}

export function verifyEmail(payload: VerifyEmailInput) {
  return postJson<AuthSession, VerifyEmailInput>("/api/v1/auth/verify-email", payload);
}

export function verifyOtp(payload: VerifyEmailInput) {
  return postJson<AuthSession, VerifyEmailInput>("/api/v1/auth/verify-otp", payload);
}

export function sendOtp(email: string) {
  return postJson<AuthRegisterResponse, { email: string }>("/api/v1/auth/send-otp", { email });
}

export function resendVerification(email: string) {
  return postJson<AuthRegisterResponse, { email: string }>("/api/v1/auth/resend-verification", { email });
}

export function forgotPassword(email: string) {
  return postJson<AuthRegisterResponse, { email: string }>("/api/v1/auth/forgot-password", { email });
}

export function resetPassword(payload: ResetPasswordInput) {
  return postJson<AuthSession, ResetPasswordInput>("/api/v1/auth/reset-password", payload);
}

export async function changePassword(payload: ChangePasswordInput) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }
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

export async function exportTransactionsCsv() {
  const response = await fetch(`${API_BASE_URL}/api/v1/transactions/export`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.blob();
}

export async function importTransactionsCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/transactions/import`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<{ imported_count: number; skipped_count: number }>;
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

export async function updateBudget(budgetId: string, payload: UpdateBudgetInput) {
  const response = await fetch(`${API_BASE_URL}/api/v1/budgets/${budgetId}`, {
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

  return response.json() as Promise<Budget>;
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

export function listGroups() {
  return fetchJson<Group[]>("/api/v1/groups");
}

export function createGroup(payload: CreateGroupInput) {
  return postJson<Group, CreateGroupInput>("/api/v1/groups", payload);
}

export function getGroup(groupId: string) {
  return fetchJson<Group>(`/api/v1/groups/${groupId}`);
}

export function addGroupMember(groupId: string, name: string) {
  return postJson<Group, { name: string }>(`/api/v1/groups/${groupId}/members`, { name });
}

export function listGroupExpenses(groupId: string) {
  return fetchJson<GroupExpense[]>(`/api/v1/groups/${groupId}/expenses`);
}

export function createGroupExpense(groupId: string, payload: CreateGroupExpenseInput) {
  return postJson<GroupExpense, CreateGroupExpenseInput>(`/api/v1/groups/${groupId}/expenses`, payload);
}

export function getGroupBalances(groupId: string) {
  return fetchJson<GroupBalanceRead>(`/api/v1/groups/${groupId}/balances`);
}

export function getFriendBalances() {
  return fetchJson<GroupBalanceEntry[]>("/api/v1/groups/friends/balances");
}

export function listSettlements(groupId: string) {
  return fetchJson<Settlement[]>(`/api/v1/groups/${groupId}/settlements`);
}

export function createSettlement(groupId: string, payload: CreateSettlementInput) {
  return postJson<Settlement, CreateSettlementInput>(`/api/v1/groups/${groupId}/settlements`, payload);
}

export function getNotificationPreferences() {
  return fetchJson<NotificationPreferences>("/api/v1/settings/notifications");
}

export function getNotificationPreview() {
  return fetchJson<NotificationPreview>("/api/v1/settings/notifications/preview");
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

export function createReceiptTransaction(receiptId: string, payload: CreateReceiptTransactionInput) {
  return postJson<Transaction, CreateReceiptTransactionInput>(
    `/api/v1/receipts/${receiptId}/transaction`,
    payload,
  );
}
