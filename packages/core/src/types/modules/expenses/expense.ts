import { DeleteReason } from "../..";
import type {
  ExpenseCategory,
  PaymentMethod,
  ExpenseStatus,
} from "./subtypes.ts";

export interface Expense {
  user: { id: string };
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: number;
  description: string;
  creationDate: number;
  category: ExpenseCategory;
  lastUpdatedDate?: number;
  status: ExpenseStatus;
  onDelete?: {
    deletionDate?: number;
    reason?: DeleteReason;
  };
}

export interface CreateExpensePayload {
  amount: number;
  description: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  paymentDate: number;
}
