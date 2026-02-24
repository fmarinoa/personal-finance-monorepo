import { useState } from "react";

import { AppLayout, type AppPage } from "@/components/layout/AppLayout";
import { CreateExpenseDrawer } from "@/components/shared/CreateExpenseDrawer";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/types/expense";

import { MobileFAB } from "./MobileFAB";

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

function MonthTotal({
  loading,
  totalAmount,
}: {
  loading: boolean;
  totalAmount: number;
}) {
  if (loading)
    return (
      <div className="h-9 w-24 rounded-lg bg-white/6 animate-pulse mt-1" />
    );
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-3xl font-bold tracking-tight font-mono text-gold">
        S/ {totalAmount.toFixed(2)}
      </span>
    </div>
  );
}

function MonthlyVariationIndicator({
  loading,
  previousMonthVariationPercentage,
}: {
  loading: boolean;
  previousMonthVariationPercentage: number;
}) {
  if (loading)
    return (
      <div className="h-9 w-24 rounded-lg bg-white/6 animate-pulse mt-1" />
    );
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-3xl font-bold tracking-tight font-mono text-gold">
        {previousMonthVariationPercentage.toFixed(0)} %
      </span>
    </div>
  );
}

function TopCategory({
  loading,
  topCategory,
  totalAmount,
}: {
  loading: boolean;
  topCategory: string;
  totalAmount: number;
}) {
  if (loading)
    return (
      <div className="h-9 w-24 rounded-lg bg-white/6 animate-pulse mt-1" />
    );
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl font-bold tracking-tight font-mono text-gold">
        {CATEGORY_ICONS[topCategory as keyof typeof CATEGORY_ICONS]}
        {CATEGORY_LABELS[topCategory as keyof typeof CATEGORY_LABELS]}
      </span>
      <span className="text-sm font-mono text-gold">
        S/ {totalAmount.toFixed(0)}
      </span>
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
  const [toastVisible, setToastVisible] = useState(false);

  const { data, loading, refreshing, error, refresh } = useDashboardMetrics();

  function handleCreated() {
    refresh();
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
          label="Gasto del mes"
          valueNode={
            <MonthTotal
              loading={loading}
              totalAmount={data.currentMonthTotal}
            />
          }
          accent
        />
        <StatCard
          label="Variación de gasto vs mes anterior"
          valueNode={
            <MonthlyVariationIndicator
              loading={loading}
              previousMonthVariationPercentage={
                data.previousMonthVariationPercentage
              }
            />
          }
          accent
        />
        <StatCard
          label="Categoría más gastada"
          valueNode={
            <TopCategory
              loading={loading}
              topCategory={data.topCategory.code}
              totalAmount={data.topCategory.total}
            />
          }
          accent
        />
      </div>

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
