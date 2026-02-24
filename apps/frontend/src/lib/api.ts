import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

import type {
  CreateExpensePayload,
  DashboardSummary,
  Expense,
  FiltersForList,
  PaginatedResponse,
} from "@packages/core";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
});

api.interceptors.request.use(async (config) => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (token) config.headers.Authorization = token;
  return config;
});

export async function createExpense(
  payload: CreateExpensePayload,
): Promise<void> {
  await api.post("/expenses", payload);
}

export async function listExpenses(
  filters: FiltersForList,
): Promise<PaginatedResponse<Expense>> {
  const response = await api.get("/expenses", { params: filters });
  return response.data;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get("/metrics/dashboard-summary");
  return response.data;
}
