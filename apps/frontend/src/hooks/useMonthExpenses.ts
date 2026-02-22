import { useCallback, useEffect, useState } from "react";
import { listExpenses } from "@/lib/api";
import type { Expense } from "@packages/core";
import type { DateRange } from "@/hooks/usePeriod";

interface State {
  data: Expense[];
  totalCount: number;
  totalAmount: number;
  loading: boolean;
  error: string | null;
}

type FetchedRange = { startDate: number; endDate: number } | null;

export function useExpenses({ startDate, endDate }: DateRange) {
  const [state, setState] = useState<State>({
    data: [],
    totalCount: 0,
    totalAmount: 0,
    loading: true,
    error: null,
  });
  const [fetchedRange, setFetchedRange] = useState<FetchedRange>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listExpenses({ limit: 10, page: 1, startDate, endDate })
      .then((res) => {
        if (!controller.signal.aborted) {
          setState({
            data: res.data,
            totalCount: res.pagination.total,
            totalAmount: res.pagination.totalAmount,
            loading: false,
            error: null,
          });
          setFetchedRange({ startDate, endDate });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setState({
            data: [],
            totalCount: 0,
            totalAmount: 0,
            loading: false,
            error:
              err instanceof Error ? err.message : "Error al cargar gastos",
          });
          setFetchedRange({ startDate, endDate });
        }
      });
    return () => controller.abort();
  }, [startDate, endDate, trigger]);

  // Loading is true while the fetched range doesn't match the requested range.
  // This covers both initial load and period changes without setState in effect body.
  const isStale =
    !fetchedRange ||
    fetchedRange.startDate !== startDate ||
    fetchedRange.endDate !== endDate;

  const refresh = useCallback(() => {
    setFetchedRange(null);
    setTrigger((t) => t + 1);
  }, []);

  return {
    data: state.data,
    totalCount: state.totalCount,
    loading: state.loading || isStale,
    error: state.error,
    totalAmount: state.totalAmount,
    refresh,
  };
}
