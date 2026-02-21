import { expenseService } from "../services";
import { ExpenseController } from "./ExpenseController";

export const expenseController = new ExpenseController({ expenseService });
