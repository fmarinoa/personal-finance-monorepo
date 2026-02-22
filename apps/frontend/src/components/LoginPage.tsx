import { useState } from "react";
import { signIn, confirmSignIn } from "aws-amplify/auth";
import { APP_CONFIG } from "../config/app";

type Step = "login" | "new-password";

interface LoginPageProps {
  onSignIn: () => void;
}

/* ── Password requirement helpers (matches Cognito policy) ── */
const REQUIREMENTS = [
  {
    id: "len",
    label: "Mínimo 8 caracteres",
    test: (v: string) => v.length >= 8,
  },
  { id: "upper", label: "Una mayúscula", test: (v: string) => /[A-Z]/.test(v) },
  { id: "lower", label: "Una minúscula", test: (v: string) => /[a-z]/.test(v) },
  { id: "digit", label: "Un número", test: (v: string) => /[0-9]/.test(v) },
];

export function LoginPage({ onSignIn }: LoginPageProps) {
  const [step, setStep] = useState<Step>("login");
  const [leaving, setLeaving] = useState(false);

  /* login step */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* new-password step */
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Animate step transition */
  function transitionTo(next: Step) {
    setLeaving(true);
    setTimeout(() => {
      setStep(next);
      setLeaving(false);
      setError(null);
    }, 260);
  }

  /* ── Step 1: login ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });
      if (isSignedIn) {
        onSignIn();
      } else if (
        nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
      ) {
        transitionTo("new-password");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 2: set new password ── */
  const allMet = REQUIREMENTS.every((r) => r.test(newPassword));
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0;

  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!allMet) return setError("La contraseña no cumple los requisitos.");
    if (!passwordsMatch) return setError("Las contraseñas no coinciden.");
    setError(null);
    setLoading(true);
    try {
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: newPassword,
      });
      if (isSignedIn) onSignIn();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al configurar contraseña",
      );
    } finally {
      setLoading(false);
    }
  }

  /* shared transition class */
  const panelCls = `transition-all duration-260 ${
    leaving
      ? "opacity-0 translate-y-3 pointer-events-none"
      : "opacity-100 translate-y-0"
  }`;

  return (
    <div className="flex min-h-screen bg-canvas text-slate-200 font-sans">
      {/* ── Brand panel ── */}
      <aside className="relative hidden md:flex flex-col w-[44%] overflow-hidden p-12 bg-canvas border-r border-white/6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(212,168,83,.14) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)",
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="gold" />
              <path
                d="M10 28l6-8 5 4 5-7 4 6"
                stroke="canvas"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="28" cy="13" r="3" fill="canvas" />
            </svg>
            <span className="text-xl font-bold tracking-tight text-slate-100">
              {APP_CONFIG.NAME}
            </span>
          </div>

          <div className="mt-auto pb-12">
            <h1 className="text-4xl font-extrabold tracking-tight leading-snug text-white mb-3">
              Tu dinero,
              <br />
              bajo control.
            </h1>
            <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
              Portal de gestión personal de finanzas. Visualiza, analiza y toma
              mejores decisiones financieras.
            </p>
          </div>

          <div className="flex gap-8 pt-6 border-t border-white/6">
            <Stat value="100%" label="Privado" />
            <Stat value="AWS" label="Infraestructura" />
            <Stat value="24/7" label="Disponible" />
          </div>
        </div>
      </aside>

      {/* ── Form panel ── */}
      <main className="flex flex-1 items-center justify-center px-6 py-10 overflow-hidden">
        <div className="w-full max-w-sm">
          {/* Step dots */}
          <div className="flex items-center gap-2 mb-8">
            <StepDot active={step === "login"} done={step === "new-password"} />
            <div className="flex-1 h-px bg-white/8" />
            <StepDot active={step === "new-password"} done={false} />
          </div>

          {/* ── Login form ── */}
          {step === "login" && (
            <div className={panelCls}>
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1">
                  Bienvenido
                </h2>
                <p className="text-sm text-white/35">
                  Ingresa tus credenciales para acceder al portal
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                noValidate
                className="flex flex-col gap-5"
              >
                <fieldset
                  className="flex flex-col gap-5 border-0 p-0 m-0 disabled:opacity-60"
                  disabled={loading}
                >
                  <Field label="Correo electrónico">
                    <div className="relative flex items-center">
                      <EmailIcon />
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="usuario@ejemplo.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </Field>

                  <Field label="Contraseña">
                    <div className="relative flex items-center">
                      <LockIcon />
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputCls} pr-10`}
                      />
                      <EyeToggle
                        show={showPassword}
                        onToggle={() => setShowPassword((v) => !v)}
                      />
                    </div>
                  </Field>
                </fieldset>

                {error && <ErrorBanner message={error} />}

                <SubmitButton loading={loading} disabled={!email || !password}>
                  Iniciar sesión
                </SubmitButton>
              </form>

              <p className="mt-7 text-center text-xs text-slate-600">
                ¿No tienes cuenta? Contacta a tu administrador.
              </p>
            </div>
          )}

          {/* ── New password form ── */}
          {step === "new-password" && (
            <div className={panelCls}>
              <div className="mb-8">
                {/* Amber badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-4">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    width="12"
                    height="12"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Primer acceso
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 mb-1">
                  Configura tu contraseña
                </h2>
                <p className="text-sm text-slate-500">
                  Elige una contraseña segura para tu cuenta.
                </p>
              </div>

              <form
                onSubmit={handleNewPassword}
                noValidate
                className="flex flex-col gap-5"
              >
                <fieldset
                  className="flex flex-col gap-5 border-0 p-0 m-0 disabled:opacity-60"
                  disabled={loading}
                >
                  <Field label="Nueva contraseña">
                    <div className="relative flex items-center">
                      <LockIcon />
                      <input
                        type={showNew ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`${inputCls} pr-10`}
                      />
                      <EyeToggle
                        show={showNew}
                        onToggle={() => setShowNew((v) => !v)}
                      />
                    </div>

                    {/* Live requirements checklist */}
                    {newPassword.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-1.5">
                        {REQUIREMENTS.map((r) => {
                          const ok = r.test(newPassword);
                          return (
                            <li
                              key={r.id}
                              className={`flex items-center gap-2 text-xs transition-colors ${ok ? "text-emerald-400" : "text-slate-600"}`}
                            >
                              <span
                                className={`flex items-center justify-center w-4 h-4 rounded-full border transition-all ${ok ? "bg-emerald-500/15 border-emerald-500/40" : "border-slate-700"}`}
                              >
                                {ok && (
                                  <svg
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    width="8"
                                    height="8"
                                  >
                                    <path
                                      d="M2 6l3 3 5-5"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </span>
                              {r.label}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Field>

                  <Field label="Confirmar contraseña">
                    <div className="relative flex items-center">
                      <LockIcon />
                      <input
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`${inputCls} pr-10 ${
                          confirmPassword.length > 0
                            ? passwordsMatch
                              ? "border-emerald-600/60 focus:border-emerald-500 focus:ring-emerald-500/20"
                              : "border-red-600/60 focus:border-red-500 focus:ring-red-500/20"
                            : ""
                        }`}
                      />
                      <EyeToggle
                        show={showConfirm}
                        onToggle={() => setShowConfirm((v) => !v)}
                      />
                    </div>
                    {confirmPassword.length > 0 && !passwordsMatch && (
                      <p className="mt-1.5 text-xs text-red-400">
                        Las contraseñas no coinciden
                      </p>
                    )}
                  </Field>
                </fieldset>

                {error && <ErrorBanner message={error} />}

                <SubmitButton
                  loading={loading}
                  disabled={!allMet || !passwordsMatch}
                  amber
                >
                  Guardar contraseña
                </SubmitButton>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Design tokens ── */
const inputCls =
  "w-full py-3 pl-10 pr-4 bg-white/4 border border-white/8 rounded-xl text-white placeholder-white/20 text-sm outline-none transition focus:border-gold/60 focus:ring-3 focus:ring-gold/12";

/* ── Shared sub-components ── */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold tracking-wide text-white/40 uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function SubmitButton({
  children,
  loading,
  disabled,
  amber = false,
}: {
  children: React.ReactNode;
  loading: boolean;
  disabled: boolean;
  amber?: boolean;
}) {
  const color = amber
    ? "bg-gold hover:bg-gold-light focus-visible:ring-gold/30"
    : "bg-gold hover:bg-gold-light focus-visible:ring-gold/30";
  const textColor = "text-canvas";

  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl ${color} ${textColor} text-sm font-semibold tracking-wide transition-all active:scale-[.99] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-3`}
    >
      {loading ? (
        <>
          <Spinner />
          {typeof children === "string"
            ? children.replace(/^.*/, "Procesando…")
            : "Procesando…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/25 text-red-400 text-xs leading-relaxed"
    >
      <AlertIcon />
      <span>{message}</span>
    </div>
  );
}

function EyeToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      className="absolute right-3 text-white/30 hover:text-white/70 transition cursor-pointer"
    >
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  if (done)
    return (
      <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
          <path
            d="M2 6l3 3 5-5"
            stroke="#34d399"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  if (active)
    return (
      <div className="w-7 h-7 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center shrink-0">
        <div className="w-2 h-2 rounded-full bg-gold" />
      </div>
    );
  return (
    <div className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center shrink-0">
      <div className="w-2 h-2 rounded-full bg-white/15" />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-base font-bold text-gold">{value}</span>
      <span className="text-xs text-white/25 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

/* ── Icons ── */
function EmailIcon() {
  return (
    <svg
      className="absolute left-3 w-4 h-4 text-white/25 pointer-events-none"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg
      className="absolute left-3 w-4 h-4 text-white/25 pointer-events-none"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path
        fillRule="evenodd"
        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path
        fillRule="evenodd"
        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
        clipRule="evenodd"
      />
      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      width="16"
      height="16"
      className="shrink-0 mt-0.5"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function Spinner() {
  return (
    <svg
      className="animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      width="16"
      height="16"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0110 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface LoginPageProps {
  onSignIn: () => void;
}
