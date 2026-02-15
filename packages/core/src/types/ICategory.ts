export type CategoryCode = "food" | "transport" | "entertainment" | "utilities" | "healthcare" | "education" | "shopping" | "travel" | "other";

export interface ICategory {
    code: CategoryCode;
    name: string;
}
