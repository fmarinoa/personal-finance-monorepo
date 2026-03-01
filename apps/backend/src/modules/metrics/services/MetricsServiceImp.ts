import { DashboardChartPoint, DashboardSummary } from "@packages/core";
import { DateTime } from "luxon";

import { Expense } from "@/modules/expenses/domains";
import { DbRepository as ExpensesRepository } from "@/modules/expenses/repositories/DbRepository";
import { Income } from "@/modules/incomes/domains";
import { DbRepository as IncomesRepository } from "@/modules/incomes/repositories/DbRepository";

import { MetricsService } from "./MetricsService";

interface MetricsServiceImpProps {
  expensesRepository: ExpensesRepository;
  incomesRepository: IncomesRepository;
  options: {
    lastMonthsForChart: number;
    lastRecordsForSummary: number;
  };
}

export class MetricsServiceImp implements MetricsService {
  constructor(private readonly props: MetricsServiceImpProps) {}

  async getDashboardSummary(
    userId: string,
    params: { startDate: number; endDate: number },
  ): Promise<DashboardSummary> {
    const [{ data: lastExpenses }, { data: lastIncomes }] = await Promise.all([
      this.props.expensesRepository.list(userId, {
        startDate: params.startDate,
        endDate: params.endDate,
      }),
      this.props.incomesRepository.list(userId, {
        startDate: params.startDate,
        endDate: params.endDate,
      }),
    ]);

    const totalAmountExpenses =
      Expense.calculateTotalExpenseAmount(lastExpenses);

    const totalAmountIncomes = Income.calculateTotalIncomeAmount(lastIncomes);

    return {
      totalAmountExpenses,
      totalAmountIncomes,
      balance: totalAmountIncomes - totalAmountExpenses,
      lastExpenses: lastExpenses.slice(
        0,
        this.props.options.lastRecordsForSummary,
      ),
      lastIncomes: lastIncomes.slice(
        0,
        this.props.options.lastRecordsForSummary,
      ),
    };
  }

  async getDashboardChart(userId: string): Promise<DashboardChartPoint[]> {
    const months = this.props.options.lastMonthsForChart;
    const chartData: DashboardChartPoint[] = [];
    const now = DateTime.now();

    for (let i = 0; i < months; i++) {
      const month = now.minus({ months: i }).startOf("month");
      const start = month.toMillis();
      const end = month.endOf("month").toMillis();

      const [{ data: lastExpenses }, { data: lastIncomes }] = await Promise.all(
        [
          this.props.expensesRepository.list(userId, {
            startDate: start,
            endDate: end,
          }),
          this.props.incomesRepository.list(userId, {
            startDate: start,
            endDate: end,
          }),
        ],
      );

      const totalAmountExpenses =
        Expense.calculateTotalExpenseAmount(lastExpenses);

      const totalAmountIncomes = Income.calculateTotalIncomeAmount(lastIncomes);

      chartData.push({
        month: month.toFormat("yyyy-MM"),
        totalAmountIncomes,
        totalAmountExpenses,
      });
    }

    return [...chartData].sort((a, b) => a.month.localeCompare(b.month));
  }
}
