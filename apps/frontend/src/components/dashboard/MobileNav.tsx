interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}

const NAV_ITEMS = [
  { label: "Dashboard", icon: <DashboardIcon />, active: true },
  { label: "Gastos", icon: <ExpensesIcon />, active: false },
];

export function MobileNav({
  open,
  onClose,
  onSignOut,
  signingOut,
}: MobileNavProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <div
        className={`fixed left-0 top-0 h-full z-50 w-72 flex flex-col bg-surface border-r border-white/6 transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-7 pb-6 border-b border-white/6">
          <div className="flex items-center gap-2.5">
            <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
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
            <span className="font-bold text-sm tracking-tight text-white">
              FinanceOS
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition cursor-pointer"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>

        {/* Section label */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-[9px] font-mono tracking-[0.2em] text-white/25 uppercase">
            Menú
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition cursor-pointer w-full text-left ${
                item.active
                  ? "bg-white/8 text-white"
                  : "text-white/35 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <span className={item.active ? "text-gold" : ""}>
                {item.icon}
              </span>
              {item.label}
              {item.active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
              )}
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="px-3 pb-8 pt-4 border-t border-white/6">
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            disabled={signingOut}
            className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm font-medium text-white/35 hover:text-red-400/80 hover:bg-red-500/6 transition cursor-pointer disabled:opacity-40"
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
        </div>
      </div>
    </>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" width="15" height="15">
      <path d="M1 1.75C1 1.336 1.336 1 1.75 1h5.5c.414 0 .75.336.75.75v5.5A.75.75 0 017.25 8h-5.5A.75.75 0 011 7.25v-5.5zm8 0c0-.414.336-.75.75-.75h4.5c.414 0 .75.336.75.75v2.5a.75.75 0 01-.75.75h-4.5A.75.75 0 019 4.25v-2.5zm-8 7c0-.414.336-.75.75-.75h4.5c.414 0 .75.336.75.75v4.5a.75.75 0 01-.75.75h-4.5A.75.75 0 011 13.25v-4.5zm8-2c0-.414.336-.75.75-.75h4.5c.414 0 .75.336.75.75v5.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-5.5z" />
    </svg>
  );
}

function ExpensesIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" width="15" height="15">
      <path d="M1 3.75C1 2.784 1.784 2 2.75 2h10.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0113.25 14H2.75A1.75 1.75 0 011 12.25v-8.5zM2.75 3.5a.25.25 0 00-.25.25v.764l5.5 3.75 5.5-3.75V3.75a.25.25 0 00-.25-.25H2.75zm10.5 2.614l-4.874 3.322a1.75 1.75 0 01-1.952 0L2.5 6.114v6.136c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V6.114z" />
    </svg>
  );
}
