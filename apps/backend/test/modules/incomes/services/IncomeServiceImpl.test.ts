import { InternalError } from "@packages/lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Income } from "@/modules/incomes/domains/Income";
import type { DbRepository } from "@/modules/incomes/repositories/DbRepository";
import { IncomeServiceImpl } from "@/modules/incomes/services/IncomeServiceImpl";
import { User } from "@/modules/shared/domains/User";

const user = new User({ id: "user-123" });

const mockIncome = new Income({
  id: "income-1",
  user,
  amount: 1000,
  description: "Monthly salary",
  category: "SALARY",
  status: "RECEIVED",
  effectiveDate: 1700000000000,
  creationDate: 1700000000000,
  receivedDate: 1700000000000,
});

describe("IncomeServiceImpl", () => {
  let repository: DbRepository;
  let service: IncomeServiceImpl;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      list: vi.fn(),
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

  // ── GET /incomes ──────────────────────────────────────────────────────────

  describe("list", () => {
    it("returns a paginated response with data and pagination metadata", async () => {
      vi.mocked(repository.list).mockResolvedValue({
        data: [mockIncome],
        total: 10,
        totalAmount: 5000,
      });

      const result = await service.list(user, { limit: 5 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        totalPages: 2,
        total: 10,
        totalAmount: 5000,
      });
    });

    it("calculates totalPages as 1 when no limit is provided", async () => {
      vi.mocked(repository.list).mockResolvedValue({
        data: [mockIncome],
        total: 10,
        totalAmount: 5000,
      });

      const result = await service.list(user, {});

      // ceil(10 / 10) = 1 because limit falls back to total
      expect(result.pagination.totalPages).toBe(1);
    });

    it("passes the userId string and filters to the repository", async () => {
      vi.mocked(repository.list).mockResolvedValue({
        data: [],
        total: 0,
        totalAmount: 0,
      });
      const filters = { limit: 3, page: 2 };

      await service.list(user, filters);

      expect(repository.list).toHaveBeenCalledWith("user-123", filters);
    });

    it("returns an empty data array when repository has no results", async () => {
      vi.mocked(repository.list).mockResolvedValue({
        data: [],
        total: 0,
        totalAmount: 0,
      });

      const result = await service.list(user, {});

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalAmount).toBe(0);
    });

    it("calculates totalPages as 1 when total is 0", async () => {
      vi.mocked(repository.list).mockResolvedValue({
        data: [],
        total: 0,
        totalAmount: 0,
      });

      const result = await service.list(user, { limit: 10 });

      // ceil(0 / 1) = 0, but fallback to 1 avoids division by zero
      expect(result.pagination.totalPages).toBe(0);
    });
  });
});
