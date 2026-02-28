import type { CreateIncomePayload } from "@packages/core";
import { useCallback, useState } from "react";

import { updateIncome } from "@/lib/api";

interface State {
  loading: boolean;
  error: string | null;
}

export function useUpdateIncome(onSuccess?: () => void) {
  const [state, setState] = useState<State>({ loading: false, error: null });

  const submit = useCallback(
    async (id: string, payload: Partial<CreateIncomePayload>) => {
      setState({ loading: true, error: null });
      try {
        await updateIncome(id, payload);
        setState({ loading: false, error: null });
        onSuccess?.();
      } catch (err) {
        setState({
          loading: false,
          error:
            err instanceof Error ? err.message : "Error al actualizar ingreso",
        });
      }
    },
    [onSuccess],
  );

  return { submit, loading: state.loading, error: state.error };
}
