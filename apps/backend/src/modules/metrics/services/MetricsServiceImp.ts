import { DashboardSummary } from "@packages/core";
import { DateTime } from "luxon";

import { DbRepository as ExpensesRepository } from "@/modules/expenses/repositories/DbRepository";
import { DbRepository as IncomesRepository } from "@/modules/incomes/repositories/DbRepository";

import { MetricsService } from "./MetricsService";

interface MetricsServiceImpProps {
  expensesRepository: ExpensesRepository;
  incomesRepository: IncomesRepository;
  options: {
    lastMonthsForChart: number;
  };
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

    const [
      { data: lastExpenses, totalAmount: totalAmountExpenses },
      { data: lastIncomes, totalAmount: totalAmountIncomes },
    ] = await Promise.all([
      this.props.expensesRepository.list(userId, {
        startDate: currentStart,
        endDate: currentEnd,
        limit: 5,
      }),
      this.props.incomesRepository.list(userId, {
        startDate: currentStart,
        endDate: currentEnd,
        limit: 5,
      }),
    ]);

    return {
      totalAmountExpenses,
      totalAmountIncomes,
      balance: totalAmountIncomes - totalAmountExpenses,
      lastExpenses,
      lastIncomes,
    };
  }

  async getDashboardChart(userId: string) {
    const months = this.props.options.lastMonthsForChart;
    const chartData: any[] = [];
    const now = DateTime.now();

    for (let i = 0; i < months; i++) {
      const month = now.minus({ months: i }).startOf("month");
      const start = month.toMillis();
      const end = month.endOf("month").toMillis();

      const [
        { totalAmount: totalAmountIncomes },
        { totalAmount: totalAmountExpenses },
      ] = await Promise.all([
        this.props.incomesRepository.list(userId, {
          startDate: start,
          endDate: end,
        }),
        this.props.expensesRepository.list(userId, {
          startDate: start,
          endDate: end,
        }),
      ]);

      chartData.push({
        month: month.toFormat("yyyy-MM"),
        totalAmountIncomes,
        totalAmountExpenses,
      });
    }

    return [...chartData].sort((a, b) => a.month.localeCompare(b.month));
  }
}
