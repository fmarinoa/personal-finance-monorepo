export const CATEGORY_CODES = [
  "food",
  "transport",
  "entertainment",
  "utilities",
  "healthcare",
  "education",
  "shopping",
  "travel",
  "other",
] as const;

export type CategoryCode = (typeof CATEGORY_CODES)[number];

export interface ICategory {
  code: CategoryCode;
  name: string;
}
