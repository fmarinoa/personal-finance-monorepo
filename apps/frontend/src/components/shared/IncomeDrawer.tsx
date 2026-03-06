import { type Income, IncomeCategory, IncomeStatus } from "@packages/core";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCreateIncome } from "@/hooks/incomes/useCreateIncome";
import { useUpdateIncome } from "@/hooks/incomes/useUpdateIncome";
import {
  INCOME_CATEGORY_ICONS,
  INCOME_CATEGORY_LABELS,
  INCOME_STATUS_LABELS,
} from "@/types/income";

interface IncomeDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** When provided, the drawer operates in edit mode */
  income?: Income;
}

const EMPTY = {
  amount: "",
  description: "",
  category: "" as IncomeCategory | "",
  status: IncomeStatus.RECEIVED as IncomeStatus,
  receivedDate: DateTime.local().toISODate()!,
  projectedDate: DateTime.local().toISODate()!,
};

export function IncomeDrawer({
  open,
  onClose,
  onCreated,
  income,
}: IncomeDrawerProps) {
  const isEdit = !!income;

  const [form, setForm] = useState({ ...EMPTY });
  const [formError, setFormError] = useState<string | null>(null);
  const handleSuccess = () => {
    onCreated();
    setFormError(null);
    onClose();
  };

  const {
    submit: submitCreate,
    loading: creating,
    error: createError,
  } = useCreateIncome(handleSuccess);

  const {
    submit: submitUpdate,
    loading: updating,
    error: updateError,
  } = useUpdateIncome(handleSuccess);

  const loading = creating || updating;
  const error = formError ?? createError ?? updateError;

  // Reset form when drawer opens or income changes (setState during render — no effect needed)
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevIncomeId, setPrevIncomeId] = useState(income?.id);
  if (open !== prevOpen || income?.id !== prevIncomeId) {
    setPrevOpen(open);
    setPrevIncomeId(income?.id);
    setFormError(null);
    setForm(
      income
        ? {
            amount: income.amount.toString(),
            description: income.description,
            category: income.category,
            status: income.status as IncomeStatus,
            receivedDate: income.receivedDate
              ? DateTime.fromMillis(income.receivedDate).toISODate()!
              : DateTime.local().toISODate()!,
            projectedDate: income.projectedDate
              ? DateTime.fromMillis(income.projectedDate).toISODate()!
              : DateTime.local().toISODate()!,
          }
        : { ...EMPTY },
    );
  }

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  }

  const handleClose = () => {
    if (loading) return;
    setFormError(null);
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category) return setFormError("Selecciona una categoría.");
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0)
      return setFormError("Ingresa un monto válido mayor a 0.");

    const payloadBase = {
      amount,
      description: form.description.trim(),
      category: form.category as IncomeCategory,
    };

    if (isEdit && income) {
      // Update path
      if (form.status === IncomeStatus.PROJECTED) {
        await submitUpdate(income.id, {
          ...payloadBase,
          status: IncomeStatus.PROJECTED,
          projectedDate: DateTime.fromISO(form.projectedDate, { zone: "local" })
            .startOf("day")
            .toUTC()
            .toMillis(),
        });
      } else {
        await submitUpdate(income.id, {
          ...payloadBase,
          status: IncomeStatus.RECEIVED,
          receivedDate: DateTime.fromISO(form.receivedDate, { zone: "local" })
            .startOf("day")
            .toUTC()
            .toMillis(),
        });
      }
    } else {
      // Create path
      if (form.status === IncomeStatus.PROJECTED) {
        await submitCreate({
          ...payloadBase,
          status: IncomeStatus.PROJECTED,
          projectedDate: DateTime.fromISO(form.projectedDate, { zone: "local" })
            .startOf("day")
            .toUTC()
            .toMillis(),
        });
      } else {
        await submitCreate({
          ...payloadBase,
          status: IncomeStatus.RECEIVED,
          receivedDate: DateTime.fromISO(form.receivedDate, { zone: "local" })
            .startOf("day")
            .toUTC()
            .toMillis(),
        });
      }
    }
  }

  const canSubmit =
    form.amount && form.description.trim() && form.category && form.status;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[480px] flex flex-col bg-surface border-l border-white/6 shadow-2xl gap-0 p-0"
      >
        <SheetTitle className="sr-only">
          {isEdit ? "Editar ingreso" : "Agregar ingreso"}
        </SheetTitle>

        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-white/6">
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-gold uppercase mb-1">
              {isEdit ? "Editar registro" : "Nuevo registro"}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {isEdit ? "Editar ingreso" : "Agregar ingreso"}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6"
        >
          {/* Status toggle */}
          <div className="flex flex-col gap-2">
            <Label>Estado</Label>
            <ToggleGroup
              type="single"
              value={form.status}
              onValueChange={(v) => v && set("status", v as IncomeStatus)}
              className="flex gap-2 w-full"
            >
              {[IncomeStatus.RECEIVED, IncomeStatus.PROJECTED].map((s) => (
                <ToggleGroupItem
                  key={s}
                  value={s}
                  className="flex-1 py-2.5 h-auto rounded-xl border border-white/8 bg-white/3 text-white/40 hover:border-white/20 hover:text-white/70 text-sm font-medium data-[state=on]:border-gold/60 data-[state=on]:bg-gold/10 data-[state=on]:text-gold"
                >
                  {INCOME_STATUS_LABELS[s]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

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
              placeholder="ej. Pago quincena febrero"
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
              {Object.values(IncomeCategory).map((cat) => {
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
                      {INCOME_CATEGORY_ICONS[cat]}
                    </span>
                    <span>{INCOME_CATEGORY_LABELS[cat]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date — conditional on status */}
          <div className="flex flex-col gap-2">
            <Label>
              {form.status === IncomeStatus.RECEIVED
                ? "Fecha de recepción"
                : "Fecha proyectada"}
            </Label>
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
                    {DateTime.fromISO(
                      form.status === IncomeStatus.RECEIVED
                        ? form.receivedDate
                        : form.projectedDate,
                    )
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
                  selected={
                    new Date(
                      (form.status === IncomeStatus.RECEIVED
                        ? form.receivedDate
                        : form.projectedDate) + "T12:00:00",
                    )
                  }
                  onSelect={(d) => {
                    if (d) {
                      set(
                        form.status === IncomeStatus.RECEIVED
                          ? "receivedDate"
                          : "projectedDate",
                        DateTime.fromJSDate(d).toISODate()!,
                      );
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

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/6 flex gap-3">
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
              "Registrar ingreso"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
