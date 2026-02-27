import { dbRepository as expensesRepository } from "@/modules/expenses/repositories";
import { dbRepository as incomesRepository } from "@/modules/incomes/repositories";

import { MetricsServiceImp } from "./MetricsServiceImp";

export const metricsService = new MetricsServiceImp({
  expensesRepository,
  incomesRepository,
  options: {
    lastMonthsForChart: 6,
    lastRecordsForSummary: 5,
  },
});
