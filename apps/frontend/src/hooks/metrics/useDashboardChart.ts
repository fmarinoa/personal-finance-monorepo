import type { DashboardChartPoint } from "@packages/core";
import { useCallback, useEffect, useState } from "react";

import { fetchDashboardChart } from "@/lib/api";
import { type ChartPeriod, getDateRange } from "@/utils/getDateRange";

export function useDashboardChart(period: ChartPeriod = "last-6-month") {
  const [data, setData] = useState<DashboardChartPoint>({
    months: [],
    total: { totalAmountIncomes: 0, totalAmountExpenses: 0, balance: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange(period);
    fetchDashboardChart({ startDate, endDate, onlyReceived: true })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Error al cargar el gráfico",
        );
        setLoading(false);
      });
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
