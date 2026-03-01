import type { DashboardChartPoint } from "@packages/core";
import { useCallback, useEffect, useState } from "react";

import { fetchDashboardChart } from "@/lib/api";
import { getDateRange } from "@/utils/getDateRange";

export function useDashboardChart() {
  const [data, setData] = useState<DashboardChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { startDate, endDate } = getDateRange("this-month");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchDashboardChart({ startDate, endDate })
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
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
