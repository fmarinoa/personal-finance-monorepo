import { DateTime } from "luxon";
import { useState } from "react";
import { useEffect } from "react";
import type { TooltipProps } from "recharts";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { Tooltip } from "recharts";

import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardChart } from "@/hooks/metrics/useDashboardChart";
import { cn } from "@/lib/utils";
import type { ChartPeriod } from "@/utils/getDateRange";

const chartConfig = {
  totalAmountIncomes: { label: "Ingresos", color: "var(--color-income)" },
  totalAmountExpenses: { label: "Gastos", color: "var(--color-expense)" },
} satisfies ChartConfig;

const PERIOD_OPTIONS: { value: ChartPeriod; label: string }[] = [
  { value: "last-3-month", label: "3 meses" },
  { value: "last-6-month", label: "6 meses" },
  { value: "last-12-month", label: "12 meses" },
];

function fmtAmount(v: number): string {
  if (Math.abs(v) >= 1000) {
    return `S/ ${(Math.abs(v) / 1000).toFixed(1)}k`;
  }
  return `S/ ${Math.abs(v).toFixed(2)}`;
}

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-0.5 py-2.5">
      <span className="text-[9px] font-mono tracking-[0.15em] text-white/25 uppercase">
        {label}
      </span>
      <span className={cn("text-sm font-mono font-medium", color)}>
        {value}
      </span>
    </div>
  );
}

function PeriodStatSection({
  label,
  incomes,
  expenses,
  balance,
}: {
  label: string;
  incomes: number;
  expenses: number;
  balance: number;
}) {
  return (
    <div>
      <div className="px-3 pb-0.5 text-center">
        <span className="text-[9px] font-mono tracking-[0.15em] text-white/20 uppercase">
          {label}
        </span>
        <div className="h-px bg-white/5 my-2" />
      </div>
      <div className="flex divide-x divide-white/5">
        <StatCell
          label="Ingresos"
          value={fmtAmount(incomes)}
          color="text-income font-semibold"
        />
        <StatCell
          label="Balance"
          value={`${balance >= 0 ? "+" : "-"}${fmtAmount(balance)}`}
          color={
            balance >= 0
              ? "text-income font-semibold"
              : "text-expense font-semibold"
          }
        />
        <StatCell
          label="Gastos"
          value={fmtAmount(expenses)}
          color="text-expense font-semibold"
        />
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const income = (payload.find((p) => p.dataKey === "totalAmountIncomes")
    ?.value ?? 0) as number;
  const expense = (payload.find((p) => p.dataKey === "totalAmountExpenses")
    ?.value ?? 0) as number;
  const balance = income - expense;
  const monthLabel = DateTime.fromFormat(String(label), "yyyy-MM").toFormat(
    "MMMM yyyy",
    { locale: "es" },
  );

  return (
    <div className="rounded-xl border border-white/8 bg-[#0d0d0d] px-3.5 py-3 shadow-2xl text-[11px] font-mono min-w-36">
      <p className="text-white/35 mb-2 capitalize">{monthLabel}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-8">
          <span className="text-white/40">Ingresos</span>
          <span className="text-income">S/ {income.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between gap-8">
          <span className="text-white/40">Gastos</span>
          <span className="text-expense">S/ {expense.toFixed(2)}</span>
        </div>
        <div className="h-px bg-white/6 my-0.5" />
        <div className="flex items-center justify-between gap-8">
          <span className="text-white/50">Balance</span>
          <span
            className={
              balance >= 0
                ? "text-income font-semibold"
                : "text-expense font-semibold"
            }
          >
            {balance >= 0 ? "+" : ""}S/ {balance.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="w-full rounded-2xl bg-white/3 border border-white/6 p-5 flex flex-col gap-3">
      <div className="h-3 w-24 rounded bg-white/6 animate-pulse" />
      <div className="h-8 w-full rounded-lg bg-white/4 animate-pulse" />
      <div className="h-44 w-full rounded-xl bg-white/6 animate-pulse" />
    </div>
  );
}

export function MonthlyChart({ refreshTrigger }: { refreshTrigger?: number }) {
  const [period, setPeriod] = useState<ChartPeriod>("last-6-month");
  const { data, loading, refresh } = useDashboardChart(period);

  useEffect(() => {
    if (refreshTrigger) refresh();
  }, [refreshTrigger]);  

  if (loading) return <SkeletonChart />;

  if (data.months.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-white/3 border border-white/6 px-5 py-5 flex flex-col gap-3">
        <span className="text-[10px] font-mono tracking-[0.15em] text-white/30 uppercase">
          Evolución mensual
        </span>
        <p className="text-sm text-white/30 py-8 text-center">
          Sin datos disponibles
        </p>
      </div>
    );
  }

  const lastMonth = data.months[data.months.length - 1];
  const periodLabel =
    PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;

  return (
    <div className="w-full rounded-2xl bg-white/3 border border-white/6 px-5 py-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-[0.15em] text-white/30 uppercase">
          Evolución mensual
        </span>
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as ChartPeriod)}
        >
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

      {/* Period stats */}
      <div className="rounded-xl border border-white/5 overflow-hidden divide-y divide-white/5">
        <PeriodStatSection
          label={DateTime.fromFormat(lastMonth.month, "yyyy-MM").toFormat(
            "MMMM yyyy",
            { locale: "es" },
          )}
          incomes={lastMonth.totalAmountIncomes}
          expenses={lastMonth.totalAmountExpenses}
          balance={lastMonth.balance}
        />
        <PeriodStatSection
          label={`Total · ${periodLabel}`}
          incomes={data.total.totalAmountIncomes}
          expenses={data.total.totalAmountExpenses}
          balance={data.total.balance}
        />
      </div>

      {/* Chart */}
      <ChartContainer config={chartConfig} className="h-44 w-full">
        <BarChart
          data={data.months}
          barGap={2}
          barCategoryGap="25%"
          margin={{ top: 8, right: 48, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{
              fill: "rgba(255,255,255,0.2)",
              fontSize: 10,
              fontFamily: "monospace",
            }}
            tickFormatter={(m: string) =>
              DateTime.fromFormat(m, "yyyy-MM")
                .toFormat("MMM", {
                  locale: "es",
                })
                .toUpperCase()
            }
          />

          <YAxis
            orientation="left"
            axisLine={false}
            tickLine={false}
            width={40}
            tick={{
              fill: "rgba(255,255,255,0.2)",
              fontSize: 10,
              fontFamily: "monospace",
            }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
            }
          />

          <Tooltip
            cursor={{ fill: "#ffffff", fillOpacity: 0.05, stroke: "none" }}
            content={<CustomTooltip />}
            wrapperStyle={{ outline: "none" }}
          />

          <Bar
            dataKey="totalAmountIncomes"
            fill="var(--color-income)"
            radius={[3, 3, 0, 0]}
            activeBar={{ fill: "var(--color-income)", fillOpacity: 0.85 }}
          />
          <Bar
            dataKey="totalAmountExpenses"
            fill="var(--color-expense)"
            radius={[3, 3, 0, 0]}
            activeBar={{ fill: "var(--color-expense)", fillOpacity: 0.85 }}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            content={() => (
              <div className="flex items-center justify-center gap-5 pt-2">
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-white/40">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm inline-block opacity-80 bg-income`}
                  />
                  {chartConfig.totalAmountIncomes.label}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-white/40">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm inline-block opacity-80 bg-expense`}
                  />
                  {chartConfig.totalAmountExpenses.label}
                </span>
              </div>
            )}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
