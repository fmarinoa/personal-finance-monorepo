import { DateTime } from "luxon";
import type { Expense } from "@packages/core";

import type { Period } from "@/hooks/usePeriod";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/types/expense";

import { PeriodSelector } from "./PeriodSelector";

interface TableProps {
  totalCount: number;
  data: Expense[];
  loading: boolean;
  error: string | null;
  periodLabel: string;
  period: Period;
  setPeriod: (period: Period) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Table({
  totalCount,
  data,
  loading,
  error,
  periodLabel,
  period,
  setPeriod,
  page,
  totalPages,
  onPageChange,
}: TableProps) {
  return (
    <section className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
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
        <PeriodSelector period={period} onPeriodChange={setPeriod} />
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-white/4 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/6 border border-red-500/15 text-red-400/70 text-xs">
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            width="13"
            height="13"
            className="shrink-0"
          >
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6.5a.875.875 0 110-1.75.875.875 0 010 1.75z" />
          </svg>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/6 flex items-center justify-center mb-3">
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
          </div>
          <p className="text-white/25 text-xs">
            Sin gastos registrados en este período
          </p>
        </div>
      )}

      {/* Expense rows */}
      {!loading && !error && data.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {data.map((expense, i) => (
            <ExpenseRow key={expense.id} expense={expense} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition"
          >
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
            Anterior
          </button>

          <span className="text-[10px] font-mono text-white/25 tracking-widest">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition"
          >
            Siguiente
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
          </button>
        </div>
      )}
    </section>
  );
}

/* ── Single row ── */
function ExpenseRow({ expense, index }: { expense: Expense; index: number }) {
  const time = DateTime.fromMillis(expense.paymentDate).toFormat("dd LLL");

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all duration-150"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Category icon badge */}
      <div className="w-8 h-8 rounded-lg bg-white/6 flex items-center justify-center shrink-0 text-sm">
        {CATEGORY_ICONS[expense.category]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85 truncate leading-snug">
          {expense.description}
        </p>
        <p className="text-[11px] text-white/30 truncate mt-0.5">
          {CATEGORY_LABELS[expense.category]}
          <span className="mx-1.5 opacity-40">·</span>
          {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
          <span className="mx-1.5 opacity-40">·</span>
          {time}
        </p>
      </div>

      {/* Amount */}
      <span className="font-mono text-sm font-semibold text-white/80 group-hover:text-gold transition-colors shrink-0">
        S/ {expense.amount.toFixed(2)}
      </span>
    </div>
  );
}
