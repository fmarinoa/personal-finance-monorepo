import { useState } from "react";
import { signOut } from "aws-amplify/auth";

import { APP_CONFIG } from "@/config/app";

export type AppPage = "dashboard" | "expenses";

function PoweredBy() {
  return (
    <p className="px-3 pt-4 text-[10px] font-mono text-white/20 tracking-wide">
      Powered by{" "}
      <a
        href={APP_CONFIG.AUTHOR.WEBSITE}
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/35 hover:text-white/60 transition-colors underline"
      >
        {APP_CONFIG.AUTHOR.NAME}
      </a>
    </p>
  );
}

function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className="shrink-0"
    >
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
  );
}

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
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

function SignOutButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 text-sm font-medium transition cursor-pointer disabled:opacity-40 w-full"
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
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </button>
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

/* ── Nav items shared between sidebar and mobile panel ── */
const NAV_ITEMS: { label: string; icon: React.ReactNode; page: AppPage }[] = [
  { label: "Dashboard", icon: <DashboardIcon />, page: "dashboard" },
  { label: "Gastos", icon: <ExpensesIcon />, page: "expenses" },
];

interface AppLayoutProps {
  username: string | null;
  onSignOut: () => void;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  title: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppLayout({
  username,
  onSignOut,
  activePage,
  onNavigate,
  title,
  headerActions,
  children,
}: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
      {/* ── Sidebar (desktop) ── */}
      <nav className="hidden md:flex flex-col w-55 shrink-0 border-r border-white/6 px-4 py-8">
        <div className="flex items-center gap-2.5 mb-10">
          <AppLogo />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono tracking-[0.15em] text-gold uppercase leading-none mb-0.5">
              {APP_CONFIG.NAME}
            </span>
            <span className="text-sm font-semibold text-white truncate">
              Hola, {username ?? "usuario"}👋
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={item.page === activePage}
              onClick={() => onNavigate(item.page)}
            />
          ))}
        </div>

        <div className="flex-1" />

        <SignOutButton onClick={handleSignOut} loading={signingOut} />
        <PoweredBy />
      </nav>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/6">
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-gold uppercase mb-0.5">
              Portal de finanzas
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
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
            {headerActions}
          </div>
        </header>

        <main className="flex-1 px-6 md:px-10 py-8 flex flex-col gap-8">
          {children}
        </main>
      </div>

      {/* ── Mobile nav panel ── */}
      {/* Backdrop */}
      <div
        onClick={() => setMobileNavOpen(false)}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileNavOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Panel */}
      <div
        className={`fixed left-0 top-0 h-full z-50 w-72 flex flex-col bg-surface border-r border-white/6 transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] md:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-7 pb-6 border-b border-white/6">
          <AppLogo size={30} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono tracking-[0.15em] text-gold uppercase leading-none">
                {APP_CONFIG.NAME}
              </span>
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              Hola, {username ?? "usuario"} 👋
            </span>
          </div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition cursor-pointer"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-5 pb-2">
          <span className="text-[9px] font-mono tracking-[0.2em] text-white/25 uppercase">
            Menú
          </span>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.page === activePage;
            return (
              <button
                key={item.label}
                onClick={() => {
                  onNavigate(item.page);
                  setMobileNavOpen(false);
                }}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition cursor-pointer w-full text-left ${
                  isActive
                    ? "bg-white/8 text-white"
                    : "text-white/35 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <span className={isActive ? "text-gold" : ""}>{item.icon}</span>
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="px-3 pb-8 pt-4 border-t border-white/6">
          <SignOutButton
            onClick={() => {
              setMobileNavOpen(false);
              handleSignOut();
            }}
            loading={signingOut}
          />
          <PoweredBy />
        </div>
      </div>
    </div>
  );
}
