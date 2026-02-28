import { BadRequestError } from "@packages/lambda";
import { describe, expect, it } from "vitest";

import { Income } from "@/modules/incomes/domains/Income";
import { User } from "@/modules/shared/domains/User";

const user = new User({ id: "user-123" });

const validCreatePayload = {
  user,
  amount: 1000,
  description: "Monthly salary",
  category: "SALARY" as const,
};

describe("Income domain", () => {
  describe("instanceForUpdate", () => {
    const base = {
      user,
      id: "income-1",
      amount: 1000,
      description: "desc",
      category: "SALARY" as const,
    };
    it("returns an Income instance for valid update", () => {
      const income = Income.instanceForUpdate(base);
      expect(income).toBeInstanceOf(Income);
      expect(income.amount).toBe(1000);
      expect(income.id).toBe("income-1");
    });
    it("throws BadRequestError for negative amount", () => {
      expect(() => Income.instanceForUpdate({ ...base, amount: -10 })).toThrow(
        BadRequestError,
      );
    });
    it("throws BadRequestError for zero amount", () => {
      expect(() => Income.instanceForUpdate({ ...base, amount: 0 })).toThrow(
        BadRequestError,
      );
    });
    it("throws BadRequestError for invalid category", () => {
      expect(() =>
        Income.instanceForUpdate({ ...base, category: "INVALID" as any }),
      ).toThrow(BadRequestError);
    });
  });
  describe("instanceForCreate", () => {
    it("returns an Income instance for a valid RECEIVED payload", () => {
      const income = Income.instanceForCreate(validCreatePayload);
      expect(income).toBeInstanceOf(Income);
      expect(income.amount).toBe(1000);
      expect(income.description).toBe("Monthly salary");
      expect(income.category).toBe("SALARY");
      expect(income.status).toBe("RECEIVED");
    });

    it("returns an Income instance for a valid PROJECTED payload", () => {
      const income = Income.instanceForCreate({
        ...validCreatePayload,
        status: "PROJECTED" as const,
        projectedDate: 1700000000000,
      });
      expect(income).toBeInstanceOf(Income);
      expect(income.status).toBe("PROJECTED");
      expect(income.projectedDate).toBe(1700000000000);
    });

    it("defaults status to RECEIVED when not provided", () => {
      const income = Income.instanceForCreate(validCreatePayload);
      expect(income.status).toBe("RECEIVED");
    });

    it("defaults receivedDate to now when omitted for RECEIVED", () => {
      const before = Date.now();
      const income = Income.instanceForCreate(validCreatePayload);
      expect(income.receivedDate).toBeGreaterThanOrEqual(before);
    });

    it("preserves receivedDate when explicitly provided", () => {
      const income = Income.instanceForCreate({
        ...validCreatePayload,
        receivedDate: 1700000000000,
      });
      expect(income.receivedDate).toBe(1700000000000);
    });

    it("preserves the user reference on the created instance", () => {
      const income = Income.instanceForCreate(validCreatePayload);
      expect(income.user.id).toBe("user-123");
    });

    it("throws BadRequestError when amount is zero", () => {
      expect(() =>
        Income.instanceForCreate({ ...validCreatePayload, amount: 0 }),
      ).toThrow(BadRequestError);
    });

    it("throws BadRequestError when amount is negative", () => {
      expect(() =>
        Income.instanceForCreate({ ...validCreatePayload, amount: -100 }),
      ).toThrow(BadRequestError);
    });

    it("throws BadRequestError for an invalid category", () => {
      expect(() =>
        Income.instanceForCreate({
          ...validCreatePayload,
          category: "INVALID" as any,
        }),
      ).toThrow(BadRequestError);
    });

    it("throws BadRequestError for PROJECTED status without projectedDate", () => {
      expect(() =>
        Income.instanceForCreate({
          ...validCreatePayload,
          status: "PROJECTED" as const,
        }),
      ).toThrow(BadRequestError);
    });
  });
});
