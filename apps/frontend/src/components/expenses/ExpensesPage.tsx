import type { Expense } from "@packages/core";
import { DateTime } from "luxon";
import { lazy, memo, Suspense, useState } from "react";

import { MobileFAB } from "@/components/dashboard/MobileFAB";
import { AppLayout, type AppPage } from "@/components/layout/AppLayout";
import { TransactionList } from "@/components/shared/TransactionList";
import { useExpenses } from "@/hooks/expenses/useExpenses";
import { usePeriod } from "@/hooks/usePeriod";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/types/expense";
import type { Period } from "@/utils/getDateRange";

const CreateExpenseDrawer = lazy(() =>
  import("@/components/shared/ExpenseDrawer").then((m) => ({
    default: m.ExpenseDrawer,
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

const ExpenseRow = memo(function ExpenseRow({
  expense,
  index,
  onEdit,
}: {
  expense: Expense;
  index: number;
  onEdit: () => void;
}) {
  const time = DateTime.fromMillis(expense.paymentDate).toFormat("dd LLL");

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
        {CATEGORY_ICONS[expense.category]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85 truncate leading-snug">
          {expense.description}
        </p>
        <p className="text-[11px] text-white/30 truncate mt-0.5">
          {CATEGORY_LABELS[expense.category]}
          <span className="mx-1.5 opacity-40">·</span>
          {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
          <span className="mx-1.5 opacity-40">·</span>
          {time}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-sm font-semibold text-white/80 group-hover:text-gold transition-colors">
          S/ {expense.amount.toFixed(2)}
        </span>
        {editIcon}
      </div>
    </div>
  );
});

interface ExpensesPageProps {
  username: string | null;
  onSignOut: () => void;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export function ExpensesPage({
  username,
  onSignOut,
  activePage,
  onNavigate,
}: ExpensesPageProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>();
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

  const { data, loading, error, totalCount, totalPages, refresh } = useExpenses(
    {
      ...dateRange,
      limit: 10,
      page,
    },
  );

  return (
    <AppLayout
      username={username}
      onSignOut={onSignOut}
      activePage={activePage}
      onNavigate={onNavigate}
      title="Gastos"
      headerActions={
        <button
          onClick={() => setDrawerOpen(true)}
          id="new-expense-button"
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-[.98] text-white text-sm font-bold tracking-wide transition cursor-pointer"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M8 14.5a.75.75 0 01-.75-.75V4.31l-2.72 2.72a.75.75 0 11-1.06-1.06l4-4a.75.75 0 011.06 0l4 4a.75.75 0 11-1.06 1.06l-2.72-2.72v9.19a.75.75 0 01-.75.75z" />
          </svg>
          Nuevo gasto
        </button>
      }
    >
      <Suspense
        fallback={
          <div className="h-52 w-full rounded-2xl bg-white/3 border border-white/6 animate-pulse" />
        }
      >
        <CategoryTreemap mode="expenses" />
      </Suspense>

      <TransactionList
        loading={loading}
        error={error}
        isEmpty={data.length === 0}
        emptyMessage="Sin gastos registrados en este período"
        periodLabel={periodLabel}
        totalCount={totalCount}
        period={period}
        onPeriodChange={setPeriod}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      >
        {data.map((expense, i) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            index={i}
            onEdit={() => {
              setSelectedExpense(expense);
              setDrawerOpen(true);
            }}
          />
        ))}
      </TransactionList>

      <MobileFAB
        onNewExpense={() => {
          setSelectedExpense(undefined);
          setDrawerOpen(true);
        }}
      />

      <Suspense fallback={<div />}>
        <CreateExpenseDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedExpense(undefined);
          }}
          onCreated={refresh}
          expense={selectedExpense}
        />
      </Suspense>
    </AppLayout>
  );
}
