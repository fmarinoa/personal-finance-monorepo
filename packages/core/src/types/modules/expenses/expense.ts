import type {
  ExpenseCategory,
  PaymentMethod,
  ExpenseStatus,
} from "./subtypes.ts";

export interface Expense {
  user: unknown;
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: number;
  description: string;
  creationDate: number;
  category: ExpenseCategory;
  lastUpdatedDate: number;
  status: ExpenseStatus;
  onDelete: {
    deletionDate?: number;
    reason?: string;
  };
}

export interface CreateExpensePayload {
  amount: number;
  description: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  paymentDate: number;
}

export interface FiltersForList {
  limit: number;
  page: number;
  startDate?: number;
  endDate?: number;
}
