import type { CategoryBreakdownItem } from "@packages/core";
import { useEffect, useState } from "react";
import { ResponsiveContainer, Treemap } from "recharts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategoryBreakdown } from "@/hooks/metrics/useCategoryBreakdown";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/types/expense";
import { INCOME_CATEGORY_ICONS, INCOME_CATEGORY_LABELS } from "@/types/income";
import type { Period } from "@/utils/getDateRange";

export type CategoryTreemapMode = "both" | "expenses" | "incomes";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "this-month", label: "Este mes" },
  { value: "last-3-month", label: "3 meses" },
  { value: "last-6-month", label: "6 meses" },
  { value: "last-12-month", label: "12 meses" },
];

const EXPENSE_COLORS: Record<string, string> = {
  FOOD: "#f59e0b",
  TRANSPORT: "#3b82f6",
  ENTERTAINMENT: "#a855f7",
  UTILITIES: "#06b6d4",
  HEALTHCARE: "#f43f5e",
  EDUCATION: "#6366f1",
  SHOPPING: "#ec4899",
  TRAVEL: "#14b8a6",
  OTHER: "#6b7280",
};

const INCOME_COLORS: Record<string, string> = {
  SALARY: "#10b981",
  BUSINESS: "#22c55e",
  INVESTMENT: "#0ea5e9",
  GIFT: "#84cc16",
  OTHER: "#6b7280",
};

function fmtAmount(v: number): string {
  if (v >= 1000) return `S/ ${(v / 1000).toFixed(1)}k`;
  return `S/ ${v.toFixed(0)}`;
}

interface CellData {
  name: string;
  value: number;
  fill: string;
  label: string;
  icon: string;
  percentage: number;
}

function buildExpenseCells(items: CategoryBreakdownItem[]): CellData[] {
  return items.map((item) => ({
    name: item.category,
    value: item.total,
    fill: EXPENSE_COLORS[item.category] ?? "#6b7280",
    label:
      CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ??
      item.category,
    icon: CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] ?? "•",
    percentage: item.percentage,
  }));
}

function buildIncomeCells(items: CategoryBreakdownItem[]): CellData[] {
  return items.map((item) => ({
    name: item.category,
    value: item.total,
    fill: INCOME_COLORS[item.category] ?? "#6b7280",
    label:
      INCOME_CATEGORY_LABELS[
        item.category as keyof typeof INCOME_CATEGORY_LABELS
      ] ?? item.category,
    icon:
      INCOME_CATEGORY_ICONS[
        item.category as keyof typeof INCOME_CATEGORY_ICONS
      ] ?? "•",
    percentage: item.percentage,
  }));
}

function CustomCell(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  label?: string;
  icon?: string;
  value?: number;
  percentage?: number;
}) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fill,
    label,
    icon,
    value,
    percentage,
  } = props;

  if (width <= 2 || height <= 2) return null;

  const showIcon = width > 22 && height > 22;
  const showLabel = width > 38 && height > 34;
  const showAmount = width > 50 && height > 50;
  const showPercent = width > 60 && height > 66;
  const truncLabel =
    label && label.length > 8 && width < 80
      ? label.slice(0, 6) + "…"
      : label && label.length > 10 && width < 110
        ? label.slice(0, 8) + "…"
        : label;

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        fill={fill}
        fillOpacity={0.65}
        rx={0}
      />
      {showIcon && (
        <text x={x + 6} y={y + 16} fontSize={11} fill="white" fillOpacity={0.9}>
          {icon}
        </text>
      )}
      {showLabel && (
        <text
          x={x + 6}
          y={y + (showIcon ? 29 : 16)}
          fontSize={9}
          fontFamily="monospace"
          fill="white"
          fillOpacity={0.85}
        >
          {truncLabel}
        </text>
      )}
      {showAmount && (
        <text
          x={x + 6}
          y={y + (showIcon ? 42 : 29)}
          fontSize={9}
          fontFamily="monospace"
          fill="white"
          fillOpacity={0.6}
        >
          {value !== undefined ? fmtAmount(value) : ""}
        </text>
      )}
      {showPercent && (
        <text
          x={x + 6}
          y={y + (showIcon ? 54 : 41)}
          fontSize={9}
          fontFamily="monospace"
          fill="white"
          fillOpacity={0.4}
        >
          {percentage !== undefined ? `${percentage.toFixed(1)}%` : ""}
        </text>
      )}
    </g>
  );
}

function TreeBlock({
  title,
  cells,
  loading,
}: {
  title: string;
  cells?: CellData[];
  loading: boolean;
}) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
      <span className="text-[9px] font-mono tracking-[0.15em] text-white/20 uppercase px-0.5">
        {title}
      </span>
      {loading ? (
        <div className="h-52 bg-white/4 animate-pulse" />
      ) : !cells || cells === undefined ? (
        <div className="h-52 border-white/5 flex items-center justify-center">
          <p className="text-xs text-white/25 font-mono">Sin datos</p>
        </div>
      ) : (
        <div className="h-52 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={cells}
              dataKey="value"
              content={<CustomCell />}
              isAnimationActive={false}
            />
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function CategoryTreemap({
  mode = "both",
  refreshTrigger,
}: {
  mode?: CategoryTreemapMode;
  refreshTrigger?: number;
}) {
  const { onlyExpenses, onlyIncomes } =
    mode === "expenses"
      ? { onlyExpenses: true, onlyIncomes: false }
      : mode === "incomes"
        ? { onlyExpenses: false, onlyIncomes: true }
        : { onlyExpenses: false, onlyIncomes: false };

  const [period, setPeriod] = useState<Period>("this-month");
  const { data, loading, refresh } = useCategoryBreakdown(
    period,
    onlyExpenses,
    onlyIncomes,
  );

  useEffect(() => {
    if (refreshTrigger) refresh();
  }, [refreshTrigger, refresh]);

  const expenseCells = data.expenses
    ? buildExpenseCells(data.expenses)
    : undefined;
  const incomeCells = data.incomes ? buildIncomeCells(data.incomes) : undefined;

  return (
    <div className="w-full rounded-2xl bg-white/3 border border-white/6 px-4 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-[0.15em] text-white/30 uppercase">
          Desglose por categoría
        </span>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger
            size="sm"
            className="border-white/8 bg-white/4 text-white/60 hover:border-white/20 hover:text-white/90 data-[state=open]:border-gold/50 data-[state=open]:text-white font-mono text-[10px] h-auto py-1 px-2 shadow-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="dark min-w-28">
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        {(mode === "both" || mode === "expenses") && (
          <TreeBlock title="Gastos" cells={expenseCells} loading={loading} />
        )}
        {(mode === "both" || mode === "incomes") && (
          <TreeBlock title="Ingresos" cells={incomeCells} loading={loading} />
        )}
      </div>
    </div>
  );
}
