import { FiltersForList } from "@packages/core";

import { Expense } from "../domains";

export interface DbRepository {
  create(expense: Expense): Promise<Expense>;
  getById(expense: Expense): Promise<Expense>;
  list(
    userId: string,
    filters: FiltersForList,
  ): Promise<{
    data: Expense[];
    total: number;
    totalAmount: number;
  }>;
  update(expense: Expense): Promise<Expense>;
  delete(expense: Expense): Promise<void>;
}
