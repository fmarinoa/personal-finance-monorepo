import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CreateExpenseDrawer } from "./CreateExpenseDrawer";
import { MobileFAB } from "./MobileFAB";
import { MonthExpenses } from "./MonthExpenses";
import { useMonthExpenses } from "@/hooks/useMonthExpenses";
import type { Expense } from "@packages/core";

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
    <div className="flex flex-col gap-1.5 px-5 py-5 rounded-2xl bg-white/3 border border-white/6">
      <span className="text-[10px] font-mono tracking-[0.15em] text-white/30 uppercase">
        {label}
      </span>
      {valueNode ?? (
        <span
          className={`text-3xl font-bold tracking-tight ${accent ? "text-gold" : "text-white"} ${mono ? "font-mono" : ""}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

function MonthTotal({ data, loading }: { data: Expense[]; loading: boolean }) {
  const total = data.reduce((s, e) => s + e.amount, 0);
  if (loading)
    return (
      <div className="h-9 w-24 rounded-lg bg-white/6 animate-pulse mt-1" />
    );
  return (
    <span className="text-3xl font-bold tracking-tight font-mono text-gold">
      S/ {total.toFixed(2)}
    </span>
  );
}

interface DashboardProps {
  username: string | null;
  onSignOut: () => void;
}

export function Dashboard({ username, onSignOut }: DashboardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const {
    data: monthData,
    loading: monthLoading,
    error: monthError,
    refresh: refreshMonth,
  } = useMonthExpenses();

  function handleCreated() {
    refreshMonth();
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  return (
    <AppLayout
      username={username}
      onSignOut={onSignOut}
      title="Dashboard"
      headerActions={
        <button
          onClick={() => setDrawerOpen(true)}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light active:scale-[.98] text-canvas text-sm font-bold tracking-wide transition cursor-pointer"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M8 1.5a.75.75 0 01.75.75V7.5h5.25a.75.75 0 010 1.5H8.75v5.25a.75.75 0 01-1.5 0V9H2a.75.75 0 010-1.5h5.25V2.25A.75.75 0 018 1.5z" />
          </svg>
          Nuevo gasto
        </button>
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Este mes"
          valueNode={<MonthTotal data={monthData} loading={monthLoading} />}
          accent
        />
        <StatCard label="Promedio diario" value="—" mono />
        <StatCard label="Categorías" value="—" mono />
      </div>

      {/* Month expenses list */}
      <MonthExpenses
        data={monthData}
        loading={monthLoading}
        error={monthError}
      />

      {/* Mobile FAB */}
      <MobileFAB onNewExpense={() => setDrawerOpen(true)} />

      {/* Create expense drawer */}
      <CreateExpenseDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleCreated}
      />

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
        Gasto registrado correctamente
      </div>
    </AppLayout>
  );
}
