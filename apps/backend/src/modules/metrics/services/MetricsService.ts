import {
  DashboardChartPoint,
  DashboardSummary,
  DateRange,
} from "@packages/core";

export interface MetricsService {
  getDashboardSummary(
    userId: string,
    params: DateRange,
  ): Promise<DashboardSummary>;
  getDashboardChart(
    userId: string,
    params: DateRange,
  ): Promise<DashboardChartPoint[]>;
}
