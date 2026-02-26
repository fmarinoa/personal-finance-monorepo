import type { CreateExpensePayload } from "@packages/core";
import { useCallback, useState } from "react";

import { createExpense } from "@/lib/api";

interface State {
  loading: boolean;
  error: string | null;
}

export function useCreateExpense(onSuccess?: () => void) {
  const [state, setState] = useState<State>({ loading: false, error: null });

  const submit = useCallback(
    async (payload: CreateExpensePayload) => {
      setState({ loading: true, error: null });
      try {
        await createExpense(payload);
        setState({ loading: false, error: null });
        onSuccess?.();
      } catch (err) {
        setState({
          loading: false,
          error: err instanceof Error ? err.message : "Error al crear gasto",
        });
      }
    },
    [onSuccess],
  );

  return { submit, loading: state.loading, error: state.error };
}
