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

  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listExpenses({ ...monthRange() })
      .then((res) => {
        if (!controller.signal.aborted) {
          setState({ data: res.data, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setState({
            data: [],
            loading: false,
            error:
              err instanceof Error ? err.message : "Error al cargar gastos",
          });
        }
      });
    return () => controller.abort();
  }, [trigger]);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setTrigger((t) => t + 1);
  }, []);

  return { ...state, refresh };
}
