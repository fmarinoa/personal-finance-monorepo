import { DeleteReason, IncomeCategory, IncomeStatus } from "@packages/core";

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  [IncomeCategory.SALARY]: "Salario",
  [IncomeCategory.BUSINESS]: "Negocio",
  [IncomeCategory.INVESTMENT]: "Inversión",
  [IncomeCategory.GIFT]: "Regalo",
  [IncomeCategory.OTHER]: "Otro",
};

export const INCOME_CATEGORY_ICONS: Record<IncomeCategory, string> = {
  [IncomeCategory.SALARY]: "💼",
  [IncomeCategory.BUSINESS]: "🏢",
  [IncomeCategory.INVESTMENT]: "📈",
  [IncomeCategory.GIFT]: "🎁",
  [IncomeCategory.OTHER]: "•",
};

export const INCOME_STATUS_LABELS: Record<IncomeStatus, string> = {
  [IncomeStatus.PROJECTED]: "Proyectado",
  [IncomeStatus.RECEIVED]: "Recibido",
  [IncomeStatus.DELETED]: "Eliminado",
};

export const DELETE_REASON_LABELS: Record<DeleteReason, string> = {
  [DeleteReason.DUPLICATE]: "Registro duplicado",
  [DeleteReason.WRONG_AMOUNT]: "Monto incorrecto",
  [DeleteReason.WRONG_CATEGORY]: "Categoría incorrecta",
  [DeleteReason.CANCELLED]: "Operación cancelada",
  [DeleteReason.OTHER]: "Otro",
};
