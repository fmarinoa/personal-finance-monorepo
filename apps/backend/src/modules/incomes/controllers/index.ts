import { incomeService } from "../services";
import { IncomeController } from "./IncomeController";

export const incomeController = new IncomeController({ incomeService });
