import type { DateRange, Income } from "@packages/core";
import { useCallback, useEffect, useState } from "react";

import { listIncomes } from "@/lib/api";

interface UseIncomesOptions extends DateRange {
  limit?: number;
  page?: number;
}

interface State {
  data: Income[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export function useIncomes(
  { startDate, endDate, limit = 10, page = 1 }: UseIncomesOptions,
  enabled = true,
) {
  const [state, setState] = useState<State>({
    data: [],
    totalCount: 0,
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
    listIncomes({ limit, page, startDate, endDate })
      .then((res) => {
        if (!controller.signal.aborted) {
          setState({
            data: res.data,
            totalCount: res.pagination.total,
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
              err instanceof Error ? err.message : "Error al cargar ingresos",
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
    totalPages: state.totalPages,
    loading: state.loading || isStale,
    error: state.error,
    refresh,
  };
}
