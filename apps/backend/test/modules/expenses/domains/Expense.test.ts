import { describe, it, expect } from "vitest";
import { Expense } from "@/modules/expenses/domains/Expense";
import { User } from "@/modules/shared/domains/User";
import { BadRequestError } from "@packages/lambda";

const user = new User({ id: "user-123" });

const validCreatePayload = {
  user,
  amount: 100,
  description: "Lunch",
  category: "FOOD" as const,
  paymentMethod: "CASH" as const,
  paymentDate: 1700000000000,
};

describe("Expense domain", () => {
  describe("instanceForCreate", () => {
    it("returns an Expense instance for a valid payload", () => {
      const expense = Expense.instanceForCreate(validCreatePayload);
      expect(expense).toBeInstanceOf(Expense);
      expect(expense.amount).toBe(100);
      expect(expense.description).toBe("Lunch");
      expect(expense.category).toBe("FOOD");
    });

    it("defaults paymentDate to now when omitted", () => {
      const before = Date.now();
      const expense = Expense.instanceForCreate({
        ...validCreatePayload,
        paymentDate: undefined as any,
      });
      expect(expense.paymentDate).toBeGreaterThanOrEqual(before);
    });

    it("throws BadRequestError when amount is zero", () => {
      expect(() =>
        Expense.instanceForCreate({ ...validCreatePayload, amount: 0 }),
      ).toThrow(BadRequestError);
    });

    it("throws BadRequestError when amount is negative", () => {
      expect(() =>
        Expense.instanceForCreate({ ...validCreatePayload, amount: -50 }),
      ).toThrow(BadRequestError);
    });

    it("throws BadRequestError for an invalid category", () => {
      expect(() =>
        Expense.instanceForCreate({
          ...validCreatePayload,
          category: "INVALID" as any,
        }),
      ).toThrow(BadRequestError);
    });

    it("preserves the user reference on the created instance", () => {
      const expense = Expense.instanceForCreate(validCreatePayload);
      expect(expense.user.id).toBe("user-123");
    });
  });

  describe("instanceForUpdate", () => {
    const validUpdatePayload = {
      user,
      id: "expense-1",
      amount: 200,
      description: "Updated lunch",
      category: "TRANSPORT" as const,
      paymentMethod: "DEBIT_CARD" as const,
      paymentDate: 1700086400000,
    };

    it("returns an Expense instance when all fields are provided", () => {
      const expense = Expense.instanceForUpdate(validUpdatePayload);
      expect(expense).toBeInstanceOf(Expense);
      expect(expense.amount).toBe(200);
      expect(expense.category).toBe("TRANSPORT");
    });

    it("returns an Expense instance when only required fields (user + id) are provided", () => {
      const expense = Expense.instanceForUpdate({ user, id: "expense-1" });
      expect(expense).toBeInstanceOf(Expense);
      expect(expense.id).toBe("expense-1");
      expect(expense.amount).toBeUndefined();
    });

    it("throws BadRequestError when amount is zero", () => {
      expect(() =>
        Expense.instanceForUpdate({ ...validUpdatePayload, amount: 0 }),
      ).toThrow(BadRequestError);
    });

    it("throws BadRequestError when amount is negative", () => {
      expect(() =>
        Expense.instanceForUpdate({ ...validUpdatePayload, amount: -1 }),
      ).toThrow(BadRequestError);
    });

    it("throws BadRequestError for an invalid category", () => {
      expect(() =>
        Expense.instanceForUpdate({
          ...validUpdatePayload,
          category: "INVALID" as any,
        }),
      ).toThrow(BadRequestError);
    });
  });

  describe("instanceForDelete", () => {
    it("returns an Expense instance with onDelete.reason set", () => {
      const expense = Expense.instanceForDelete({
        user,
        id: "expense-1",
        reason: "DUPLICATE",
      });
      expect(expense).toBeInstanceOf(Expense);
      expect(expense.id).toBe("expense-1");
      expect(expense.onDelete?.reason).toBe("DUPLICATE");
    });

    it("throws BadRequestError for an invalid reason", () => {
      expect(() =>
        Expense.instanceForDelete({
          user,
          id: "expense-1",
          reason: "INVALID" as any,
        }),
      ).toThrow(BadRequestError);
    });

    it("preserves the user on the returned instance", () => {
      const expense = Expense.instanceForDelete({
        user,
        id: "expense-1",
        reason: "CANCELLED",
      });
      expect(expense.user.id).toBe("user-123");
    });
  });

  it("parses numeric string query params into numbers", () => {
    const { filters } = Expense.validateFilters({
      limit: "10" as any,
      page: "2" as any,
      startDate: "1700000000000" as any,
      endDate: "1700086400000" as any,
    });
    expect(filters.limit).toBe(10);
    expect(filters.page).toBe(2);
    expect(filters.startDate).toBe(1700000000000);
    expect(filters.endDate).toBe(1700086400000);
  });

  it("returns undefined for all optional filters when not provided", () => {
    const { filters } = Expense.validateFilters({});
    expect(filters.limit).toBeUndefined();
    expect(filters.page).toBeUndefined();
    expect(filters.startDate).toBeUndefined();
    expect(filters.endDate).toBeUndefined();
  });
});
