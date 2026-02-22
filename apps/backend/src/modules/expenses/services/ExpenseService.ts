import { FiltersForList, PaginatedResponse } from "@packages/core";
import { User } from "@/modules/shared/domains";
import { Expense } from "../domains";

export interface ExpenseService {
  create(expense: Expense): Promise<{ id: string }>;
  getById(expense: Expense): Promise<Expense>;
  list(
    user: User,
    filters: FiltersForList,
  ): Promise<PaginatedResponse<Expense>>;
  update(expense: Expense): Promise<Expense>;
  delete(expense: Expense): Promise<boolean>;
}
