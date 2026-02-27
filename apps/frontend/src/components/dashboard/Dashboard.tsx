import type { Expense, Income } from "@packages/core";
import { DateTime } from "luxon";
import { lazy, Suspense, useState } from "react";

import { AppLayout, type AppPage } from "@/components/layout/AppLayout";
import { useDashboardChart } from "@/hooks/metrics/useDashboardChart";
import { useDashboardMetrics } from "@/hooks/metrics/useDashboardMetrics";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/types/expense";
import { INCOME_CATEGORY_ICONS, INCOME_CATEGORY_LABELS } from "@/types/income";

import { MobileFAB } from "./MobileFAB";

const MonthlyChart = lazy(() =>
  import("./MonthlyChart").then((m) => ({ default: m.MonthlyChart })),
);
const CreateIncomeDrawer = lazy(() =>
  import("@/components/shared/CreateIncomeDrawer").then((m) => ({
    default: m.CreateIncomeDrawer,
  })),
);
const CreateExpenseDrawer = lazy(() =>
  import("@/components/shared/CreateExpenseDrawer").then((m) => ({
    default: m.CreateExpenseDrawer,
  })),
);

/* ── Sub-components ── */

function StatCard({
  label,
  value,
  valueNode,
  mono = false,
  accent = false,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-5 rounded-2xl bg-white/3 border border-white/6 min-h-27.5">
      <span className="text-[10px] font-mono tracking-[0.15em] text-white/30 uppercase shrink-0">
        {label}
      </span>
      <div className="flex-1 flex items-center justify-center">
        {valueNode ?? (
          <span
            className={`text-3xl font-bold tracking-tight ${accent ? "text-gold" : "text-white"} ${mono ? "font-mono" : ""}`}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

function MonthAmount({
  loading,
  amount,
  color = "text-gold",
}: {
  loading: boolean;
  amount: number;
  color?: string;
}) {
  if (loading)
    return (
      <div className="h-9 w-24 rounded-lg bg-white/6 animate-pulse mt-1" />
    );
  return (
    <span className={`text-3xl font-bold tracking-tight font-mono ${color}`}>
      S/ {amount.toFixed(2)}
    </span>
  );
}

function LastExpensesTable({
  loading,
  expenses,
  onViewMore,
}: {
  loading: boolean;
  expenses: Expense[];
  onViewMore: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-5 rounded-2xl bg-white/3 border border-white/6">
      <span className="text-[10px] font-mono tracking-[0.15em] text-white/30 uppercase shrink-0">
        Últimos gastos
      </span>
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-white/6 animate-pulse" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-white/30 py-4 text-center">
          Sin gastos este mes
        </p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-white/5">
            {expenses.map((e) => (
              <tr key={e.id} className="group">
                <td className="py-2.5 pr-3 w-8 text-base leading-none">
                  {CATEGORY_ICONS[e.category as keyof typeof CATEGORY_ICONS]}
                </td>
                <td className="py-2.5 pr-3 text-white/80 max-w-40 truncate">
                  {e.description}
                </td>
                <td className="py-2.5 pr-3 text-white/35 hidden sm:table-cell whitespace-nowrap">
                  {CATEGORY_LABELS[e.category as keyof typeof CATEGORY_LABELS]}
                </td>
                <td className="py-2.5 pr-3 text-white/35 whitespace-nowrap">
                  {DateTime.fromMillis(e.paymentDate).toFormat("dd MMM", {
                    locale: "es",
                  })}
                </td>
                <td className="py-2.5 text-right font-mono text-gold font-semibold whitespace-nowrap">
                  S/ {e.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button
        onClick={onViewMore}
        className="mt-1 self-end text-xs font-mono text-white/30 hover:text-gold transition-colors cursor-pointer"
      >
        Ver más →
      </button>
    </div>
  );
}

function LastIncomesTable({
  loading,
  incomes,
  onViewMore,
}: {
  loading: boolean;
  incomes: Income[];
  onViewMore: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-5 rounded-2xl bg-white/3 border border-white/6">
      <span className="text-[10px] font-mono tracking-[0.15em] text-white/30 uppercase shrink-0">
        Últimos ingresos
      </span>
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-white/6 animate-pulse" />
          ))}
        </div>
      ) : incomes.length === 0 ? (
        <p className="text-sm text-white/30 py-4 text-center">
          Sin ingresos este mes
        </p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-white/5">
            {incomes.map((i) => (
              <tr key={i.id} className="group">
                <td className="py-2.5 pr-3 w-8 text-base leading-none">
                  {
                    INCOME_CATEGORY_ICONS[
                      i.category as keyof typeof INCOME_CATEGORY_ICONS
                    ]
                  }
                </td>
                <td className="py-2.5 pr-3 text-white/80 max-w-40 truncate">
                  {i.description}
                </td>
                <td className="py-2.5 pr-3 text-white/35 hidden sm:table-cell whitespace-nowrap">
                  {
                    INCOME_CATEGORY_LABELS[
                      i.category as keyof typeof INCOME_CATEGORY_LABELS
                    ]
                  }
                </td>
                <td className="py-2.5 pr-3 text-white/35 whitespace-nowrap">
                  {DateTime.fromMillis(i.effectiveDate).toFormat("dd MMM", {
                    locale: "es",
                  })}
                </td>
                <td className="py-2.5 text-right font-mono text-emerald-400 font-semibold whitespace-nowrap">
                  S/ {i.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button
        onClick={onViewMore}
        className="mt-1 self-end text-xs font-mono text-white/30 hover:text-emerald-400 transition-colors cursor-pointer"
      >
        Ver más →
      </button>
    </div>
  );
}
interface DashboardProps {
  username: string | null;
  onSignOut: () => void;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export function Dashboard({
  username,
  onSignOut,
  activePage,
  onNavigate,
}: DashboardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [incomeDrawerOpen, setIncomeDrawerOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { data, loading, refreshing, error, refresh } = useDashboardMetrics();
  const { data: chartData, loading: chartLoading } = useDashboardChart();

  function handleCreated(message: string) {
    refresh();
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  return (
    <AppLayout
      username={username}
      onSignOut={onSignOut}
      activePage={activePage}
      onNavigate={onNavigate}
      title="Dashboard"
      headerActions={
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setIncomeDrawerOpen(true)}
            id="new-income-button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[.98] text-white text-sm font-bold tracking-wide transition cursor-pointer"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M8 1.5a.75.75 0 01.75.75v9.19l2.72-2.72a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 111.06-1.06l2.72 2.72V2.25A.75.75 0 018 1.5z" />
            </svg>
            Nuevo ingreso
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            id="new-expense-button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-[.98] text-white text-sm font-bold tracking-wide transition cursor-pointer"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M8 14.5a.75.75 0 01-.75-.75V4.31l-2.72 2.72a.75.75 0 11-1.06-1.06l4-4a.75.75 0 011.06 0l4 4a.75.75 0 11-1.06 1.06l-2.72-2.72v9.19a.75.75 0 01-.75.75z" />
            </svg>
            Nuevo gasto
          </button>
        </div>
      }
    >
      {/* Stats row */}
      {error && !loading && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            width="14"
            height="14"
            className="shrink-0"
          >
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.875.875 0 110-1.75.875.875 0 010 1.75z" />
          </svg>
          {error}
        </div>
      )}
      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-opacity duration-500 ${refreshing ? "opacity-40" : "opacity-100"}`}
      >
        <StatCard
          label="Gastos del mes"
          valueNode={
            <MonthAmount
              loading={loading}
              amount={data.totalAmountExpenses}
              color="text-gold"
            />
          }
        />
        <StatCard
          label="Ingresos del mes"
          valueNode={
            <MonthAmount
              loading={loading}
              amount={data.totalAmountIncomes}
              color="text-emerald-400"
            />
          }
        />
        <StatCard
          label="Balance neto"
          valueNode={
            <MonthAmount
              loading={loading}
              amount={data.balance}
              color={
                loading
                  ? "text-white"
                  : data.balance >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
              }
            />
          }
        />
      </div>

      {/* Monthly chart */}
      <Suspense
        fallback={
          <div className="h-44 w-full rounded-xl bg-white/6 animate-pulse" />
        }
      >
        <MonthlyChart data={chartData} loading={chartLoading} />
      </Suspense>

      {/* Last expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LastExpensesTable
          loading={loading}
          expenses={data.lastExpenses}
          onViewMore={() => onNavigate("expenses")}
        />
        <LastIncomesTable
          loading={loading}
          incomes={data.lastIncomes}
          onViewMore={() => onNavigate("incomes")}
        />
      </div>

      {/* Mobile FAB */}
      <MobileFAB
        onNewExpense={() => setDrawerOpen(true)}
        onNewIncome={() => setIncomeDrawerOpen(true)}
      />

      {/* Create income drawer */}
      <Suspense fallback={<div />}>
        <CreateIncomeDrawer
          open={incomeDrawerOpen}
          onClose={() => setIncomeDrawerOpen(false)}
          onCreated={() => handleCreated("Ingreso registrado correctamente")}
        />
      </Suspense>
      {/* Create expense drawer */}
      <Suspense fallback={<div />}>
        <CreateExpenseDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onCreated={() => handleCreated("Gasto registrado correctamente")}
        />
      </Suspense>

      {/* Success toast */}
      <div
        role="status"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-surface-2 border border-gold/30 text-sm font-medium text-white shadow-2xl transition-all duration-300 ${
          toastVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 12 12" fill="none" width="8" height="8">
            <path
              d="M2 6l3 3 5-5"
              stroke="#34d399"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {toastMessage}
      </div>
    </AppLayout>
  );
}
