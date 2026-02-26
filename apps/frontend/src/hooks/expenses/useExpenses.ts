import type { Expense } from "@packages/core";
import { useCallback, useEffect, useState } from "react";

import type { DateRange } from "@/hooks/usePeriod";
import { listExpenses } from "@/lib/api";

interface UseExpensesOptions extends DateRange {
  limit?: number;
  page?: number;
}

interface State {
  data: Expense[];
  totalCount: number;
  totalAmount: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export function useExpenses(
  { startDate, endDate, limit = 10, page = 1 }: UseExpensesOptions,
  enabled = true,
) {
  const [state, setState] = useState<State>({
    data: [],
    totalCount: 0,
    totalAmount: 0,
    totalPages: 1,
    loading: true,
    error: null,
  });
  const [fetchedKey, setFetchedKey] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const fetchKey = `${startDate}-${endDate}-${page}-${limit}`;

  useEffect(() => {
    if (!enabled) return;
    const key = `${startDate}-${endDate}-${page}-${limit}`;
    const controller = new AbortController();
    listExpenses({ limit, page, startDate, endDate })
      .then((res) => {
        if (!controller.signal.aborted) {
          setState({
            data: res.data,
            totalCount: res.pagination.total,
            totalAmount: res.pagination.totalAmount,
            totalPages: res.pagination.totalPages,
            loading: false,
            error: null,
          });
          setFetchedKey(key);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setState((s) => ({
            ...s,
            loading: false,
            error:
              err instanceof Error ? err.message : "Error al cargar gastos",
          }));
          setFetchedKey(key);
        }
      });
    return () => controller.abort();
  }, [startDate, endDate, page, limit, trigger, enabled]);

  const isStale = !enabled ? false : fetchedKey !== fetchKey;

  const refresh = useCallback(() => {
    setFetchedKey(null);
    setTrigger((t) => t + 1);
  }, []);

  return {
    data: state.data,
    totalCount: state.totalCount,
    totalAmount: state.totalAmount,
    totalPages: state.totalPages,
    loading: state.loading || isStale,
    error: state.error,
    refresh,
  };
}
