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
export type ExpenseCategory =
  (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

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
