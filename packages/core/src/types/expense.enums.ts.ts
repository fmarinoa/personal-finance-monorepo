export const ExpenseCategory = {
  FOOD: "FOOD",
  TRANSPORT: "TRANSPORT",
  ENTERTAINMENT: "ENTERTAINMENT",
  UTILITIES: "UTILITIES",
  HEALTHCARE: "HEALTHCARE",
  EDUCATION: "EDUCATION",
  SHOPPING: "SHOPPING",
  TRAVEL: "TRAVEL",
  OTHER: "OTHER",
} as const;
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const PaymentMethod = {
  CASH: "CASH",
  CREDIT_CARD: "CREDIT_CARD",
  DEBIT_CARD: "DEBIT_CARD",
  BANK_TRANSFER: "BANK_TRANSFER",
  YAPE: "YAPE",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const ExpenseStatus = {
  ACTIVE: "ACTIVE",
  DELETED: "DELETED",
} as const;
export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus];

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
  limit?: number;
  nextToken?: string;
  startDate?: number;
  endDate?: number;
}
