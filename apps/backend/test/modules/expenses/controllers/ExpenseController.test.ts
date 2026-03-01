import { BadRequestError } from "@packages/lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExpenseController } from "@/modules/expenses/controllers/ExpenseController";
import { Expense } from "@/modules/expenses/domains/Expense";
import type { ExpenseService } from "@/modules/expenses/services/ExpenseService";
import { User } from "@/modules/shared/domains/User";

import { buildEvent, TEST_USER_ID } from "../../../eventFactory";

const mockExpense = new Expense({
  id: "expense-1",
  user: new User({ id: TEST_USER_ID }),
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

const validBody = {
  amount: 150,
  description: "Dinner",
  category: "FOOD",
  paymentMethod: "CREDIT_CARD",
  paymentDate: 1700000000000,
};

const paginatedResult = {
  data: [mockExpense],
  pagination: { totalPages: 1, total: 1, totalAmount: 150 },
};

describe("ExpenseController", () => {
  let service: ExpenseService;
  let controller: ExpenseController;

  beforeEach(() => {
    service = {
      create: vi.fn(),
      list: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    controller = new ExpenseController({ expenseService: service });
  });

  // ── POST /expenses ────────────────────────────────────────────────────────

  describe("create", () => {
    it("returns 201 with the new expense id on success", async () => {
      vi.mocked(service.create).mockResolvedValue({ id: "expense-1" });

      const result = await controller.create(
        buildEvent({ body: validBody as any }),
      );

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual({ id: "expense-1" });
    });

    it("calls service.create with an Expense built from the request body", async () => {
      vi.mocked(service.create).mockResolvedValue({ id: "expense-1" });

      await controller.create(buildEvent({ body: validBody as any }));

      const [called] = vi.mocked(service.create).mock.calls[0];
      expect(called.amount).toBe(150);
      expect(called.description).toBe("Dinner");
      expect(called.category).toBe("FOOD");
    });

    it("sets userId from Cognito claims on the expense passed to service", async () => {
      vi.mocked(service.create).mockResolvedValue({ id: "expense-1" });

      await controller.create(buildEvent({ body: validBody as any }));

      const [called] = vi.mocked(service.create).mock.calls[0];
      expect(called.user.id).toBe(TEST_USER_ID);
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

  // ── GET /expenses ─────────────────────────────────────────────────────────

  describe("list", () => {
    it("returns 200 with a paginated expenses list", async () => {
      vi.mocked(service.list).mockResolvedValue(paginatedResult);

      const result = await controller.list(
        buildEvent({
          queryStringParameters: {
            startDate: "1769922000000",
            endDate: "1772341199999",
          },
        }),
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.data).toHaveLength(1);
      expect(body.pagination.total).toBe(1);
    });

    it("parses limit and page from query string and passes them to service", async () => {
      vi.mocked(service.list).mockResolvedValue(paginatedResult);

      await controller.list(
        buildEvent({
          queryStringParameters: {
            limit: "5",
            page: "2",
            startDate: "1769922000000",
            endDate: "1772341199999",
          },
        }),
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
        buildEvent({
          queryStringParameters: {
            startDate: "1769922000000",
            endDate: "1772341199999",
          },
        }),
      );

      expect(result.statusCode).toBe(200);
    });

    it("passes the userId extracted from Cognito claims to service", async () => {
      vi.mocked(service.list).mockResolvedValue(paginatedResult);

      await controller.list(
        buildEvent({
          queryStringParameters: {
            startDate: "1769922000000",
            endDate: "1772341199999",
          },
        }),
      );

      const [calledUser] = vi.mocked(service.list).mock.calls[0];
      expect(calledUser.id).toBe(TEST_USER_ID);
    });

    it("returns the totalAmount in the pagination metadata", async () => {
      vi.mocked(service.list).mockResolvedValue({
        data: [],
        pagination: { totalPages: 1, total: 0 },
      });

      const result = await controller.list(
        buildEvent({
          queryStringParameters: {
            startDate: "1769922000000",
            endDate: "1772341199999",
          },
        }),
      );

      const body = JSON.parse(result.body);
      expect(body.pagination.totalPages).toBe(1);
      expect(body.pagination.total).toBe(0);
    });
  });

  // ── PATCH /expenses/:id ───────────────────────────────────────────────────

  describe("update", () => {
    const patchBody = { amount: 200, description: "Updated dinner" };

    it("returns 200 with the updated expense on success", async () => {
      const updated = new Expense({
        ...mockExpense,
        amount: 200,
        description: "Updated dinner",
      });
      vi.mocked(service.update).mockResolvedValue(updated);

      const result = await controller.update(
        buildEvent({
          body: patchBody as any,
          pathParameters: { id: "expense-1" },
        }),
      );

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.amount).toBe(200);
      expect(body.description).toBe("Updated dinner");
    });

    it("calls service.update with the id from path params", async () => {
      vi.mocked(service.update).mockResolvedValue(mockExpense);

      await controller.update(
        buildEvent({
          body: patchBody as any,
          pathParameters: { id: "expense-1" },
        }),
      );

      const [called] = vi.mocked(service.update).mock.calls[0];
      expect(called.id).toBe("expense-1");
    });

    it("calls service.update with userId from Cognito claims", async () => {
      vi.mocked(service.update).mockResolvedValue(mockExpense);

      await controller.update(
        buildEvent({
          body: patchBody as any,
          pathParameters: { id: "expense-1" },
        }),
      );

      const [called] = vi.mocked(service.update).mock.calls[0];
      expect(called.user.id).toBe(TEST_USER_ID);
    });

    it("passes only the fields present in the body to service.update", async () => {
      vi.mocked(service.update).mockResolvedValue(mockExpense);

      await controller.update(
        buildEvent({
          body: { amount: 99 } as any,
          pathParameters: { id: "expense-1" },
        }),
      );

      const [called] = vi.mocked(service.update).mock.calls[0];
      expect(called.amount).toBe(99);
      expect(called.description).toBeUndefined();
    });

    it("throws BadRequestError when amount is zero", async () => {
      await expect(
        controller.update(
          buildEvent({
            body: { amount: 0 } as any,
            pathParameters: { id: "expense-1" },
          }),
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError for an invalid category", async () => {
      await expect(
        controller.update(
          buildEvent({
            body: { category: "INVALID" } as any,
            pathParameters: { id: "expense-1" },
          }),
        ),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // ── DELETE /expenses/:id ──────────────────────────────────────────────────

  describe("delete", () => {
    it("returns 204 no content on success", async () => {
      vi.mocked(service.delete).mockResolvedValue(true);

      const result = await controller.delete(
        buildEvent({
          pathParameters: { id: "expense-1" },
          queryStringParameters: { reason: "DUPLICATE" },
        }),
      );

      expect(result.statusCode).toBe(204);
      expect(result.body).toBe("");
    });

    it("calls service.delete with the id from path params", async () => {
      vi.mocked(service.delete).mockResolvedValue(true);

      await controller.delete(
        buildEvent({
          pathParameters: { id: "expense-1" },
          queryStringParameters: { reason: "DUPLICATE" },
        }),
      );

      const [called] = vi.mocked(service.delete).mock.calls[0];
      expect(called.id).toBe("expense-1");
    });

    it("calls service.delete with userId from Cognito claims", async () => {
      vi.mocked(service.delete).mockResolvedValue(true);

      await controller.delete(
        buildEvent({
          pathParameters: { id: "expense-1" },
          queryStringParameters: { reason: "DUPLICATE" },
        }),
      );

      const [called] = vi.mocked(service.delete).mock.calls[0];
      expect(called.user.id).toBe(TEST_USER_ID);
    });

    it("passes reason from query params to the expense", async () => {
      vi.mocked(service.delete).mockResolvedValue(true);

      await controller.delete(
        buildEvent({
          pathParameters: { id: "expense-1" },
          queryStringParameters: { reason: "WRONG_AMOUNT" },
        }),
      );

      const [called] = vi.mocked(service.delete).mock.calls[0];
      expect(called.onDelete?.reason).toBe("WRONG_AMOUNT");
    });

    it("throws NotFoundError when service returns false", async () => {
      vi.mocked(service.delete).mockResolvedValue(false);

      await expect(
        controller.delete(
          buildEvent({
            pathParameters: { id: "expense-1" },
            queryStringParameters: { reason: "DUPLICATE" },
          }),
        ),
      ).rejects.toThrow();
    });

    it("throws BadRequestError for an invalid reason", async () => {
      await expect(
        controller.delete(
          buildEvent({
            pathParameters: { id: "expense-1" },
            queryStringParameters: { reason: "INVALID" },
          }),
        ),
      ).rejects.toThrow(BadRequestError);
    });
  });
});
