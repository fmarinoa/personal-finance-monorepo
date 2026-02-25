import { DeleteReason } from "../..";
import { IncomeCategory, IncomeStatus } from "./subtypes";

export interface Income {
  user: { id: string };
  id: string;
  amount: number;
  projectedDate?: number;
  receivedDate?: number;
  description: string;
  creationDate: number;
  category: IncomeCategory;
  lastUpdatedDate?: number;
  status: IncomeStatus;
  onDelete?: {
    deletionDate?: number;
    reason?: DeleteReason;
  };
}
export interface CreateIncomePayload {
  amount: number;
  description: string;
  category: IncomeCategory;
  status?: IncomeStatus;
  projectedDate?: number;
  receivedDate?: number;
}
