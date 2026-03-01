import { type DashboardSummary } from "@packages/core";
import { useCallback, useEffect, useState } from "react";

import { fetchDashboardSummary } from "@/lib/api";

import { getDateRange } from "../usePeriod";

const DEFAULT_DATA: DashboardSummary = {
  totalAmountExpenses: 0,
  totalAmountIncomes: 0,
  balance: 0,
  lastExpenses: [],
  lastIncomes: [],
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

  const { startDate, endDate } = getDateRange("this-month");

  const load = useCallback(() => {
    fetchDashboardSummary(startDate, endDate)
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
