import { dbRepository } from "@/modules/expenses/repositories";
import { MetricsServiceImp } from "./MetricsServiceImp";

export const metricsService = new MetricsServiceImp({
  expensesRepository: dbRepository,
});
