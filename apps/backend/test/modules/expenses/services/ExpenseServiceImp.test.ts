import { InternalError, NotFoundError } from "@packages/lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Expense } from "@/modules/expenses/domains/Expense";
import type { DbRepository } from "@/modules/expenses/repositories/DbRepository";
import { ExpenseServiceImp } from "@/modules/expenses/services/ExpenseServiceImp";
import { User } from "@/modules/shared/domains/User";
import type { AttachmentRepository } from "@/modules/shared/repositories";

const user = new User({ id: "user-123" });

const mockExpense = new Expense({
  id: "expense-1",
  user,
  amount: 150,
  description: "Dinner",
  category: "FOOD",
  paymentMethod: "CREDIT_CARD",
  paymentDate: 1700000000000,
  creationDate: 1700000000000,
  lastUpdatedDate: 1700000000000,
  status: "ACTIVE",
  onDelete: {},
});

describe("ExpenseServiceImp", () => {
  let repository: DbRepository;
  let attachmentRepository: AttachmentRepository;
  let service: ExpenseServiceImp;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      list: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    attachmentRepository = {
      generateUrls: vi.fn(),
    } as unknown as AttachmentRepository;
    service = new ExpenseServiceImp({
      dbRepository: repository,
      attachmentRepository,
    });
  });

  // ── POST /expenses ────────────────────────────────────────────────────────

  describe("create", () => {
    it("calls repository.create and returns the generated id", async () => {
      vi.mocked(repository.create).mockResolvedValue(mockExpense);

      const result = await service.create(mockExpense);

      expect(repository.create).toHaveBeenCalledWith(mockExpense);
      expect(result).toEqual({ id: "expense-1" });
    });

    it("wraps repository errors in InternalError", async () => {
      vi.mocked(repository.create).mockRejectedValue(
        new Error("DynamoDB error"),
      );

      await expect(service.create(mockExpense)).rejects.toThrow(InternalError);
    });
  });

  // ── GET /expenses ─────────────────────────────────────────────────────────

  describe("list", () => {
    it("returns a paginated response with data and pagination metadata", async () => {
      vi.mocked(repository.list).mockResolvedValue({
        data: [mockExpense],
        total: 10,
      });

      const result = await service.list(user, {
        limit: 5,
        startDate: 1769922000000,
        endDate: 1772341199999,
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        totalPages: 2,
        total: 10,
      });
    });

    it("calculates totalPages as 1 when no limit is provided", async () => {
      vi.mocked(repository.list).mockResolvedValue({
        data: [mockExpense],
        total: 10,
      });

      const result = await service.list(user, {
        startDate: 1769922000000,
        endDate: 1772341199999,
      });

      // ceil(10 / 10) = 1 because limit falls back to total
      expect(result.pagination.totalPages).toBe(1);
    });

    it("passes the userId string and filters to the repository", async () => {
      vi.mocked(repository.list).mockResolvedValue({
        data: [],
        total: 0,
      });
      const filters = {
        limit: 3,
        page: 2,
        startDate: 1769922000000,
        endDate: 1772341199999,
      };

      await service.list(user, filters);

      expect(repository.list).toHaveBeenCalledWith("user-123", filters);
    });

    it("returns an empty data array when repository has no results", async () => {
      vi.mocked(repository.list).mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await service.list(user, {
        startDate: 1769922000000,
        endDate: 1772341199999,
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("throws NotFoundError when getById is called with a missing expense", async () => {
      vi.mocked(repository.getById).mockResolvedValue(undefined as any);

      await expect(service.getById(mockExpense)).rejects.toThrow(NotFoundError);
    });
  });

  // ── PATCH /expenses/:id ───────────────────────────────────────────────────

  describe("update", () => {
    const updatedExpense = new Expense({
      ...mockExpense,
      amount: 200,
      description: "Updated dinner",
    });

    it("fetches the existing expense, merges changes and returns the updated expense", async () => {
      vi.mocked(repository.getById).mockResolvedValue(mockExpense);
      vi.mocked(repository.update).mockResolvedValue(updatedExpense);

      const patch = new Expense({
        user,
        id: "expense-1",
        amount: 200,
        description: "Updated dinner",
      });
      const result = await service.update(patch);

      expect(repository.getById).toHaveBeenCalledWith(patch);
      expect(repository.update).toHaveBeenCalled();
      expect(result.amount).toBe(200);
      expect(result.description).toBe("Updated dinner");
    });

    it("calls repository.update with the patched amount", async () => {
      vi.mocked(repository.getById).mockResolvedValue(mockExpense);
      vi.mocked(repository.update).mockImplementation(async (e) => e);

      const patch = new Expense({ user, id: "expense-1", amount: 999 });
      const result = await service.update(patch);

      expect(repository.update).toHaveBeenCalled();
      expect(result.amount).toBe(999);
    });

    it("preserves existing fields that are not included in the patch", async () => {
      vi.mocked(repository.getById).mockResolvedValue(mockExpense);
      vi.mocked(repository.update).mockImplementation(async (e) => e);

      const patch = new Expense({ user, id: "expense-1", amount: 999 });
      const result = await service.update(patch);

      expect(result.category).toBe("FOOD");
      expect(result.paymentMethod).toBe("CREDIT_CARD");
      expect(result.description).toBe("Dinner");
    });

    it("throws NotFoundError when the expense does not exist", async () => {
      vi.mocked(repository.getById).mockResolvedValue(undefined as any);

      await expect(
        service.update(new Expense({ user, id: "not-found" })),
      ).rejects.toThrow(NotFoundError);
    });

    it("wraps unexpected repository errors in InternalError", async () => {
      vi.mocked(repository.getById).mockRejectedValue(new Error("DB error"));

      await expect(service.update(mockExpense)).rejects.toThrow(InternalError);
    });
  });

  // ── DELETE /expenses/:id ──────────────────────────────────────────────────

  describe("delete", () => {
    it("calls repository.delete and returns true", async () => {
      vi.mocked(repository.delete).mockResolvedValue(undefined);

      const result = await service.delete(mockExpense);

      expect(repository.delete).toHaveBeenCalledWith(mockExpense);
      expect(result).toBe(true);
    });

    it("wraps repository errors in InternalError", async () => {
      vi.mocked(repository.delete).mockRejectedValue(new Error("DB error"));

      await expect(service.delete(mockExpense)).rejects.toThrow(InternalError);
    });
  });

  // ── GET /expenses/:id/attachment ──────────────────────────────────────────

  describe("getAttachmentUrls", () => {
    const mockUrls = {
      uploadUrl: "https://s3.example.com/upload?sig=abc",
      viewUrl: "https://s3.example.com/view?sig=xyz",
      key: "user-123/expense-1/receipt.jpg",
    };

    it("calls attachmentRepository.generateUrls with userId, expenseId, contentType and filename", async () => {
      vi.mocked(attachmentRepository.generateUrls).mockResolvedValue(mockUrls);

      await service.getAttachmentUrls(mockExpense, "image/jpeg", "receipt.jpg");

      expect(attachmentRepository.generateUrls).toHaveBeenCalledWith(
        "user-123",
        "expense-1",
        "image/jpeg",
        "receipt.jpg",
      );
    });

    it("returns the URLs produced by the attachment repository", async () => {
      vi.mocked(attachmentRepository.generateUrls).mockResolvedValue(mockUrls);

      const result = await service.getAttachmentUrls(
        mockExpense,
        "image/png",
        "invoice.png",
      );

      expect(result.uploadUrl).toBe(mockUrls.uploadUrl);
      expect(result.viewUrl).toBe(mockUrls.viewUrl);
      expect(result.key).toBe(mockUrls.key);
    });

    it("propagates errors thrown by the attachment repository", async () => {
      vi.mocked(attachmentRepository.generateUrls).mockRejectedValue(
        new Error("Unsupported content type"),
      );

      await expect(
        service.getAttachmentUrls(mockExpense, "text/plain", "file.txt"),
      ).rejects.toThrow("Unsupported content type");
    });
  });
});
