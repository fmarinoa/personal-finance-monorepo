import { InternalError } from "@packages/lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Income } from "@/modules/incomes/domains/Income";
import type { DbRepository } from "@/modules/incomes/repositories/DbRepository";
import { IncomeServiceImpl } from "@/modules/incomes/services/IncomeServiceImpl";
import { User } from "@/modules/shared/domains/User";
import type { AttachmentRepository } from "@/modules/shared/repositories";

const user = new User({ id: "user-123" });

const mockIncome = new Income({
  id: "income-1",
  user,
  amount: 1000,
  description: "Monthly salary",
  category: "SALARY",
  status: "RECEIVED",
  receivedDate: 1700000000000,
});

describe("IncomeServiceImpl", () => {
  let repository: DbRepository;
  let attachmentRepository: AttachmentRepository;
  let service: IncomeServiceImpl;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      list: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
    };
    attachmentRepository = {
      generateUrls: vi.fn(),
    } as unknown as AttachmentRepository;
    service = new IncomeServiceImpl({
      dbRepository: repository,
      attachmentRepository,
    });
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

  describe("update", () => {
    it("calls repository.update and returns the updated id", async () => {
      const updatedIncome = new Income({ ...mockIncome, amount: 2000 });
      repository.getById = vi.fn().mockResolvedValue(mockIncome);
      repository.update = vi.fn().mockResolvedValue(updatedIncome);
      const updated = await service.update(updatedIncome);
      expect(repository.getById).toHaveBeenCalledWith({
        ...mockIncome,
        amount: 2000,
      });
      expect(repository.update).toHaveBeenCalledWith({
        ...mockIncome,
        amount: 2000,
      });
      expect(updated).toBeInstanceOf(Income);
      expect(updated.amount).toBe(2000);
    });

    it("wraps repository errors in InternalError", async () => {
      repository.getById = vi.fn().mockResolvedValue(mockIncome);
      repository.update = vi
        .fn()
        .mockRejectedValue(new Error("DynamoDB error"));
      await expect(service.update(mockIncome)).rejects.toThrow(InternalError);
    });
  });

  describe("list", () => {
    it("returns a paginated response with data and pagination metadata", async () => {
      vi.mocked(repository.list).mockResolvedValue({
        data: [mockIncome],
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
        data: [mockIncome],
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

    it("calculates totalPages as 1 when total is 0", async () => {
      vi.mocked(repository.list).mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await service.list(user, {
        limit: 10,
        startDate: 1769922000000,
        endDate: 1772341199999,
      });

      // ceil(0 / 1) = 0, but fallback to 1 avoids division by zero
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  // ── GET /incomes/:id/attachment ───────────────────────────────────────────

  describe("getAttachmentUrls", () => {
    const mockUrls = {
      uploadUrl: "https://s3.example.com/upload?sig=abc",
      viewUrl: "https://s3.example.com/view?sig=xyz",
      key: "user-123/income-1/payslip.jpg",
    };

    it("calls attachmentRepository.generateUrls with userId, incomeId, contentType and filename", async () => {
      vi.mocked(attachmentRepository.generateUrls).mockResolvedValue(mockUrls);

      await service.getAttachmentUrls(mockIncome, "image/jpeg", "payslip.jpg");

      expect(attachmentRepository.generateUrls).toHaveBeenCalledWith(
        "user-123",
        "income-1",
        "image/jpeg",
        "payslip.jpg",
      );
    });

    it("returns the URLs produced by the attachment repository", async () => {
      vi.mocked(attachmentRepository.generateUrls).mockResolvedValue(mockUrls);

      const result = await service.getAttachmentUrls(
        mockIncome,
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
        service.getAttachmentUrls(mockIncome, "text/plain", "file.txt"),
      ).rejects.toThrow("Unsupported content type");
    });
  });
});
