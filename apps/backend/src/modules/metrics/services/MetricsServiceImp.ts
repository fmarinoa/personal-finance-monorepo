import { DashboardSummary, ExpenseCategory } from "@packages/core";
import { DateTime } from "luxon";
import { DbRepository } from "@/modules/expenses/repositories/DbRepository";
import { Expense } from "@/modules/expenses/domains";
import { MetricsService } from "./MetricsService";

interface MetricsServiceImpProps {
  expensesRepository: DbRepository;
}

export class MetricsServiceImp implements MetricsService {
  constructor(private readonly props: MetricsServiceImpProps) {}

  async getDashboardSummary(
    userId: string,
    params: { period: string },
  ): Promise<DashboardSummary> {
    const dt = DateTime.fromFormat(params.period, "yyyy-MM");
    const currentStart = dt.startOf("month").toMillis();
    const currentEnd = dt.endOf("month").toMillis();
    const prevDt = dt.minus({ months: 1 });
    const previousStart = prevDt.startOf("month").toMillis();
    const previousEnd = prevDt.endOf("month").toMillis();

    const [{ data: currentExpenses }, { data: previousExpenses }] =
      await Promise.all([
        this.props.expensesRepository.list(userId, {
          startDate: currentStart,
          endDate: currentEnd,
        }),
        this.props.expensesRepository.list(userId, {
          startDate: previousStart,
          endDate: previousEnd,
        }),
      ]);

    const currentMonthTotal = currentExpenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    );
    const previousMonthTotal = previousExpenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    );

    const previousMonthVariationPercentage =
      previousMonthTotal === 0
        ? 0
        : Math.round(
            ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) *
              1000,
          ) / 10;

    return {
      currentMonthTotal,
      previousMonthVariationPercentage,
      topCategory: this.computeTopCategory(currentExpenses),
    };
  }

  private computeTopCategory(
    expenses: Expense[],
  ): DashboardSummary["topCategory"] {
    const totals = new Map<ExpenseCategory, number>();

    for (const expense of expenses) {
      totals.set(
        expense.category,
        (totals.get(expense.category) ?? 0) + expense.amount,
      );
    }

    let topCode: ExpenseCategory = "OTHER";
    let topTotal = 0;

    for (const [code, total] of totals) {
      if (total > topTotal) {
        topTotal = total;
        topCode = code;
      }
    }

    return { code: topCode, total: topTotal };
  }
}
