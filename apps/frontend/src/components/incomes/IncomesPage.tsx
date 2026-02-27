import type { Income } from "@packages/core";
import { useState } from "react";

import { MobileFAB } from "@/components/dashboard/MobileFAB";
import { AppLayout, type AppPage } from "@/components/layout/AppLayout";
import { CreateIncomeDrawer } from "@/components/shared/CreateIncomeDrawer";
import { useIncomes } from "@/hooks/incomes/useIncomes";
import { type Period, usePeriod } from "@/hooks/usePeriod";

import { IncomesTable } from "./IncomesTable";

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
      <IncomesTable
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
        onEditIncome={(income) => {
          setSelectedIncome(income);
          setDrawerOpen(true);
        }}
      />

      <MobileFAB
        onNewExpense={() => setDrawerOpen(true)}
        onNewIncome={() => {
          setSelectedIncome(undefined);
          setDrawerOpen(true);
        }}
      />

      <CreateIncomeDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedIncome(undefined);
        }}
        onCreated={refresh}
        income={selectedIncome}
      />
    </AppLayout>
  );
}
