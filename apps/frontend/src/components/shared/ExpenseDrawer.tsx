import {
  DeleteReason,
  type Expense,
  ExpenseCategory,
  PaymentMethod,
} from "@packages/core";
import { DateTime } from "luxon";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCreateExpense } from "@/hooks/expenses/useCreateExpense";
import { useDeleteExpense } from "@/hooks/expenses/useDeleteExpense";
import { useUpdateExpense } from "@/hooks/expenses/useUpdateExpense";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  DELETE_REASON_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/types/expense";

interface ExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** When provided, the drawer operates in edit mode */
  expense?: Expense;
}

const EMPTY = {
  amount: "",
  description: "",
  category: "" as ExpenseCategory | "",
  paymentMethod: "" as PaymentMethod | "",
  paymentDate: DateTime.local().toISODate()!,
};

export function ExpenseDrawer({
  open,
  onClose,
  onCreated,
  expense,
}: ExpenseDrawerProps) {
  const isEdit = !!expense;

  const [form, setForm] = useState({ ...EMPTY });
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState<DeleteReason | "">("");

  const handleSuccess = () => {
    onCreated();
    onClose();
  };
  const {
    submit: submitCreate,
    loading: creating,
    error: createError,
  } = useCreateExpense(handleSuccess);
  const {
    submit: submitUpdate,
    loading: updating,
    error: updateError,
  } = useUpdateExpense(handleSuccess);
  const {
    submit: submitDelete,
    loading: deleting,
    error: deleteError,
  } = useDeleteExpense(handleSuccess);

  const loading = creating || updating || deleting;
  const submitError = createError ?? updateError ?? deleteError;
  const error = formError ?? submitError;

  // Reset form when drawer opens or expense changes (setState during render — avoids useEffect lint)
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevExpenseId, setPrevExpenseId] = useState(expense?.id);
  if (open !== prevOpen || expense?.id !== prevExpenseId) {
    setPrevOpen(open);
    setPrevExpenseId(expense?.id);
    setFormError(null);
    setConfirmDelete(false);
    setDeleteReason("");
    setForm(
      expense
        ? {
            amount: expense.amount.toString(),
            description: expense.description,
            category: expense.category,
            paymentMethod: expense.paymentMethod,
            paymentDate: DateTime.fromMillis(expense.paymentDate).toISODate()!,
          }
        : { ...EMPTY },
    );
  }

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  }

  function handleClose() {
    if (loading) return;
    setConfirmDelete(false);
    setDeleteReason("");
    setFormError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.paymentMethod) {
      return setFormError("Selecciona categoría y método de pago.");
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      return setFormError("Ingresa un monto válido mayor a 0.");
    }
    const paymentDate = DateTime.fromISO(form.paymentDate, { zone: "local" })
      .startOf("day")
      .toUTC()
      .toMillis();
    const payload = {
      amount,
      description: form.description.trim(),
      category: form.category as ExpenseCategory,
      paymentMethod: form.paymentMethod as PaymentMethod,
      paymentDate,
    };
    if (isEdit) {
      await submitUpdate(expense.id, payload);
    } else {
      await submitCreate(payload);
    }
  }

  async function handleDelete() {
    if (!expense || !deleteReason) {
      setFormError("Selecciona una razón para eliminar el gasto.");
      return;
    }
    await submitDelete(expense.id, deleteReason);
    setConfirmDelete(false);
  }

  const canSubmit =
    form.amount &&
    form.description.trim() &&
    form.category &&
    form.paymentMethod &&
    form.paymentDate;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[480px] flex flex-col bg-surface border-l border-white/6 shadow-2xl gap-0 p-0"
      >
        <SheetTitle className="sr-only">
          {isEdit ? "Editar gasto" : "Agregar gasto"}
        </SheetTitle>

        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-white/6">
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-gold uppercase mb-1">
              {isEdit ? "Editar registro" : "Nuevo registro"}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {isEdit ? "Editar gasto" : "Agregar gasto"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={loading}
            className="mt-1 w-8 h-8 rounded-lg text-white/30 hover:text-white hover:bg-white/8"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </Button>
        </div>

        {/* Body: form OR delete confirmation */}
        {confirmDelete ? (
          <div className="flex-1 flex flex-col px-8 py-6 gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  width="18"
                  height="18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-400"
                >
                  <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">
                  ¿Por qué eliminas este gasto?
                </p>
                <p className="text-white/40 text-xs mt-0.5">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {(
                Object.keys(DeleteReason) as Array<keyof typeof DeleteReason>
              ).map((key) => {
                const value = DeleteReason[key];
                const active = deleteReason === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setDeleteReason(value);
                      setFormError(null);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition cursor-pointer text-left ${
                      active
                        ? "border-red-500/40 bg-red-500/10 text-red-300"
                        : "border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-red-400" : "bg-white/20"}`}
                    />
                    {DELETE_REASON_LABELS[value]}
                  </button>
                );
              })}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        ) : (
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
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 h-auto bg-white/4 border-white/8 rounded-xl text-white text-xl font-mono font-semibold placeholder-white/20 focus-visible:border-gold/60 focus-visible:ring-gold/12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label>Descripción</Label>
              <Input
                type="text"
                placeholder="ej. Almuerzo en el centro"
                maxLength={120}
                required
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full px-4 py-3 h-auto bg-white/4 border-white/8 rounded-xl text-white placeholder-white/20 text-sm focus-visible:border-gold/60 focus-visible:ring-gold/12"
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
              <PopoverRoot>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/4 text-sm font-medium text-white/70 transition cursor-pointer w-full text-left hover:border-white/20 hover:text-white/90 data-[state=open]:border-gold/60 data-[state=open]:bg-gold/8 data-[state=open]:text-white"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      width="14"
                      height="14"
                      className="shrink-0 text-white/30"
                    >
                      <path d="M4.75 0a.75.75 0 01.75.75V2h5V.75a.75.75 0 011.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0113.25 16H2.75A1.75 1.75 0 011 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 014.75 0zm0 3.5h-2a.25.25 0 00-.25.25V6h10.5V3.75a.25.25 0 00-.25-.25h-2V4.25a.75.75 0 01-1.5 0V3.5h-5V4.25a.75.75 0 01-1.5 0V3.5zM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V7.5H2.5z" />
                    </svg>
                    <span className="flex-1">
                      {DateTime.fromISO(form.paymentDate)
                        .setLocale("es")
                        .toLocaleString({
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                    </span>
                    <svg
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      width="12"
                      height="12"
                      className="shrink-0 text-white/30"
                    >
                      <path d="M12.78 5.22a.749.749 0 010 1.06l-4.25 4.25a.749.749 0 01-1.06 0L3.22 6.28a.749.749 0 111.06-1.06L8 8.939l3.72-3.719a.749.749 0 011.06 0z" />
                    </svg>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-auto dark">
                  <Calendar
                    mode="single"
                    selected={new Date(form.paymentDate + "T12:00:00")}
                    onSelect={(d) => {
                      if (d) {
                        set("paymentDate", DateTime.fromJSDate(d).toISODate()!);
                      }
                    }}
                    className="text-foreground"
                  />
                </PopoverContent>
              </PopoverRoot>
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
        )}

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/6 flex gap-3">
          {confirmDelete ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                className="flex-1 py-3 h-auto rounded-xl border-white/10 text-white/50 hover:border-white/20 hover:text-white/80 bg-transparent hover:bg-transparent"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={loading || !deleteReason}
                className="flex-[2] flex items-center justify-center gap-2 py-3 h-auto rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-sm font-bold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Eliminando…" : "Confirmar eliminación"}
              </Button>
            </>
          ) : (
            <>
              {isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setConfirmDelete(true)}
                  disabled={loading}
                  className="w-10 h-10 rounded-xl border-red-500/20 text-red-400/60 hover:border-red-500/40 hover:text-red-400 bg-transparent hover:bg-transparent shrink-0"
                  title="Eliminar gasto"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    width="14"
                    height="14"
                  >
                    <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.41 15h5.178a1.75 1.75 0 001.746-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225H5.41a.25.25 0 01-.249-.225l-.66-6.6z" />
                  </svg>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-3 h-auto rounded-xl border-white/10 text-white/50 hover:border-white/20 hover:text-white/80 bg-transparent hover:bg-transparent"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !canSubmit}
                onClick={handleSubmit}
                className="flex-[2] flex items-center justify-center gap-2 py-3 h-auto rounded-xl bg-gold hover:bg-gold-light text-canvas text-sm font-bold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
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
                ) : isEdit ? (
                  "Guardar cambios"
                ) : (
                  "Registrar gasto"
                )}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
