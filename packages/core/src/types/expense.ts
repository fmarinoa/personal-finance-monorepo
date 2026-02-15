export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
}

export interface ExpenseCreateInput extends Omit<Expense, "id"> {}
