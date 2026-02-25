import { Income } from "../domains";

export interface DbRepository {
  create(income: Income): Promise<Income>;
}
