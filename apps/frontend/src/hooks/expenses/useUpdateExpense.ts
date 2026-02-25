import { useCallback, useState } from "react";
import { updateExpense } from "@/lib/api";
import type { CreateExpensePayload } from "@packages/core";

interface State {
  loading: boolean;
  error: string | null;
}

export function useUpdateExpense(onSuccess?: () => void) {
  const [state, setState] = useState<State>({ loading: false, error: null });

  const submit = useCallback(
    async (id: string, payload: Partial<CreateExpensePayload>) => {
      setState({ loading: true, error: null });
      try {
        await updateExpense(id, payload);
        setState({ loading: false, error: null });
        onSuccess?.();
      } catch (err) {
        setState({
          loading: false,
          error:
            err instanceof Error ? err.message : "Error al actualizar gasto",
        });
      }
    },
    [onSuccess],
  );

  return { submit, loading: state.loading, error: state.error };
}
