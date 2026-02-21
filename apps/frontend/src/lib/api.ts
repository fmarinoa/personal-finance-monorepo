import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";
import type { CreateExpensePayload } from "@packages/core";

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
