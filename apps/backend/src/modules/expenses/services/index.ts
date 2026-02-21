import { dbRepository } from "@/modules/expenses/repositories";
import { ExpenseServiceImp } from "./ExpenseServiceImp";

export const expenseService = new ExpenseServiceImp({ dbRepository });
