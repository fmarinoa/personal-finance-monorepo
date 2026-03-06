import {
  CategoryBreakdown,
  CategoryBreakdownFilters,
  DashboardChartPoint,
  DashboardSummary,
  DateRange,
} from "@packages/core";

export interface MetricsService {
  getDashboardSummary(
    userId: string,
    params: DateRange & { onlyReceived?: boolean },
  ): Promise<DashboardSummary>;
  getDashboardChart(
    userId: string,
    params: DateRange & { onlyReceived?: boolean },
  ): Promise<DashboardChartPoint>;
  getCategoryBreakdown(
    userId: string,
    params: CategoryBreakdownFilters,
  ): Promise<CategoryBreakdown>;
}
