import { BadRequestError } from "@packages/lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IncomeController } from "@/modules/incomes/controllers/IncomeController";
import { Income } from "@/modules/incomes/domains/Income";
import type { IncomeService } from "@/modules/incomes/services/IncomeService";
import { User } from "@/modules/shared/domains/User";

import { buildEvent, TEST_USER_ID } from "../../../eventFactory";

const mockIncome = new Income({
  id: "income-1",
  user: new User({ id: TEST_USER_ID }),
  amount: 1000,
  description: "Monthly salary",
  category: "SALARY",
  status: "RECEIVED",
  effectiveDate: 1700000000000,
  creationDate: 1700000000000,
  receivedDate: 1700000000000,
});

const validBody = {
  amount: 1000,
  description: "Monthly salary",
  category: "SALARY",
};

const paginatedResult = {
  data: [mockIncome],
  pagination: { totalPages: 1, total: 1, totalAmount: 1000 },
};

describe("IncomeController", () => {
  let service: IncomeService;
  let controller: IncomeController;

  beforeEach(() => {
    service = {
      create: vi.fn(),
      list: vi.fn(),
    };
    controller = new IncomeController({ incomeService: service });
  });

  // ── POST /incomes ─────────────────────────────────────────────────────────

  describe("create", () => {
    it("returns 201 with the new income id on success", async () => {
      vi.mocked(service.create).mockResolvedValue({ id: "income-1" });

      const result = await controller.create(
        buildEvent({ body: validBody as any }),
      );

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual({ id: "income-1" });
    });

    it("calls service.create with an Income built from the request body", async () => {
      vi.mocked(service.create).mockResolvedValue({ id: "income-1" });

      await controller.create(buildEvent({ body: validBody as any }));

      const [called] = vi.mocked(service.create).mock.calls[0];
      expect(called.amount).toBe(1000);
      expect(called.description).toBe("Monthly salary");
      expect(called.category).toBe("SALARY");
    });

    it("sets userId from Cognito claims on the income passed to service", async () => {
      vi.mocked(service.create).mockResolvedValue({ id: "income-1" });

      await controller.create(buildEvent({ body: validBody as any }));

      const [called] = vi.mocked(service.create).mock.calls[0];
      expect(called.user.id).toBe(TEST_USER_ID);
    });

    it("passes projectedDate and PROJECTED status to service when provided", async () => {
      vi.mocked(service.create).mockResolvedValue({ id: "income-1" });

      await controller.create(
        buildEvent({
          body: {
            ...validBody,
            status: "PROJECTED",
            projectedDate: 1700000000000,
          } as any,
        }),
      );

      const [called] = vi.mocked(service.create).mock.calls[0];
      expect(called.status).toBe("PROJECTED");
      expect(called.projectedDate).toBe(1700000000000);
    });

    it("throws BadRequestError when amount is negative", async () => {
      await expect(
        controller.create(
          buildEvent({ body: { ...validBody, amount: -10 } as any }),
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when amount is zero", async () => {
      await expect(
        controller.create(
          buildEvent({ body: { ...validBody, amount: 0 } as any }),
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError for an invalid category", async () => {
      await expect(
        controller.create(
          buildEvent({ body: { ...validBody, category: "INVALID" } as any }),
        ),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // ── GET /incomes ──────────────────────────────────────────────────────────

  describe("list", () => {
    it("returns 200 with a paginated incomes list", async () => {
      vi.mocked(service.list).mockResolvedValue(paginatedResult);

      const result = await controller.list(
        buildEvent({ queryStringParameters: {} }),
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data).toHaveLength(1);
      expect(body.pagination.total).toBe(1);
    });

    it("parses limit and page from query string and passes them to service", async () => {
      vi.mocked(service.list).mockResolvedValue(paginatedResult);

      await controller.list(
        buildEvent({ queryStringParameters: { limit: "5", page: "2" } }),
      );

      const [, filters] = vi.mocked(service.list).mock.calls[0];
      expect(filters.limit).toBe(5);
      expect(filters.page).toBe(2);
    });

    it("parses startDate and endDate from query string", async () => {
      vi.mocked(service.list).mockResolvedValue(paginatedResult);

      await controller.list(
        buildEvent({
          queryStringParameters: {
            startDate: "1700000000000",
            endDate: "1700086400000",
          },
        }),
      );

      const [, filters] = vi.mocked(service.list).mock.calls[0];
      expect(filters.startDate).toBe(1700000000000);
      expect(filters.endDate).toBe(1700086400000);
    });

    it("works when no query params are provided", async () => {
      vi.mocked(service.list).mockResolvedValue(paginatedResult);

      const result = await controller.list(
        buildEvent({ queryStringParameters: null }),
      );

      expect(result.statusCode).toBe(200);
    });

    it("passes the userId extracted from Cognito claims to service", async () => {
      vi.mocked(service.list).mockResolvedValue(paginatedResult);

      await controller.list(buildEvent({ queryStringParameters: {} }));

      const [calledUser] = vi.mocked(service.list).mock.calls[0];
      expect(calledUser.id).toBe(TEST_USER_ID);
    });

    it("returns the totalAmount in the pagination metadata", async () => {
      vi.mocked(service.list).mockResolvedValue({
        data: [],
        pagination: { totalPages: 1, total: 0 },
      });

      const result = await controller.list(
        buildEvent({ queryStringParameters: {} }),
      );

      const body = JSON.parse(result.body);
      expect(body.pagination.totalPages).toBe(1);
      expect(body.pagination.total).toBe(0);
    });
  });
});
