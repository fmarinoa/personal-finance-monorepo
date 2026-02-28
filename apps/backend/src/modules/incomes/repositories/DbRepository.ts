import { FiltersForList } from "@packages/core";

import { Income } from "../domains";

export interface DbRepository {
  create(income: Income): Promise<Income>;
  list(
    userId: string,
    filters: FiltersForList,
  ): Promise<{ data: Income[]; total: number }>;
  getById(income: Income): Promise<Income>;
  update(existing: Income): Promise<Income>;
}
