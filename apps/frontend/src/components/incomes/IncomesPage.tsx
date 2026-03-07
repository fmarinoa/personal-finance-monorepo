import type { Income } from "@packages/core";
import { IncomeStatus } from "@packages/core";
import { DateTime } from "luxon";
import { lazy, memo, Suspense, useState } from "react";

import { MobileFAB } from "@/components/dashboard/MobileFAB";
import { AppLayout, type AppPage } from "@/components/layout/AppLayout";
import { TransactionList } from "@/components/shared/TransactionList";
import { useIncomes } from "@/hooks/incomes/useIncomes";
import { usePeriod } from "@/hooks/usePeriod";
import {
  INCOME_CATEGORY_ICONS,
  INCOME_CATEGORY_LABELS,
  INCOME_STATUS_LABELS,
} from "@/types/income";
import type { Period } from "@/utils/getDateRange";

const CreateIncomeDrawer = lazy(() =>
  import("@/components/shared/IncomeDrawer").then((m) => ({
    default: m.IncomeDrawer,
  })),
);
const CategoryTreemap = lazy(() =>
  import("@/components/shared/CategoryTreemap").then((m) => ({
    default: m.CategoryTreemap,
  })),
);

// Hoisted — never re-created on render
const editIcon = (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    width="12"
    height="12"
    className="text-white/20 group-hover:text-white/50 transition-colors"
  >
    <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z" />
  </svg>
);

const IncomeRow = memo(function IncomeRow({
  income,
  index,
  onEdit,
}: {
  income: Income;
  index: number;
  onEdit: () => void;
}) {
  const isProjected = income.status === IncomeStatus.PROJECTED;
  const date = income.receivedDate ?? income.projectedDate;
  const time = date ? DateTime.fromMillis(date).toFormat("dd LLL") : "—";

  return (
    <div
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onEdit()}
      className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all duration-150 cursor-pointer"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="w-8 h-8 rounded-lg bg-white/6 flex items-center justify-center shrink-0 text-sm">
        {INCOME_CATEGORY_ICONS[income.category]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85 truncate leading-snug">
          {income.description}
        </p>
        <p className="text-[11px] text-white/30 truncate mt-0.5">
          {INCOME_CATEGORY_LABELS[income.category]}
          <span className="mx-1.5 opacity-40">·</span>
          {time}
        </p>
        {isProjected && (
          <span className="inline-block mt-0.5 text-[10px] font-mono text-gold/60 border border-gold/20 bg-gold/5 rounded px-1 leading-tight">
            {INCOME_STATUS_LABELS[IncomeStatus.PROJECTED]}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`font-mono text-sm font-semibold transition-colors ${
            isProjected
              ? "text-white/40 group-hover:text-white/60"
              : "text-white/80 group-hover:text-gold"
          }`}
        >
          S/ {income.amount.toFixed(2)}
        </span>
        {editIcon}
      </div>
    </div>
  );
});

interface IncomesPageProps {
  username: string | null;
  onSignOut: () => void;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export function IncomesPage({
  username,
  onSignOut,
  activePage,
  onNavigate,
}: IncomesPageProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | undefined>();
  const [page, setPage] = useState(1);

  const {
    period,
    setPeriod: setRawPeriod,
    dateRange,
    label: periodLabel,
  } = usePeriod();

  const setPeriod = (p: Period) => {
    setPage(1);
    setRawPeriod(p);
  };

  const { data, loading, error, totalCount, totalPages, refresh } = useIncomes({
    ...dateRange,
    limit: 10,
    page,
  });

  return (
    <AppLayout
      username={username}
      onSignOut={onSignOut}
      activePage={activePage}
      onNavigate={onNavigate}
      title="Ingresos"
      headerActions={
        <button
          onClick={() => setDrawerOpen(true)}
          id="new-income-button"
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[.98] text-white font-bold tracking-wide transition cursor-pointer"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M8 1.5a.75.75 0 01.75.75v9.19l2.72-2.72a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 111.06-1.06l2.72 2.72V2.25A.75.75 0 018 1.5z" />
          </svg>
          Nuevo ingreso
        </button>
      }
    >
      <Suspense
        fallback={
          <div className="h-52 w-full rounded-2xl bg-white/3 border border-white/6 animate-pulse" />
        }
      >
        <CategoryTreemap mode="incomes" />
      </Suspense>

      <TransactionList
        loading={loading}
        error={error}
        isEmpty={data.length === 0}
        emptyMessage="Sin ingresos registrados en este período"
        periodLabel={periodLabel}
        totalCount={totalCount}
        period={period}
        onPeriodChange={setPeriod}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      >
        {data.map((income, i) => (
          <IncomeRow
            key={income.id}
            income={income}
            index={i}
            onEdit={() => {
              setSelectedIncome(income);
              setDrawerOpen(true);
            }}
          />
        ))}
      </TransactionList>

      <MobileFAB
        onNewExpense={() => setDrawerOpen(true)}
        onNewIncome={() => {
          setSelectedIncome(undefined);
          setDrawerOpen(true);
        }}
      />

      <Suspense fallback={<div />}>
        <CreateIncomeDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedIncome(undefined);
          }}
          onCreated={refresh}
          income={selectedIncome}
        />
      </Suspense>
    </AppLayout>
  );
}
