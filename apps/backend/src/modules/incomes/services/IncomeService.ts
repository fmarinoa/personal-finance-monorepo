import { Income } from "../domains";

export interface IncomeService {
  create(income: Income): Promise<{ id: string }>;
}
