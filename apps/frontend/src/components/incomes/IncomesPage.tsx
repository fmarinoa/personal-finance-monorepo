import type { Income } from "@packages/core";
import { useState } from "react";

import { AppLayout, type AppPage } from "@/components/layout/AppLayout";
import { MobileFAB } from "@/components/dashboard/MobileFAB";
import { CreateIncomeDrawer } from "@/components/shared/CreateIncomeDrawer";
import { usePeriod, type Period } from "@/hooks/usePeriod";
import { useIncomes } from "@/hooks/incomes/useIncomes";

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

  const { data, loading, error, totalCount, totalAmount, totalPages, refresh } =
    useIncomes({ ...dateRange, limit: 10, page });

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
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light active:scale-[.98] text-canvas text-sm font-bold tracking-wide transition cursor-pointer"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path d="M8 1.5a.75.75 0 01.75.75V7.5h5.25a.75.75 0 010 1.5H8.75v5.25a.75.75 0 01-1.5 0V9H2a.75.75 0 010-1.5h5.25V2.25A.75.75 0 018 1.5z" />
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
        totalAmount={totalAmount}
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
