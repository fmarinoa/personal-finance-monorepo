import type {
  AttachmentUrls,
  CategoryBreakdown,
  CategoryBreakdownFilters,
  CreateExpensePayload,
  CreateIncomePayload,
  DashboardChartPoint,
  DashboardSummary,
  DateRange,
  DeleteReason,
  Expense,
  FiltersForList,
  Income,
  PaginatedResponse,
} from "@packages/core";
import { fetchAuthSession } from "aws-amplify/auth";
import axios from "axios";

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
): Promise<{ id: string }> {
  const response = await api.post("/expenses", payload);
  return response.data;
}

export async function updateExpense(
  id: string,
  payload: Partial<CreateExpensePayload>,
): Promise<void> {
  await api.patch(`/expenses/${id}`, payload);
}

export async function deleteExpense(
  id: string,
  reason: DeleteReason,
): Promise<void> {
  await api.delete(`/expenses/${id}`, { params: { reason } });
}

export async function listExpenses(
  filters: FiltersForList,
): Promise<PaginatedResponse<Expense>> {
  const response = await api.get("/expenses", { params: filters });
  return response.data;
}

export async function getExpenseAttachment(
  id: string,
  contentType: string,
  filename: string,
): Promise<AttachmentUrls> {
  const response = await api.get(`/expenses/${id}/attachment`, {
    params: { contentType, filename },
  });
  return response.data;
}

export async function listIncomes(
  filters: FiltersForList & { onlyReceived?: boolean },
): Promise<PaginatedResponse<Income>> {
  const response = await api.get("/incomes", { params: filters });
  return response.data;
}

export async function createIncome(
  payload: CreateIncomePayload,
): Promise<{ id: string }> {
  const response = await api.post(`/incomes`, payload);
  return response.data;
}

export async function updateIncome(
  id: string,
  payload: Partial<CreateIncomePayload>,
): Promise<void> {
  await api.patch(`/incomes/${id}`, payload);
}

export async function getIncomeAttachment(
  id: string,
  contentType: string,
  filename: string,
): Promise<AttachmentUrls> {
  const response = await api.get(`/incomes/${id}/attachment`, {
    params: { contentType, filename },
  });
  return response.data;
}

export async function fetchDashboardSummary(
  params: DateRange & { onlyReceived?: boolean },
): Promise<DashboardSummary> {
  const response = await api.get("/metrics/dashboard-summary", {
    params,
  });
  return response.data;
}

export async function fetchDashboardChart(
  params: DateRange & { onlyReceived?: boolean },
): Promise<DashboardChartPoint> {
  const response = await api.get("/metrics/dashboard-chart", { params });
  return response.data;
}

export async function fetchCategoryBreakdown(
  params: CategoryBreakdownFilters,
): Promise<CategoryBreakdown> {
  const response = await api.get("/metrics/category-breakdown", { params });
  return response.data;
}

export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
}
