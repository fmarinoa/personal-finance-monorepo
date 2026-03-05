import type { CategoryBreakdown } from "@packages/core";
import { useCallback, useEffect, useState } from "react";

import { fetchCategoryBreakdown } from "@/lib/api";
import { getDateRange,type Period } from "@/utils/getDateRange";

const EMPTY: CategoryBreakdown = { expenses: [], incomes: [] };

export function useCategoryBreakdown(period: Period = "this-month") {
  const [data, setData] = useState<CategoryBreakdown>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange(period);
    fetchCategoryBreakdown({ startDate, endDate, onlyReceived: true })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar el desglose por categoría",
        );
        setLoading(false);
      });
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
