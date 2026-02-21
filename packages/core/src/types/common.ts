export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    nextToken?: string;
    total: number;
  };
}
