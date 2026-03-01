import {
  DashboardChartPoint,
  DashboardSummary,
  DateRange,
} from "@packages/core";

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
    params: DateRange,
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

  async getDashboardChart(
    userId: string,
    params: DateRange,
  ): Promise<DashboardChartPoint[]> {
    const chartData: DashboardChartPoint[] = [];
    const [{ data: allExpenses }, { data: allIncomes }] = await Promise.all([
      this.props.expensesRepository.list(userId, {
        startDate: params.startDate,
        endDate: params.endDate,
      }),
      this.props.incomesRepository.list(userId, {
        startDate: params.startDate,
        endDate: params.endDate,
      }),
    ]);

    const expensesByMonth = Expense.groupExpensesByMonth(allExpenses);
    const incomesByMonth = Income.groupIncomesByMonth(allIncomes);

    const allMonths = new Set([
      ...Object.keys(expensesByMonth),
      ...Object.keys(incomesByMonth),
    ]);

    for (const month of allMonths) {
      const totalAmountExpenses = expensesByMonth[month]
        ? Expense.calculateTotalExpenseAmount(expensesByMonth[month])
        : 0;

      const totalAmountIncomes = incomesByMonth[month]
        ? Income.calculateTotalIncomeAmount(incomesByMonth[month])
        : 0;

      chartData.push({
        month,
        totalAmountExpenses,
        totalAmountIncomes,
      });
    }

    return [...chartData].sort((a, b) => a.month.localeCompare(b.month));
  }
}
