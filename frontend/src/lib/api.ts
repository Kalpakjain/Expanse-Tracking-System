import type {
  Category,
  CreateCategoryInput,
  CreateTransactionInput,
  DashboardSummary,
  Transaction,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
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
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
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

export function createCategory(payload: CreateCategoryInput) {
  return postJson<Category, CreateCategoryInput>("/api/v1/categories", payload);
}

export function createTransaction(payload: CreateTransactionInput) {
  return postJson<Transaction, CreateTransactionInput>("/api/v1/transactions", payload);
}

export async function deleteTransaction(transactionId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/transactions/${transactionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
}
