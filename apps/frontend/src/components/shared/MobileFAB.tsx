import { useState } from "react";

import { Button } from "@/components/ui/button";

interface MobileFABProps {
  onNewExpense: () => void;
  onNewIncome?: () => void;
}

export function MobileFAB({ onNewExpense, onNewIncome }: MobileFABProps) {
  return (
    <div className="fixed bottom-6 right-5 z-30 md:hidden">
      <FABActions onNewExpense={onNewExpense} onNewIncome={onNewIncome} />
    </div>
  );
}

function FABActions({
  onNewExpense,
  onNewIncome,
}: {
  onNewExpense: () => void;
  onNewIncome?: () => void;
}) {
  const [open, setOpen] = useState(false);

  function handleExpense() {
    setOpen(false);
    onNewExpense();
  }

  function handleIncome() {
    setOpen(false);
    onNewIncome?.();
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
      )}

      {/* Action items — absolutely positioned above the main FAB, no layout footprint */}
      <div
        className={`absolute bottom-full right-0 mb-3 flex flex-col items-end gap-2.5 transition-all duration-200 origin-bottom ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Ingreso */}
        <FABOption
          label="Ingreso"
          delay="delay-[40ms]"
          open={open}
          color="bg-income hover:bg-emerald-400"
          onClick={handleIncome}
          icon={
            <svg viewBox="0 0 16 16" fill="currentColor" width="15" height="15">
              <path d="M8 1.5a.75.75 0 01.75.75v9.19l2.72-2.72a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 111.06-1.06l2.72 2.72V2.25A.75.75 0 018 1.5z" />
            </svg>
          }
        />

        {/* Egreso */}
        <FABOption
          label="Gasto"
          delay="delay-[0ms]"
          open={open}
          color="bg-expense hover:bg-rose-400 active:scale-[.98] text-white"
          onClick={handleExpense}
          icon={
            <svg viewBox="0 0 16 16" fill="currentColor" width="15" height="15">
              <path d="M8 14.5a.75.75 0 01-.75-.75V4.56L4.53 7.28a.75.75 0 01-1.06-1.06l4-4a.75.75 0 011.06 0l4 4a.75.75 0 01-1.06 1.06L8.75 4.56v9.19A.75.75 0 018 14.5z" />
            </svg>
          }
        />
      </div>

      {/* Main FAB */}
      <Button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar acciones" : "Nueva transacción"}
        className="w-14 h-14 rounded-2xl bg-gold hover:bg-gold-light active:scale-95 text-canvas shadow-lg shadow-gold/20 transition-all duration-200"
      >
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          width="18"
          height="18"
          className={`transition-transform duration-200 ${open ? "rotate-45" : "rotate-0"}`}
        >
          <path d="M8 1.5a.75.75 0 01.75.75V7.5h5.25a.75.75 0 010 1.5H8.75v5.25a.75.75 0 01-1.5 0V9H2a.75.75 0 010-1.5h5.25V2.25A.75.75 0 018 1.5z" />
        </svg>
      </Button>
    </>
  );
}

function FABOption({
  label,
  icon,
  color,
  textColor = "text-white",
  open,
  delay,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  textColor?: string;
  open: boolean;
  delay: string;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      className={`flex items-center justify-start gap-2.5 pl-3.5 pr-4 h-10 rounded-xl ${color} ${textColor} text-sm font-semibold shadow-lg transition-all duration-200 ${delay} ${
        open
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-3 scale-95"
      }`}
    >
      <span className="shrink-0 flex items-center">{icon}</span>
      <span>{label}</span>
    </Button>
  );
}
