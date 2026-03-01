import {
  DeleteReason,
  Expense as ExpenseInterface,
  ExpenseCategory,
  ExpenseStatus,
  FiltersForList,
  PaymentMethod,
} from "@packages/core";
import { CreateExpensePayload } from "@packages/core";
import { BadRequestError } from "@packages/lambda";
import { DateTime } from "luxon";
import z from "zod";

import { BaseDomain, User } from "@/modules/shared/domains";
import { schemaForList } from "@/modules/shared/schemas";

const schemaForCreate = z.object({
  user: z.object({
    id: z.string(),
  }),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string(),
  paymentMethod: z.enum(PaymentMethod),
  paymentDate: z
    .number()
    .optional()
    .transform((val) => val ?? DateTime.now().toMillis()),
  category: z.enum(ExpenseCategory),
});

const schemaForUpdate = z.object({
  user: z.object({
    id: z.string(),
  }),
  id: z.string(),
  amount: z.number().positive("Amount must be greater than zero").optional(),
  description: z.string().optional(),
  paymentMethod: z.enum(PaymentMethod).optional(),
  paymentDate: z.number().optional(),
  category: z.enum(ExpenseCategory).optional(),
});

const schemaForDelete = z.object({
  reason: z.enum(DeleteReason, {
    error: `reason must be one of: ${Object.values(DeleteReason).join(", ")}`,
  }),
});

export class Expense extends BaseDomain<Expense> implements ExpenseInterface {
  user: User;
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: number;
  description: string;
  creationDate: number;
  category: ExpenseCategory;
  lastUpdatedDate?: number;
  status: ExpenseStatus;
  onDelete?: {
    deletionDate?: number;
    reason?: DeleteReason;
  };

  constructor(data: Partial<Expense>) {
    super();
    Object.assign(this, data);
  }

  static buildFromDbItem(
    item: Record<string, any>,
    options?: { includeDeleted?: boolean },
  ): Expense {
    return new Expense({
      id: item.id,
      user: new User({ id: item.userId! }),
      amount: item.amount,
      description: item.description,
      paymentMethod: item.paymentMethod,
      paymentDate: item.paymentDate,
      category: item.category,
      creationDate: item.creationDate,
      lastUpdatedDate: item?.lastUpdatedDate,
      status: item.status,
      ...(options?.includeDeleted && {
        onDelete: {
          deletionDate: item.onDelete?.deletionDate,
          reason: item.onDelete?.reason,
        },
      }),
    });
  }

  static validateFilters(filters: FiltersForList): { filters: FiltersForList } {
    const { error, data } = schemaForList.safeParse(filters);

    if (error) {
      throw new BadRequestError({ details: error.message });
    }

    return { filters: data };
  }

  static instanceForCreate(
    data: CreateExpensePayload & { user: User },
  ): Expense {
    const { error, data: newData } = schemaForCreate.safeParse(data);

    if (error) {
      throw new BadRequestError({ details: error.message });
    }

    return new Expense({
      ...newData,
      user: new User({ id: data.user.id }),
    });
  }

  static instanceForUpdate(data: Partial<Expense>): Expense {
    const { error } = schemaForUpdate.safeParse(data);

    if (error) {
      throw new BadRequestError({ details: error.message });
    }

    return new Expense({
      ...data,
    });
  }

  static instanceForDelete(data: {
    user: User;
    id: string;
    reason: DeleteReason;
  }): Expense {
    const { error } = schemaForDelete.safeParse({ reason: data.reason });

    if (error) {
      throw new BadRequestError({ details: error.issues[0].message });
    }

    return new Expense({
      user: data.user,
      id: data.id,
      onDelete: { reason: data.reason },
    });
  }

  static calculateTotalExpenseAmount(expenses: Expense[]): number {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  static groupExpensesByMonth(expenses: Expense[]) {
    const grouped: Record<string, Expense[]> = {};

    expenses.forEach((expense) => {
      const monthKey = DateTime.fromMillis(expense.paymentDate).toFormat(
        "yyyy-MM",
      );

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(expense);
    });

    return grouped;
  }
}
