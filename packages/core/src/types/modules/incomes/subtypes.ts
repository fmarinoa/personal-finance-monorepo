export const IncomeCategory = {
  SALARY: "SALARY",
  BUSINESS: "BUSINESS",
  INVESTMENT: "INVESTMENT",
  GIFT: "GIFT",
  OTHER: "OTHER",
} as const;
export type IncomeCategory =
  (typeof IncomeCategory)[keyof typeof IncomeCategory];

export const IncomeStatus = {
  PROJECTED: "PROJECTED",
  RECEIVED: "RECEIVED",
  DELETED: "DELETED",
} as const;
export type IncomeStatus = (typeof IncomeStatus)[keyof typeof IncomeStatus];
