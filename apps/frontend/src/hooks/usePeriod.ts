import { DateTime } from "luxon";
import { useState } from "react";

export type Period = "this-month" | "last-month" | "last-30-days";

export interface DateRange {
  startDate: number;
  endDate: number;
}

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

export function getDateRange(period: Period): DateRange {
  const now = DateTime.local();
  switch (period) {
    case "this-month":
      return {
        startDate: now.startOf("month").startOf("day").toUTC().toMillis(),
        endDate: now.endOf("month").endOf("day").toUTC().toMillis(),
      };
    case "last-month": {
      const last = now.minus({ months: 1 });
      return {
        startDate: last.startOf("month").startOf("day").toUTC().toMillis(),
        endDate: last.endOf("month").endOf("day").toUTC().toMillis(),
      };
    }
    case "last-30-days":
      return {
        startDate: now.minus({ days: 30 }).startOf("day").toUTC().toMillis(),
        endDate: now.endOf("day").toUTC().toMillis(),
      };
  }
}

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
