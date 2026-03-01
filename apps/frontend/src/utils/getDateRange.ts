import type { DateRange } from "@packages/core";
import { DateTime } from "luxon";

export type Period = "this-month" | "last-month" | "last-30-days";

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
