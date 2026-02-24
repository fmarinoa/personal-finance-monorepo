import { ExpenseCategory } from "..";

export interface DashboardSummary {
  currentMonthTotal: number;
  previousMonthVariationPercentage: number;
  topCategory: {
    code: ExpenseCategory;
    total: number;
  };
}

export interface MonthlyMetric {
  month: string;
  total: number;
}
