import { useState } from "react";
import { signOut } from "aws-amplify/auth";
import { CreateExpenseDrawer } from "./CreateExpenseDrawer";

interface DashboardProps {
  onSignOut: () => void;
}

export function Dashboard({ onSignOut }: DashboardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function handleCreated() {
    setSuccessCount((n) => n + 1);
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
      className="flex min-h-screen bg-[#0a0a0a] text-white"
      style={{ fontFamily: "'Plus Jakarta Sans Variable', sans-serif" }}
    >
      {/* ── Sidebar ── */}
      <nav className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-white/6 px-4 py-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-10">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#d4a853" />
            <path
              d="M10 28l6-8 5 4 5-7 4 6"
              stroke="#0a0a0a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="28" cy="13" r="3" fill="#0a0a0a" />
          </svg>
          <span className="font-bold text-base tracking-tight">FinanceOS</span>
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
        <header className="flex items-center justify-between px-8 md:px-10 py-6 border-b border-white/6">
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-[#d4a853] uppercase mb-0.5">
              Portal de finanzas
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4a853] hover:bg-[#e2b96a] active:scale-[.98] text-[#0a0a0a] text-sm font-bold tracking-wide transition cursor-pointer"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M8 1.5a.75.75 0 01.75.75V7.5h5.25a.75.75 0 010 1.5H8.75v5.25a.75.75 0 01-1.5 0V9H2a.75.75 0 010-1.5h5.25V2.25A.75.75 0 018 1.5z" />
            </svg>
            Nuevo gasto
          </button>
        </header>

        {/* Body */}
        <main className="flex-1 px-8 md:px-10 py-10">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <StatCard
              label="Gastos registrados"
              value={successCount.toString()}
              mono
              accent
            />
            <StatCard label="Este mes" value="—" mono />
            <StatCard label="Categorías" value="—" mono />
          </div>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                width="28"
                height="28"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-white/20"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-white/40 text-sm font-medium mb-1">
              Sin gastos registrados
            </p>
            <p className="text-white/20 text-xs max-w-xs">
              Registra tu primer gasto usando el botón{" "}
              <span className="text-[#d4a853]/60">Nuevo gasto</span>
            </p>
          </div>
        </main>
      </div>

      {/* ── Drawer ── */}
      <CreateExpenseDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleCreated}
      />

      {/* ── Success toast ── */}
      <div
        role="status"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#141414] border border-[#d4a853]/30 text-sm font-medium text-white shadow-2xl transition-all duration-300 ${
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
  mono = false,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-5 rounded-2xl bg-white/3 border border-white/6">
      <span className="text-[10px] font-mono tracking-[0.15em] text-white/30 uppercase">
        {label}
      </span>
      <span
        className={`text-3xl font-bold tracking-tight ${
          accent ? "text-[#d4a853]" : "text-white"
        } ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
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
