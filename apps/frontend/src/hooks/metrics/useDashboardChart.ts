import type { DashboardChartPoint } from "@packages/core";
import { useCallback, useEffect, useState } from "react";

import { fetchDashboardChart } from "@/lib/api";

export function useDashboardChart() {
  const [data, setData] = useState<DashboardChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchDashboardChart()
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
