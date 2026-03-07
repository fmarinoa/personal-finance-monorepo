import { PeriodSelector } from "@/components/shared/PeriodSelector";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Period } from "@/utils/getDateRange";

// Hoisted static JSX — evaluated once at module load, never re-created on render
const errorIcon = (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    width="13"
    height="13"
    className="shrink-0"
  >
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6.5a.875.875 0 110-1.75.875.875 0 010 1.75z" />
  </svg>
);

const emptyIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    width="22"
    height="22"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    className="text-white/15"
  >
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const loadingSkeletons = (
  <div className="flex flex-col gap-2">
    {[1, 2, 3].map((i) => (
      <Skeleton
        key={i}
        className="h-14 rounded-xl bg-white/4"
        style={{ animationDelay: `${i * 80}ms` }}
      />
    ))}
  </div>
);

const chevronLeft = (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    width="10"
    height="10"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7.5 9L4.5 6l3-3" />
  </svg>
);

const chevronRight = (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    width="10"
    height="10"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.5 3l3 3-3 3" />
  </svg>
);

interface TransactionListProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyMessage: string;
  periodLabel: string;
  totalCount: number;
  period: Period;
  onPeriodChange: (period: Period) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  children: React.ReactNode;
}

export function TransactionList({
  loading,
  error,
  isEmpty,
  emptyMessage,
  periodLabel,
  totalCount,
  period,
  onPeriodChange,
  page,
  totalPages,
  onPageChange,
  children,
}: TransactionListProps) {
  const showPagination =
    !loading && error === null && !isEmpty && totalPages > 1;

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono tracking-[0.2em] text-white/30 uppercase">
            {periodLabel}
          </span>
          {!loading && (
            <span className="px-1.5 py-0.5 rounded-md bg-white/6 text-[10px] font-mono text-white/40">
              {totalCount}
            </span>
          )}
        </div>
        <PeriodSelector period={period} onPeriodChange={onPeriodChange} />
      </div>

      {/* Body — one branch only */}
      {loading ? (
        loadingSkeletons
      ) : error !== null ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/6 border border-red-500/15 text-red-400/70 text-xs">
          {errorIcon}
          {error}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/6 flex items-center justify-center mb-3">
            {emptyIcon}
          </div>
          <p className="text-white/25 text-xs">{emptyMessage}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">{children}</div>
      )}

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-lg text-xs font-mono text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-20"
          >
            {chevronLeft}
            Anterior
          </Button>

          <span className="text-[10px] font-mono text-white/25 tracking-widest">
            {page} / {totalPages}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-lg text-xs font-mono text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-20"
          >
            Siguiente
            {chevronRight}
          </Button>
        </div>
      )}
    </section>
  );
}
