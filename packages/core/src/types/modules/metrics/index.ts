import { Expense, ExpenseCategory } from "..";

export interface DashboardSummary {
  currentMonthTotal: number;
  previousMonthVariationPercentage: number;
  topCategory: {
    code: ExpenseCategory;
    total: number;
  };
  lastExpenses: Expense[];
  // lastIncomes?: Income[];
}

export interface MonthlyMetric {
  month: string;
  total: number;
}
