import { dbRepository } from "@/repositories";
import { ExpenseServiceImp } from "./ExpenseServiceImp";

export const expenseService = new ExpenseServiceImp({ dbRepository });
