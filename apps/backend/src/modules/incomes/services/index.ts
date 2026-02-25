import { dbRepository } from "../repositories";
import { IncomeServiceImpl } from "./IncomeServiceImpl";

export const incomeService = new IncomeServiceImpl({ dbRepository });
