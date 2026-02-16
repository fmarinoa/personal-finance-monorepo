import { CategoryCode } from "./ICategory";

export interface IExpense {
  id: string;
  amount: number;
  description: string;
  date: Date;
  categoryCode: CategoryCode;
}
