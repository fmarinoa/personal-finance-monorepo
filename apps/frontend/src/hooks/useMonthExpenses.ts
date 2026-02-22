import { useCallback, useEffect, useState } from "react";
import { listExpenses } from "@/lib/api";
import type { Expense } from "@packages/core";
import { DateTime } from "luxon";

interface State {
  data: Expense[];
  loading: boolean;
  error: string | null;
}

function monthRange() {
  const now = DateTime.local();
  const start = now.startOf("month").startOf("day");
  const end = now.endOf("month").endOf("day");

  return {
    startDate: start.toUTC().toMillis(),
    endDate: end.toUTC().toMillis(),
  };
}

export function useMonthExpenses() {
  const [state, setState] = useState<State>({
    data: [],
    loading: true,
    error: null,
  });

  const fetch = useCallback(async (signal?: AbortSignal) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await listExpenses({ ...monthRange() });
      if (signal?.aborted) return;
      setState({ data: res.data, loading: false, error: null });
    } catch (err) {
      if (signal?.aborted) return;
      setState({
        data: [],
        loading: false,
        error: err instanceof Error ? err.message : "Error al cargar gastos",
      });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(controller.signal);
    return () => controller.abort();
  }, [fetch]);

  const refresh = useCallback(() => fetch(), [fetch]);

  return { ...state, refresh };
}
