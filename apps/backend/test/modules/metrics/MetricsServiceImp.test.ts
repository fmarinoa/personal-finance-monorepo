import { beforeEach,describe, expect, it, vi } from "vitest";

import { Expense } from "@/modules/expenses/domains/Expense";
import type { DbRepository as ExpensesRepository } from "@/modules/expenses/repositories/DbRepository";
import { Income } from "@/modules/incomes/domains/Income";
import type { DbRepository as IncomesRepository } from "@/modules/incomes/repositories/DbRepository";
import { MetricsServiceImp } from "@/modules/metrics/services/MetricsServiceImp";
import { User } from "@/modules/shared/domains/User";

const user = new User({ id: "user-1" });
const dateRange = { startDate: 1_700_000_000_000, endDate: 1_709_000_000_000 };

function makeExpense(category: string, amount: number): Expense {
  return new Expense({
    id: `e-${category}-${amount}`,
    user,
    amount,
    category: category as any,
    description: "test",
    paymentMethod: "CASH" as any,
    paymentDate: 1_700_000_000_000,
    creationDate: 1_700_000_000_000,
    status: "ACTIVE" as any,
  });
}

function makeIncome(category: string, amount: number): Income {
  return new Income({
    id: `i-${category}-${amount}`,
    user,
    amount,
    category: category as any,
    description: "test",
    receivedDate: 1_700_000_000_000,
    effectiveDate: 1_700_000_000_000,
    creationDate: 1_700_000_000_000,
    status: "RECEIVED" as any,
  });
}

describe("MetricsServiceImp.getCategoryBreakdown", () => {
  let expensesRepo: ExpensesRepository;
  let incomesRepo: IncomesRepository;
  let service: MetricsServiceImp;

  beforeEach(() => {
    expensesRepo = {
      create: vi.fn(),
      list: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ExpensesRepository;
    incomesRepo = {
      create: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as IncomesRepository;
    service = new MetricsServiceImp({
      expensesRepository: expensesRepo,
      incomesRepository: incomesRepo,
      options: { lastMonthsForChart: 6, lastRecordsForSummary: 5 },
    });
  });

  it("returns empty breakdown when no data", async () => {
    vi.mocked(expensesRepo.list).mockResolvedValue({
      data: [],
      nextToken: undefined,
    });
    vi.mocked(incomesRepo.list).mockResolvedValue({
      data: [],
      nextToken: undefined,
    });

    const result = await service.getCategoryBreakdown("user-1", dateRange);

    expect(result.expenses).toHaveLength(0);
    expect(result.incomes).toHaveLength(0);
  });

  it("aggregates expenses by category with correct totals and percentages", async () => {
    vi.mocked(expensesRepo.list).mockResolvedValue({
      data: [
        makeExpense("FOOD", 200),
        makeExpense("FOOD", 100),
        makeExpense("TRANSPORT", 100),
      ],
      nextToken: undefined,
    });
    vi.mocked(incomesRepo.list).mockResolvedValue({
      data: [],
      nextToken: undefined,
    });

    const result = await service.getCategoryBreakdown("user-1", dateRange);

    const food = result.expenses.find((e) => e.category === "FOOD")!;
    const transport = result.expenses.find((e) => e.category === "TRANSPORT")!;

    expect(food.total).toBe(300);
    expect(food.percentage).toBeCloseTo(75);
    expect(transport.total).toBe(100);
    expect(transport.percentage).toBeCloseTo(25);
  });

  it("sorts categories by total descending", async () => {
    vi.mocked(expensesRepo.list).mockResolvedValue({
      data: [makeExpense("TRANSPORT", 50), makeExpense("FOOD", 200)],
      nextToken: undefined,
    });
    vi.mocked(incomesRepo.list).mockResolvedValue({
      data: [],
      nextToken: undefined,
    });

    const result = await service.getCategoryBreakdown("user-1", dateRange);

    expect(result.expenses[0].category).toBe("FOOD");
    expect(result.expenses[1].category).toBe("TRANSPORT");
  });

  it("aggregates incomes by category correctly", async () => {
    vi.mocked(expensesRepo.list).mockResolvedValue({
      data: [],
      nextToken: undefined,
    });
    vi.mocked(incomesRepo.list).mockResolvedValue({
      data: [
        makeIncome("SALARY", 3000),
        makeIncome("SALARY", 1000),
        makeIncome("GIFT", 500),
      ],
      nextToken: undefined,
    });

    const result = await service.getCategoryBreakdown("user-1", dateRange);

    const salary = result.incomes.find((i) => i.category === "SALARY")!;
    const gift = result.incomes.find((i) => i.category === "GIFT")!;

    expect(salary.total).toBe(4000);
    expect(salary.percentage).toBeCloseTo(88.89, 1);
    expect(gift.total).toBe(500);
    expect(gift.percentage).toBeCloseTo(11.11, 1);
  });
});
