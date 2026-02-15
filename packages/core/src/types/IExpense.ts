import { ICategory } from "./ICategory";

export interface IExpense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryCode: ICategory["code"];

}
