import { FiltersForList, PaginatedResponse } from "@packages/core";

import { User } from "@/modules/shared/domains";
import { AttachmentUrls } from "@/modules/shared/repositories";

import { Income } from "../domains";

export interface IncomeService {
  create(income: Income): Promise<{ id: string }>;
  list(
    user: User,
    filters: FiltersForList & { onlyReceived?: boolean },
  ): Promise<PaginatedResponse<Income>>;
  update(income: Income): Promise<Income>;
  getAttachmentUrls(
    income: Income,
    contentType: string,
    filename: string,
  ): Promise<AttachmentUrls>;
}
