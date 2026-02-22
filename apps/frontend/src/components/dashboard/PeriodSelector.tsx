import type { Period } from "@/hooks/usePeriod";
import { PERIOD_OPTIONS } from "@/hooks/usePeriod";

interface PeriodSelectorProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      width="11"
      height="11"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <rect x="1" y="2" width="10" height="9" rx="1.5" />
      <path d="M1 5h10M4 1v2M8 1v2" />
    </svg>
  );
}

export function PeriodSelector({
  period,
  onPeriodChange,
}: PeriodSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Seleccionar periodo"
      className="flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.04] border border-white/8"
    >
      <span className="pl-1.5 pr-1 text-white/20 hidden sm:flex">
        <CalendarIcon />
      </span>
      {PERIOD_OPTIONS.map((option) => {
        const isActive = period === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onPeriodChange(option.id)}
            aria-pressed={isActive}
            className={`
              px-2.5 py-1.5 rounded-lg cursor-pointer whitespace-nowrap
              text-[11px] font-mono tracking-wider
              transition-all duration-150
              ${
                isActive
                  ? "bg-gold/[0.12] text-gold ring-1 ring-inset ring-gold/25 shadow-[0_1px_4px_rgba(212,168,83,0.08)]"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.05]"
              }
            `}
          >
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
