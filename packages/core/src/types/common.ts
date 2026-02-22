export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    totalPages: number;
    total: number;
    totalAmount: number;
  };
}
