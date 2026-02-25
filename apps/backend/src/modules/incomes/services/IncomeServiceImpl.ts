import { InternalError } from "@packages/lambda";
import { Income } from "../domains";
import { DbRepository } from "../repositories/DbRepository";
import { IncomeService } from "./IncomeService";

interface IncomeServiceImplProps {
  dbRepository: DbRepository;
}

export class IncomeServiceImpl implements IncomeService {
  constructor(private readonly props: IncomeServiceImplProps) {}

  async create(income: Income): Promise<{ id: string }> {
    try {
      const createdIncome = await this.props.dbRepository.create(income);
      return { id: createdIncome.id };
    } catch (error) {
      throw new InternalError({ details: "Failed to create income: " + error });
    }
  }
}
