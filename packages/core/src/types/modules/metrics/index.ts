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

export interface DashboardChartPoint {
  months: (BaseDashboard & {
    month: string; // "YYYY-MM"
    balance: number;
  })[];
  total: BaseDashboard & {
    balance: number;
  };
}

export interface MonthlyMetric {
  month: string;
  total: number;
}

export interface CategoryBreakdownItem {
  category: string;
  total: number;
  percentage: number;
}

export interface CategoryBreakdown {
  expenses: CategoryBreakdownItem[];
  incomes: CategoryBreakdownItem[];
}
