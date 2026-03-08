import { FiltersForList, PaginatedResponse } from "@packages/core";

import { User } from "@/modules/shared/domains";
import { AttachmentUrls } from "@/modules/shared/repositories";

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
  getAttachmentUrls(
    expense: Expense,
    contentType: string,
    filename: string,
  ): Promise<AttachmentUrls>;
}
