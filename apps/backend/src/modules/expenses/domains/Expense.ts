import z from "zod";
import { ExpenseCategory, ExpenseStatus, PaymentMethod } from "@packages/core";
import { BadRequestError } from "@packages/lambda";
import { User } from "@/modules/shared/domains";
import { CreateExpensePayload } from "@packages/core";
import { DateTime } from "luxon";

const schemaForCreate = z.object({
  user: z.object({
    id: z.string(),
  }),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string(),
  paymentMethod: z.string(),
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
  paymentMethod: z.string().optional(),
  paymentDate: z.number().optional(),
  category: z.enum(ExpenseCategory).optional(),
});

const schemaForList = z.object({
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().min(1).max(100)),
  nextToken: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val).getTime() : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val).getTime() : undefined)),
});

export interface FiltersForList {
  limit?: number;
  nextToken?: string;
  startDate?: number;
  endDate?: number;
}

export class Expense {
  user!: User;
  id!: string;
  amount!: number;
  paymentMethod!: PaymentMethod;
  paymentDate!: number;
  description!: string;
  creationDate!: number;
  category!: ExpenseCategory;
  lastUpdatedDate!: number;
  status!: ExpenseStatus;
  onDelete!: {
    deletionDate?: number;
    reason?: string;
  };

  constructor(data: Partial<Expense>) {
    Object.assign(this, data);
  }

  static buildFromDbItem(item: Record<string, any>): Expense {
    return new Expense({
      id: item.id,
      user: new User({ id: item.userId }),
      amount: item.amount,
      description: item.description,
      paymentMethod: item.paymentMethod,
      paymentDate: item.paymentDate,
      category: item.categoryCode,
      creationDate: item.creationDate,
      lastUpdatedDate: item?.lastUpdatedDate,
      status: item.status,
      onDelete: {
        deletionDate: item?.onDelete?.deletionDate,
        reason: item?.onDelete?.reason,
      },
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
    const { error } = schemaForCreate.safeParse(data);

    if (error) {
      throw new BadRequestError({ details: error.message });
    }

    return new Expense({
      ...data,
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
}
