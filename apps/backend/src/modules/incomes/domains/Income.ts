import {
  CreateIncomePayload,
  DeleteReason,
  FiltersForList,
  Income as IncomeInterface,
  IncomeCategory,
  IncomeStatus,
} from "@packages/core";
import { BadRequestError } from "@packages/lambda";
import { DateTime } from "luxon";
import z from "zod";

import { User } from "@/modules/shared/domains";
import { schemaForList } from "@/modules/shared/schemas";

const baseFields = {
  user: z.object({ id: z.string() }),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string(),
  category: z.enum(IncomeCategory),
};

const schemaForCreate = z.preprocess(
  (data: any) => ({
    status: IncomeStatus.RECEIVED,
    ...Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    ),
  }),
  z.discriminatedUnion("status", [
    z.object({
      ...baseFields,
      status: z.literal(IncomeStatus.PROJECTED),
      projectedDate: z.number(),
    }),
    z.object({
      ...baseFields,
      status: z.literal(IncomeStatus.RECEIVED),
      projectedDate: z.number().optional(),
      receivedDate: z
        .number()
        .optional()
        .transform((val) => val ?? DateTime.now().toMillis()),
    }),
  ]),
);

export class Income implements IncomeInterface {
  user: User;
  id: string;
  amount: number;
  effectiveDate: number;
  projectedDate?: number;
  receivedDate?: number;
  description: string;
  creationDate: number;
  category: IncomeCategory;
  lastUpdatedDate?: number;
  status: IncomeStatus;
  onDelete?: {
    deletionDate?: number;
    reason?: DeleteReason;
  };

  constructor(data: Partial<Income>) {
    Object.assign(this, data);
  }

  static buildFromDbItem(
    item: Record<string, any>,
    options?: { includeDeleted?: boolean },
  ): Income {
    return new Income({
      id: item.id,
      user: new User({ id: item.userId! }),
      amount: item.amount,
      effectiveDate: item.effectiveDate,
      projectedDate: item?.projectedDate,
      receivedDate: item?.receivedDate,
      description: item.description,
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

  static instanceForCreate(data: CreateIncomePayload & { user: User }): Income {
    const { error, data: newData } = schemaForCreate.safeParse(data);

    if (error) {
      throw new BadRequestError({ details: error.message });
    }

    return new Income({
      ...newData,
      user: new User({ id: data.user.id }),
    });
  }

  static validateFilters(filters: FiltersForList): { filters: FiltersForList } {
    const { error, data } = schemaForList.safeParse(filters);
    if (error) throw new BadRequestError({ details: error.message });
    return { filters: data };
  }
}
