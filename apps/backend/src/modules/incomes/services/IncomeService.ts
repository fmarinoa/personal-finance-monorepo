import { FiltersForList, PaginatedResponse } from "@packages/core";

import { User } from "@/modules/shared/domains";

import { Income } from "../domains";

export interface IncomeService {
  create(income: Income): Promise<{ id: string }>;
  list(user: User, filters: FiltersForList): Promise<PaginatedResponse<Income>>;
}
