import { describe, it, expect, vi, beforeEach } from "vitest";
import { IncomeController } from "@/modules/incomes/controllers/IncomeController";
import type { IncomeService } from "@/modules/incomes/services/IncomeService";
import { BadRequestError } from "@packages/lambda";
import { buildEvent, TEST_USER_ID } from "../../../eventFactory";

const validBody = {
  amount: 1000,
  description: "Monthly salary",
  category: "SALARY",
};

describe("IncomeController", () => {
  let service: IncomeService;
  let controller: IncomeController;

  beforeEach(() => {
    service = {
      create: vi.fn(),
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
});
