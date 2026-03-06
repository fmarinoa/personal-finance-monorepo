import type { DateRange } from "../..";
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

export interface CategoryBreakdownFilters extends DateRange {
  onlyExpenses?: boolean;
  onlyIncomes?: boolean;
}

export interface CategoryBreakdownItem {
  category: string;
  total: number;
  percentage: number;
}

export interface CategoryBreakdown {
  expenses?: CategoryBreakdownItem[];
  incomes?: CategoryBreakdownItem[];
}
