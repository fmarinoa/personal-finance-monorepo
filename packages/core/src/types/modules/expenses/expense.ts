import { DeleteReason } from "../..";
import type {
  ExpenseCategory,
  ExpenseStatus,
  PaymentMethod,
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
  attachmentKey?: string;
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
  attachmentKey?: string;
}

export interface AttachmentUrls {
  uploadUrl: string;
  viewUrl: string;
  key: string;
}
