import type { DashboardChartPoint } from "@packages/core";
import { DateTime } from "luxon";

const PADDING = { top: 12, right: 12, bottom: 24, left: 24 };
const VIEW_W = 400;
const VIEW_H = 80;
const CHART_W = VIEW_W - PADDING.left - PADDING.right;
const CHART_H = VIEW_H - PADDING.top - PADDING.bottom;

function toPoints(
  data: DashboardChartPoint[],
  key: "totalAmountIncomes" | "totalAmountExpenses",
  min: number,
  max: number,
): string {
  const range = max - min || 1;
  return data
    .map((d, i) => {
      const x = PADDING.left + (i / Math.max(data.length - 1, 1)) * CHART_W;
      const y = PADDING.top + (1 - (d[key] - min) / range) * CHART_H;
      return `${x},${y}`;
    })
    .join(" ");
}

function toAreaPath(
  data: DashboardChartPoint[],
  key: "totalAmountIncomes" | "totalAmountExpenses",
  min: number,
  max: number,
): string {
  const range = max - min || 1;
  const baseline = PADDING.top + CHART_H;
  const pts = data.map((d, i) => {
    const x = PADDING.left + (i / Math.max(data.length - 1, 1)) * CHART_W;
    const y = PADDING.top + (1 - (d[key] - min) / range) * CHART_H;
    return [x, y] as [number, number];
  });
  if (pts.length === 0) return "";
  return (
    `M ${pts[0][0]},${baseline} ` +
    pts.map(([x, y]) => `L ${x},${y}`).join(" ") +
    ` L ${pts[pts.length - 1][0]},${baseline} Z`
  );
}

function SkeletonChart() {
  return (
    <div className="w-full rounded-2xl bg-white/3 border border-white/6 p-5 flex flex-col gap-3">
      <div className="h-3 w-24 rounded bg-white/6 animate-pulse" />
      <div className="h-44 w-full rounded-xl bg-white/6 animate-pulse" />
    </div>
  );
}

interface MonthlyChartProps {
  data: DashboardChartPoint[];
  loading: boolean;
}

export function MonthlyChart({ data, loading }: MonthlyChartProps) {
  if (loading) return <SkeletonChart />;

  if (data.length === 0) {
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

  const allValues = data.flatMap((d) => [
    d.totalAmountIncomes,
    d.totalAmountExpenses,
  ]);
  const min = 0;
  const max = Math.max(...allValues, 1);

  const incomePoints = toPoints(data, "totalAmountIncomes", min, max);
  const expensePoints = toPoints(data, "totalAmountExpenses", min, max);
  const incomeArea = toAreaPath(data, "totalAmountIncomes", min, max);
  const expenseArea = toAreaPath(data, "totalAmountExpenses", min, max);

  // Y-axis ticks (3 labels: 0, mid, max)
  const yTicks = [0, max / 2, max];

  return (
    <div className="w-full rounded-2xl bg-white/3 border border-white/6 px-5 py-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-[0.15em] text-white/30 uppercase">
          Evolución mensual
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/70">
            <span className="w-4 h-0.5 bg-emerald-400 rounded-full inline-block" />
            Ingresos
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-rose-400">
            <span className="w-4 h-0.5 bg-rose-400 rounded-full inline-block" />
            Gastos
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        aria-label="Gráfico de evolución mensual de ingresos y gastos"
      >
        <defs>
          <linearGradient id="income-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="expense-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff2056" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#ff2056" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y =
            PADDING.top + (1 - (tick - min) / (max - min || 1)) * CHART_H;
          return (
            <g key={i}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={VIEW_W - PADDING.right}
                y2={y}
                stroke="white"
                strokeOpacity="0.05"
                strokeWidth="1"
              />
              <text
                x={PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="4"
                fontFamily="monospace"
                fill="rgba(255,255,255,0.25)"
              >
                {tick >= 1000
                  ? `${(tick / 1000).toFixed(1)}k`
                  : tick.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Filled areas */}
        <path d={incomeArea} fill="url(#income-gradient)" />
        <path d={expenseArea} fill="url(#expense-gradient)" />

        {/* Lines */}
        <polyline
          points={incomePoints}
          fill="none"
          stroke="#34d399"
          strokeWidth="1"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={expensePoints}
          fill="none"
          stroke="#ff2056"
          strokeWidth="1"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots + month labels */}
        {data.map((d, i) => {
          const x = PADDING.left + (i / Math.max(data.length - 1, 1)) * CHART_W;
          const range = max - min || 1;
          const yIncome =
            PADDING.top + (1 - (d.totalAmountIncomes - min) / range) * CHART_H;
          const yExpense =
            PADDING.top + (1 - (d.totalAmountExpenses - min) / range) * CHART_H;
          const label = DateTime.fromFormat(d.month, "yyyy-MM").toFormat(
            "MMM",
            { locale: "es" },
          );

          return (
            <g key={d.month}>
              {/* Income dot */}
              <circle cx={x} cy={yIncome} r="2" fill="#34d399" />
              <circle
                cx={x}
                cy={yIncome}
                r="4"
                fill="#34d399"
                fillOpacity="0.15"
              />
              {/* Expense dot */}
              <circle cx={x} cy={yExpense} r="2" fill="#ff2056" />
              <circle
                cx={x}
                cy={yExpense}
                r="4"
                fill="#ff2056"
                fillOpacity="0.12"
              />
              {/* Month label */}
              <text
                x={x}
                y={VIEW_H - 6}
                textAnchor="middle"
                fontSize="4"
                fontFamily="monospace"
                fill="rgba(255,255,255,0.18)"
                style={{ textTransform: "capitalize" }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
