import { DashboardChartPoint, DashboardSummary } from "@packages/core";

export interface MetricsService {
  getDashboardSummary(
    userId: string,
    params: {
      startDate: number;
      endDate: number;
    },
  ): Promise<DashboardSummary>;
  getDashboardChart(userId: string): Promise<DashboardChartPoint[]>;
}
