export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    totalPages: number;
    total: number;
    totalAmount: number;
  };
}

export interface FiltersForList {
  limit?: number;
  page?: number;
  startDate?: number;
  endDate?: number;
}

export const DeleteReason = {
  DUPLICATE: "DUPLICATE",
  WRONG_AMOUNT: "WRONG_AMOUNT",
  WRONG_CATEGORY: "WRONG_CATEGORY",
  CANCELLED: "CANCELLED",
  OTHER: "OTHER",
} as const;
export type DeleteReason = (typeof DeleteReason)[keyof typeof DeleteReason];
