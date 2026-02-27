import type { Expense, Income } from "..";

export interface BaseDashboard {
  totalAmountIncomes: number;
  totalAmountExpenses: number;
}

export interface DashboardSummary extends BaseDashboard {
  balance: number;
  lastExpenses: Expense[];
  lastIncomes: Income[];
}

export interface DashboardChartPoint extends BaseDashboard {
  month: string; // "YYYY-MM"
}

export interface MonthlyMetric {
  month: string;
  total: number;
}
