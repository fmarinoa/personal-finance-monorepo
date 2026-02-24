import { DeleteReason, ExpenseCategory, PaymentMethod } from "@packages/core";

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FOOD]: "Comida",
  [ExpenseCategory.TRANSPORT]: "Transporte",
  [ExpenseCategory.ENTERTAINMENT]: "Entretenimiento",
  [ExpenseCategory.UTILITIES]: "Servicios",
  [ExpenseCategory.HEALTHCARE]: "Salud",
  [ExpenseCategory.EDUCATION]: "Educación",
  [ExpenseCategory.SHOPPING]: "Compras",
  [ExpenseCategory.TRAVEL]: "Viajes",
  [ExpenseCategory.OTHER]: "Otro",
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FOOD]: "🍽",
  [ExpenseCategory.TRANSPORT]: "🚌",
  [ExpenseCategory.ENTERTAINMENT]: "🎬",
  [ExpenseCategory.UTILITIES]: "⚡",
  [ExpenseCategory.HEALTHCARE]: "🏥",
  [ExpenseCategory.EDUCATION]: "📚",
  [ExpenseCategory.SHOPPING]: "🛍",
  [ExpenseCategory.TRAVEL]: "✈",
  [ExpenseCategory.OTHER]: "•",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Efectivo",
  [PaymentMethod.CREDIT_CARD]: "Tarjeta de crédito",
  [PaymentMethod.DEBIT_CARD]: "Tarjeta de débito",
  [PaymentMethod.BANK_TRANSFER]: "Transferencia",
  [PaymentMethod.YAPE]: "Yape",
};

export const DELETE_REASON_LABELS: Record<DeleteReason, string> = {
  [DeleteReason.DUPLICATE]: "Registro duplicado",
  [DeleteReason.WRONG_AMOUNT]: "Monto incorrecto",
  [DeleteReason.WRONG_CATEGORY]: "Categoría incorrecta",
  [DeleteReason.CANCELLED]: "Operación cancelada",
  [DeleteReason.OTHER]: "Otro",
};
