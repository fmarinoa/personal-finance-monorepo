import { DashboardChartPoint, DashboardSummary } from "@packages/core";

export interface MetricsService {
  getDashboardSummary(
    userId: string,
    params: {
      period: string;
    },
  ): Promise<DashboardSummary>;
  getDashboardChart(userId: string): Promise<DashboardChartPoint[]>;
}
