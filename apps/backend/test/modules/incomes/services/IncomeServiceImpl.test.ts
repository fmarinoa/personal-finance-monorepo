import { describe, it, expect, vi, beforeEach } from "vitest";
import { IncomeServiceImpl } from "@/modules/incomes/services/IncomeServiceImpl";
import type { DbRepository } from "@/modules/incomes/repositories/DbRepository";
import { Income } from "@/modules/incomes/domains/Income";
import { User } from "@/modules/shared/domains/User";
import { InternalError } from "@packages/lambda";

const user = new User({ id: "user-123" });

const mockIncome = new Income({
  id: "income-1",
  user,
  amount: 1000,
  description: "Monthly salary",
  category: "SALARY",
  status: "RECEIVED",
  creationDate: 1700000000000,
  receivedDate: 1700000000000,
});

describe("IncomeServiceImpl", () => {
  let repository: DbRepository;
  let service: IncomeServiceImpl;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
    };
    service = new IncomeServiceImpl({ dbRepository: repository });
  });

  // ── POST /incomes ─────────────────────────────────────────────────────────

  describe("create", () => {
    it("calls repository.create and returns the generated id", async () => {
      vi.mocked(repository.create).mockResolvedValue(mockIncome);

      const result = await service.create(mockIncome);

      expect(repository.create).toHaveBeenCalledWith(mockIncome);
      expect(result).toEqual({ id: "income-1" });
    });

    it("wraps repository errors in InternalError", async () => {
      vi.mocked(repository.create).mockRejectedValue(
        new Error("DynamoDB error"),
      );

      await expect(service.create(mockIncome)).rejects.toThrow(InternalError);
    });
  });
});
