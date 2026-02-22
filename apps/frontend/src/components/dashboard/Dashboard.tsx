import { useState } from "react";
import { signOut } from "aws-amplify/auth";
import { CreateExpenseDrawer } from "./CreateExpenseDrawer";
import { MobileNav } from "./MobileNav";
import { MobileFAB } from "./MobileFAB";
import { MonthExpenses } from "./MonthExpenses";
import { useMonthExpenses } from "@/hooks/useMonthExpenses";
import type { Expense } from "@packages/core";
import { APP_CONFIG } from "@/config/app";

interface DashboardProps {
  onSignOut: () => void;
}

export function Dashboard({ onSignOut }: DashboardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      onSignOut();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div
      className="flex min-h-screen bg-canvas text-white"
      style={{ fontFamily: "'Plus Jakarta Sans Variable', sans-serif" }}
    >
      {/* ── Sidebar ── */}
      <nav className="hidden md:flex flex-col w-55 shrink-0 border-r border-white/6 px-4 py-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-10">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="gold" />
            <path
              d="M10 28l6-8 5 4 5-7 4 6"
              stroke="canvas"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="28" cy="13" r="3" fill="canvas" />
          </svg>
          <span className="font-bold text-base tracking-tight">
            {APP_CONFIG.NAME}
          </span>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1">
          <NavItem icon={<DashboardIcon />} label="Dashboard" active />
          <NavItem icon={<ExpensesIcon />} label="Gastos" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 text-sm font-medium transition cursor-pointer disabled:opacity-40"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            width="16"
            height="16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M10 3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3M7 11l3-3-3-3M10 8H2" />
          </svg>
          {signingOut ? "Saliendo…" : "Cerrar sesión"}
        </button>
      </nav>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/6">
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-gold uppercase mb-0.5">
              Portal de finanzas
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menú"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-white/8 text-white/40 hover:text-white/80 hover:border-white/20 hover:bg-white/5 transition cursor-pointer"
            >
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                width="15"
                height="15"
              >
                <path d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm0 5A.75.75 0 011.75 7h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 7.75zM1.75 12a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H1.75z" />
              </svg>
            </button>
            {/* Nuevo gasto — desktop only */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light active:scale-[.98] text-canvas text-sm font-bold tracking-wide transition cursor-pointer"
            >
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                width="14"
                height="14"
              >
                <path d="M8 1.5a.75.75 0 01.75.75V7.5h5.25a.75.75 0 010 1.5H8.75v5.25a.75.75 0 01-1.5 0V9H2a.75.75 0 010-1.5h5.25V2.25A.75.75 0 018 1.5z" />
              </svg>
              Nuevo gasto
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 px-6 md:px-10 py-8 flex flex-col gap-8">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Este mes"
              valueNode={<TodayTotal data={monthData} loading={monthLoading} />}
              accent
            />
            <StatCard label="Este mes" value="—" mono />
            <StatCard label="Categorías" value="—" mono />
          </div>

          {/* Today's expenses quick view */}
          <MonthExpenses
            data={monthData}
            loading={monthLoading}
            error={monthError}
          />
        </main>
      </div>

      {/* ── Mobile nav ── */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />

      {/* ── Mobile FAB ── */}
      <MobileFAB onNewExpense={() => setDrawerOpen(true)} />

      {/* ── Drawer ── */}
      <CreateExpenseDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleCreated}
      />

      {/* ── Success toast ── */}
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
    </div>
  );
}

/* ── Sub-components ── */

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer w-full text-left ${
        active
          ? "bg-white/8 text-white"
          : "text-white/30 hover:text-white/70 hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

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

/** Live total of today's expenses */
function TodayTotal({ data, loading }: { data: Expense[]; loading: boolean }) {
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

function DashboardIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
      <path d="M1 1.75C1 1.336 1.336 1 1.75 1h5.5c.414 0 .75.336.75.75v5.5A.75.75 0 017.25 8h-5.5A.75.75 0 011 7.25v-5.5zm8 0c0-.414.336-.75.75-.75h4.5c.414 0 .75.336.75.75v2.5a.75.75 0 01-.75.75h-4.5A.75.75 0 019 4.25v-2.5zm-8 7c0-.414.336-.75.75-.75h4.5c.414 0 .75.336.75.75v4.5a.75.75 0 01-.75.75h-4.5A.75.75 0 011 13.25v-4.5zm8-2c0-.414.336-.75.75-.75h4.5c.414 0 .75.336.75.75v5.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-5.5z" />
    </svg>
  );
}

function ExpensesIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
      <path d="M1 3.75C1 2.784 1.784 2 2.75 2h10.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0113.25 14H2.75A1.75 1.75 0 011 12.25v-8.5zM2.75 3.5a.25.25 0 00-.25.25v.764l5.5 3.75 5.5-3.75V3.75a.25.25 0 00-.25-.25H2.75zm10.5 2.614l-4.874 3.322a1.75 1.75 0 01-1.952 0L2.5 6.114v6.136c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V6.114z" />
    </svg>
  );
}
