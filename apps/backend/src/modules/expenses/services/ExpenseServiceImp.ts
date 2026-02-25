import { DbRepository } from "@/modules/expenses/repositories/DbRepository";
import { BaseError, InternalError, NotFoundError } from "@packages/lambda";
import { FiltersForList, PaginatedResponse } from "@packages/core";
import { User } from "@/modules/shared/domains";
import { Expense } from "../domains";
import { ExpenseService } from "./ExpenseService";

interface ExpenseServiceProps {
  dbRepository: DbRepository;
}

export class ExpenseServiceImp implements ExpenseService {
  constructor(private readonly props: ExpenseServiceProps) {}
  async create(expense: Expense): Promise<{ id: string }> {
    try {
      const response = await this.props.dbRepository.create(expense);
      return { id: response.id };
    } catch (error) {
      throw new InternalError({ details: error });
    }
  }

  async list(
    user: User,
    filters: FiltersForList,
  ): Promise<PaginatedResponse<Expense>> {
    const { data, total, totalAmount } = await this.props.dbRepository.list(
      user.id,
      filters,
    );

    return {
      data,
      pagination: {
        totalPages: Math.ceil(total / (filters.limit || total)),
        total,
        totalAmount,
      },
    };
  }

  async getById(expense: Expense): Promise<Expense> {
    const result = await this.props.dbRepository.getById(expense);
    if (!result) {
      throw new NotFoundError({ details: "Expense not found" });
    }
    return result;
  }

  async update(expense: Expense): Promise<Expense> {
    try {
      const existing = await this.props.dbRepository.getById(expense);

      if (!existing) {
        throw new NotFoundError({ details: "Expense not found" });
      }

      expense.updateFromExisting(existing);

      const response = await this.props.dbRepository.update(expense);

      return response;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }
      throw new InternalError({ details: error });
    }
  }

  async delete(expense: Expense): Promise<boolean> {
    try {
      await this.props.dbRepository.delete(expense);
      return true;
    } catch (error) {
      throw new InternalError({ details: error });
    }
  }
}
