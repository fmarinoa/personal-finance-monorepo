import { useState } from "react";
import { DateTime } from "luxon";
import { ExpenseCategory, PaymentMethod } from "@packages/core";

import { createExpense } from "@/lib/api";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  PAYMENT_METHOD_LABELS,
} from "@/types/expense";

interface CreateExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const EMPTY = {
  amount: "",
  description: "",
  category: "" as ExpenseCategory | "",
  paymentMethod: "" as PaymentMethod | "",
  paymentDate: DateTime.local().toISODate()!, // Fecha local del usuario
};

export function CreateExpenseDrawer({
  open,
  onClose,
  onCreated,
}: CreateExpenseDrawerProps) {
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function handleClose() {
    if (loading) return;
    setForm({ ...EMPTY });
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.paymentMethod) {
      return setError("Selecciona categoría y método de pago.");
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      return setError("Ingresa un monto válido mayor a 0.");
    }
    setError(null);
    setLoading(true);
    try {
      await createExpense({
        amount,
        description: form.description.trim(),
        category: form.category as ExpenseCategory,
        paymentMethod: form.paymentMethod as PaymentMethod,
        // Fecha en zona local del usuario → inicio del día en su zona → UTC timestamp
        paymentDate: DateTime.fromISO(form.paymentDate, { zone: "local" })
          .startOf("day")
          .toUTC()
          .toMillis(),
      });
      setForm({ ...EMPTY });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear el gasto");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    form.amount &&
    form.description.trim() &&
    form.category &&
    form.paymentMethod &&
    form.paymentDate;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-120 flex flex-col bg-surface border-l border-white/6 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-white/6">
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-gold uppercase mb-1">
              Nuevo registro
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Agregar gasto
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="mt-1 w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition cursor-pointer"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6"
        >
          {/* Amount */}
          <div className="flex flex-col gap-2">
            <Label>Monto</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-gold text-lg font-semibold pointer-events-none">
                S/
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/4 border border-white/8 rounded-xl text-white text-xl font-mono font-semibold placeholder-white/20 outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label>Descripción</Label>
            <input
              type="text"
              placeholder="ej. Almuerzo en el centro"
              maxLength={120}
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Category grid */}
          <div className="flex flex-col gap-2">
            <Label>Categoría</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(ExpenseCategory).map((cat) => {
                const active = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set("category", cat)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      active
                        ? "border-gold/60 bg-gold/10 text-gold"
                        : "border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    <span className="text-lg leading-none">
                      {CATEGORY_ICONS[cat]}
                    </span>
                    <span>{CATEGORY_LABELS[cat]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment method */}
          <div className="flex flex-col gap-2">
            <Label>Método de pago</Label>
            <div className="flex flex-col gap-1.5">
              {Object.values(PaymentMethod).map((pm) => {
                const active = form.paymentMethod === pm;
                return (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => set("paymentMethod", pm)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition cursor-pointer ${
                      active
                        ? "border-gold/60 bg-gold/10 text-gold"
                        : "border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-gold" : "bg-white/20"}`}
                    />
                    {PAYMENT_METHOD_LABELS[pm]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <Label>Fecha del gasto</Label>
            <input
              type="date"
              required
              value={form.paymentDate}
              onChange={(e) => set("paymentDate", e.target.value)}
              className={`${inputCls} scheme-dark`}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                width="14"
                height="14"
                className="shrink-0 mt-0.5"
              >
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6.5a.875.875 0 110-1.75.875.875 0 010 1.75z" />
              </svg>
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/6 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:border-white/20 hover:text-white/80 transition cursor-pointer disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            form="create-expense-form"
            type="submit"
            disabled={loading || !canSubmit}
            onClick={handleSubmit}
            className="flex-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-gold hover:bg-gold-light active:scale-[.99] text-canvas text-sm font-bold tracking-wide transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  width="15"
                  height="15"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeOpacity="0.3"
                  />
                  <path
                    d="M12 2a10 10 0 0110 10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Guardando…
              </>
            ) : (
              "Registrar gasto"
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Shared helpers ── */
const inputCls =
  "w-full px-4 py-3 bg-white/4 border border-white/8 rounded-xl text-white placeholder-white/20 text-sm outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/12";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-mono tracking-[0.15em] text-white/40 uppercase">
      {children}
    </span>
  );
}
