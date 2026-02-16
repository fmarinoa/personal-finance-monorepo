import { Expense } from "@/domains";
import { ExpenseService } from "./ExpenseService";
import { RdsRepository } from "@/repositories/RdsRepository";

interface ExpenseServiceProps {
  dbRepository: RdsRepository;
}

export class ExpenseServiceImp implements ExpenseService {
  constructor(private readonly props: ExpenseServiceProps) {}

  async create(userId: string, expense: Expense): Promise<{ id: string }> {
    const response = await this.props.dbRepository.create(userId, expense);
    return { id: response.id };
  }

  async list(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{
    items: Expense[];
    pagination: { limit: number; offset: number; total: number };
  }> {
    const { items, total } = await this.props.dbRepository.list(
      userId,
      limit,
      offset,
    );
    return {
      items,
      pagination: { limit, offset, total },
    };
  }

  async update(
    userId: string,
    expense: Expense,
  ): Promise<Expense | null> {
    return await this.props.dbRepository.update(userId, expense);
  }

  async delete(userId: string, expenseId: string): Promise<boolean> {
    return await this.props.dbRepository.delete(userId, expenseId);
  }
}
