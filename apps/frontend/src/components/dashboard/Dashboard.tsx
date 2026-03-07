import type { Expense, Income } from "@packages/core";
import { IncomeStatus } from "@packages/core";
import { DateTime } from "luxon";
import { lazy, memo, Suspense, useState } from "react";

import { AppLayout, type AppPage } from "@/components/layout/AppLayout";
import { RecentTransactionsCard } from "@/components/shared/RecentTransactionsCard";
import { useExpenses } from "@/hooks/expenses/useExpenses";
import { useIncomes } from "@/hooks/incomes/useIncomes";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/types/expense";
import {
  INCOME_CATEGORY_ICONS,
  INCOME_CATEGORY_LABELS,
  INCOME_STATUS_LABELS,
} from "@/types/income";
import { getDateRange } from "@/utils/getDateRange";

import { MobileFAB } from "./MobileFAB";

const MonthlyChart = lazy(() =>
  import("./MonthlyChart").then((m) => ({ default: m.MonthlyChart })),
);
const CategoryTreemap = lazy(() =>
  import("../shared/CategoryTreemap").then((m) => ({
    default: m.CategoryTreemap,
  })),
);
const CreateIncomeDrawer = lazy(() =>
  import("@/components/shared/IncomeDrawer").then((m) => ({
    default: m.IncomeDrawer,
  })),
);
const CreateExpenseDrawer = lazy(() =>
  import("@/components/shared/ExpenseDrawer").then((m) => ({
    default: m.ExpenseDrawer,
  })),
);

const RecentExpenseRow = memo(function RecentExpenseRow({
  expense,
}: {
  expense: Expense;
}) {
  return (
    <tr className="group">
      <td className="py-2.5 pr-3 w-8 text-base leading-none">
        {CATEGORY_ICONS[expense.category as keyof typeof CATEGORY_ICONS]}
      </td>
      <td className="py-2.5 pr-3 text-white/80 max-w-40 truncate">
        {expense.description}
      </td>
      <td className="py-2.5 pr-3 text-white/35 hidden sm:table-cell whitespace-nowrap">
        {CATEGORY_LABELS[expense.category as keyof typeof CATEGORY_LABELS]}
      </td>
      <td className="py-2.5 pr-3 text-white/35 whitespace-nowrap">
        {DateTime.fromMillis(expense.paymentDate).toFormat("dd MMM", {
          locale: "es",
        })}
      </td>
      <td className="py-2.5 text-right font-mono text-gold font-semibold whitespace-nowrap">
        S/ {expense.amount.toFixed(2)}
      </td>
    </tr>
  );
});

const RecentIncomeRow = memo(function RecentIncomeRow({
  income,
}: {
  income: Income;
}) {
  const isProjected = income.status === IncomeStatus.PROJECTED;

  return (
    <tr className="group">
      <td className="py-2.5 pr-3 w-8 text-base leading-none">
        {
          INCOME_CATEGORY_ICONS[
            income.category as keyof typeof INCOME_CATEGORY_ICONS
          ]
        }
      </td>
      <td className="py-2.5 pr-3 max-w-40">
        <p className="text-white/80 truncate leading-snug">
          {income.description}
        </p>
        {isProjected && (
          <span className="text-[10px] font-mono text-gold/60 border border-gold/20 bg-gold/5 rounded px-1 leading-tight">
            {INCOME_STATUS_LABELS[IncomeStatus.PROJECTED]}
          </span>
        )}
      </td>
      <td className="py-2.5 pr-3 text-white/35 hidden sm:table-cell whitespace-nowrap">
        {
          INCOME_CATEGORY_LABELS[
            income.category as keyof typeof INCOME_CATEGORY_LABELS
          ]
        }
      </td>
      <td className="py-2.5 pr-3 text-white/35 whitespace-nowrap">
        {DateTime.fromMillis(income.effectiveDate).toFormat("dd MMM", {
          locale: "es",
        })}
      </td>
      <td className="py-2.5 text-right whitespace-nowrap">
        <span
          className={`font-mono font-semibold ${isProjected ? "text-white/40" : "text-emerald-400"}`}
        >
          S/ {income.amount.toFixed(2)}
        </span>
      </td>
    </tr>
  );
});

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
  const [chartRefreshKey, setChartRefreshKey] = useState(0);

  const { startDate, endDate } = getDateRange("this-month");

  function handleCreated(message: string) {
    incomesRefresh();
    expensesRefresh();
    setChartRefreshKey((k) => k + 1);
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  const {
    data: incomesData,
    loading: incomesLoading,
    refresh: incomesRefresh,
  } = useIncomes({
    startDate,
    endDate,
    limit: 5,
  });

  const {
    data: expensesData,
    loading: expensesLoading,
    refresh: expensesRefresh,
  } = useExpenses({
    startDate,
    endDate,
    limit: 5,
  });

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
      {/* Monthly chart */}
      <Suspense
        fallback={
          <div className="h-44 w-full rounded-xl bg-white/6 animate-pulse" />
        }
      >
        <MonthlyChart refreshTrigger={chartRefreshKey} />
      </Suspense>

      {/* Category treemap */}
      <Suspense
        fallback={
          <div className="h-52 w-full rounded-2xl bg-white/3 border border-white/6 animate-pulse" />
        }
      >
        <CategoryTreemap mode="both" refreshTrigger={chartRefreshKey} />
      </Suspense>

      {/* Recent transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecentTransactionsCard
          title="Últimos gastos"
          loading={expensesLoading}
          isEmpty={expensesData.length === 0}
          emptyMessage="Sin gastos este mes"
          onViewMore={() => onNavigate("expenses")}
          viewMoreClassName="hover:text-gold"
        >
          {expensesData.map((e) => (
            <RecentExpenseRow key={e.id} expense={e} />
          ))}
        </RecentTransactionsCard>

        <RecentTransactionsCard
          title="Últimos ingresos"
          loading={incomesLoading}
          isEmpty={incomesData.length === 0}
          emptyMessage="Sin ingresos este mes"
          onViewMore={() => onNavigate("incomes")}
          viewMoreClassName="hover:text-emerald-400"
        >
          {incomesData.map((i) => (
            <RecentIncomeRow key={i.id} income={i} />
          ))}
        </RecentTransactionsCard>
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
