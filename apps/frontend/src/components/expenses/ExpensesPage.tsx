import type { Expense } from "@packages/core";
import { useState } from "react";

import { MobileFAB } from "@/components/dashboard/MobileFAB";
import { AppLayout, type AppPage } from "@/components/layout/AppLayout";
import { CreateExpenseDrawer } from "@/components/shared/CreateExpenseDrawer";
import { useExpenses } from "@/hooks/expenses/useExpenses";
import { type Period, usePeriod } from "@/hooks/usePeriod";

import { Table } from "./Table";

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

  // Reset to page 1 when period changes
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
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light active:scale-[.98] text-canvas text-sm font-bold tracking-wide transition cursor-pointer"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M8 1.5a.75.75 0 01.75.75V7.5h5.25a.75.75 0 010 1.5H8.75v5.25a.75.75 0 01-1.5 0V9H2a.75.75 0 010-1.5h5.25V2.25A.75.75 0 018 1.5z" />
          </svg>
          Nuevo gasto
        </button>
      }
    >
      <Table
        data={data}
        loading={loading}
        error={error}
        periodLabel={periodLabel}
        totalCount={totalCount}
        period={period}
        setPeriod={setPeriod}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEditExpense={(expense) => {
          setSelectedExpense(expense);
          setDrawerOpen(true);
        }}
      />

      <MobileFAB
        onNewExpense={() => {
          setSelectedExpense(undefined);
          setDrawerOpen(true);
        }}
      />

      <CreateExpenseDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedExpense(undefined);
        }}
        onCreated={refresh}
        expense={selectedExpense}
      />
    </AppLayout>
  );
}
