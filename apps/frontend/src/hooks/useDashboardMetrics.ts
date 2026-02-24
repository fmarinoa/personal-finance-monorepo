import { useCallback, useEffect, useState } from "react";
import { fetchDashboardSummary } from "@/lib/api";
import { ExpenseCategory, type DashboardSummary } from "@packages/core";

const DEFAULT_DATA: DashboardSummary = {
  currentMonthTotal: 0,
  previousMonthVariationPercentage: 0,
  topCategory: { code: ExpenseCategory.OTHER, total: 0 },
  lastExpenses: [],
};

export function useDashboardMetrics() {
  const [state, setState] = useState<{
    data: DashboardSummary;
    loading: boolean;
    refreshing: boolean;
    error: string | null;
  }>({
    data: DEFAULT_DATA,
    loading: true,
    refreshing: false,
    error: null,
  });

  const load = useCallback(() => {
    fetchDashboardSummary()
      .then((res) => {
        setState({ data: res, loading: false, refreshing: false, error: null });
      })
      .catch((err) => {
        setState((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          error:
            err instanceof Error
              ? err.message
              : "Error al cargar métricas del dashboard",
        }));
      });
  }, []);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, refreshing: true, error: null }));
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data: state.data,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    refresh,
  };
}
