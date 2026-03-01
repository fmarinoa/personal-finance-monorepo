import { useState } from "react";

import { getDateRange, type Period } from "@/utils/getDateRange";

export interface PeriodOption {
  id: Period;
  label: string;
  shortLabel: string;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { id: "this-month", label: "Este mes", shortLabel: "Este mes" },
  { id: "last-month", label: "Mes anterior", shortLabel: "Anterior" },
  { id: "last-30-days", label: "Últimos 30 días", shortLabel: "30 días" },
];

export function usePeriod() {
  const [period, setPeriod] = useState<Period>("this-month");
  const option = PERIOD_OPTIONS.find((o) => o.id === period)!;
  return {
    period,
    setPeriod,
    dateRange: getDateRange(period),
    label: option.label,
  };
}
