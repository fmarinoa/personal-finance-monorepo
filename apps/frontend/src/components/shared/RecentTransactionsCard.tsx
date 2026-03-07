// Hoisted static JSX
const loadingBars = (
  <div className="flex flex-col gap-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-8 rounded-lg bg-white/6 animate-pulse" />
    ))}
  </div>
);

interface RecentTransactionsCardProps {
  title: string;
  loading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  onViewMore: () => void;
  viewMoreClassName?: string;
  children: React.ReactNode;
}

export function RecentTransactionsCard({
  title,
  loading,
  isEmpty,
  emptyMessage,
  onViewMore,
  viewMoreClassName = "hover:text-gold",
  children,
}: RecentTransactionsCardProps) {
  return (
    <div className="flex flex-col gap-3 px-5 py-5 rounded-2xl bg-white/3 border border-white/6">
      <span className="text-[10px] font-mono tracking-[0.15em] text-white/30 uppercase shrink-0">
        {title}
      </span>

      {loading ? (
        loadingBars
      ) : isEmpty ? (
        <p className="text-sm text-white/30 py-4 text-center">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">{children}</tbody>
          </table>
        </div>
      )}

      <button
        onClick={onViewMore}
        className={`mt-1 self-end text-xs font-mono text-white/30 ${viewMoreClassName} transition-colors cursor-pointer`}
      >
        Ver más →
      </button>
    </div>
  );
}
