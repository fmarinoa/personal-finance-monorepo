import {
  CategoryBreakdown,
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
    params: DateRange & { onlyReceived?: boolean },
  ): Promise<DashboardSummary> {
    const [{ data: lastExpenses }, { data: lastIncomes }] = await Promise.all([
      this.props.expensesRepository.list(userId, {
        startDate: params.startDate,
        endDate: params.endDate,
      }),
      this.props.incomesRepository.list(userId, {
        startDate: params.startDate,
        endDate: params.endDate,
        onlyReceived: params.onlyReceived,
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
    params: DateRange & { onlyReceived?: boolean },
  ): Promise<DashboardChartPoint> {
    const [{ data: allExpenses }, { data: allIncomes }] = await Promise.all([
      this.props.expensesRepository.list(userId, {
        startDate: params.startDate,
        endDate: params.endDate,
      }),
      this.props.incomesRepository.list(userId, {
        startDate: params.startDate,
        endDate: params.endDate,
        onlyReceived: params.onlyReceived,
      }),
    ]);

    const expensesByMonth = Expense.groupExpensesByMonth(allExpenses);
    const incomesByMonth = Income.groupIncomesByMonth(allIncomes);

    const allMonths = new Set([
      ...Object.keys(expensesByMonth),
      ...Object.keys(incomesByMonth),
    ]);

    let totalAmountExpenses = 0;
    let totalAmountIncomes = 0;
    let totalBalance = 0;

    const months = [...allMonths].sort().map((month) => {
      const monthExpenses = expensesByMonth[month]
        ? Expense.calculateTotalExpenseAmount(expensesByMonth[month])
        : 0;
      const monthIncomes = incomesByMonth[month]
        ? Income.calculateTotalIncomeAmount(incomesByMonth[month])
        : 0;
      const balance = monthIncomes - monthExpenses;

      totalAmountExpenses += monthExpenses;
      totalAmountIncomes += monthIncomes;
      totalBalance += balance;

      return {
        month,
        totalAmountIncomes: monthIncomes,
        totalAmountExpenses: monthExpenses,
        balance,
      };
    });

    return {
      months,
      total: {
        totalAmountIncomes,
        totalAmountExpenses,
        balance: totalBalance,
      },
    };
  }

  async getCategoryBreakdown(
    userId: string,
    params: DateRange & { onlyReceived?: boolean },
  ): Promise<CategoryBreakdown> {
    const [{ data: allExpenses }, { data: allIncomes }] = await Promise.all([
      this.props.expensesRepository.list(userId, {
        startDate: params.startDate,
        endDate: params.endDate,
      }),
      this.props.incomesRepository.list(userId, {
        startDate: params.startDate,
        endDate: params.endDate,
        onlyReceived: params.onlyReceived,
      }),
    ]);

    const totalExpenses = Expense.calculateTotalExpenseAmount(allExpenses);
    const totalIncomes = Income.calculateTotalIncomeAmount(allIncomes);

    const expensesByCategory = Expense.groupExpensesByCategory(allExpenses);
    const incomesByCategory = Income.groupIncomesByCategory(allIncomes);

    const expenses = Object.entries(expensesByCategory)
      .map(([category, items]) => {
        const total = Expense.calculateTotalExpenseAmount(items);
        return {
          category,
          total,
          percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    const incomes = Object.entries(incomesByCategory)
      .map(([category, items]) => {
        const total = Income.calculateTotalIncomeAmount(items);
        return {
          category,
          total,
          percentage: totalIncomes > 0 ? (total / totalIncomes) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { expenses, incomes };
  }
}
