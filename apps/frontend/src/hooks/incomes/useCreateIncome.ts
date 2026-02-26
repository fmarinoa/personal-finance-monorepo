import type { CreateIncomePayload } from "@packages/core";
import { useCallback, useState } from "react";

import { createIncome } from "@/lib/api";

interface State {
  loading: boolean;
  error: string | null;
}

export function useCreateIncome(onSuccess?: () => void) {
  const [state, setState] = useState<State>({ loading: false, error: null });

  const submit = useCallback(
    async (payload: CreateIncomePayload) => {
      setState({ loading: true, error: null });
      try {
        await createIncome(payload);
        setState({ loading: false, error: null });
        onSuccess?.();
      } catch (err) {
        setState({
          loading: false,
          error: err instanceof Error ? err.message : "Error al crear ingreso",
        });
      }
    },
    [onSuccess],
  );

  return { submit, loading: state.loading, error: state.error };
}
