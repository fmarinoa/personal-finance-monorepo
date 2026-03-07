# Frontend Architecture

## Stack

Vite + React 19 + TypeScript + Tailwind CSS v4 + AWS Amplify (auth) + Axios (HTTP) + React Router DOM v7 (routing)

## Environment Variables

Populated from CDK `Outputs` after `cdk deploy`. Copy `.env.example` → `.env`:

```
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_URL=https://your-api-id.execute-api.your-region.amazonaws.com/dev
```

## Routing

Uses `react-router-dom` v7 in SPA/library mode with `<BrowserRouter>`. Routes are declared in `src/App.tsx`:

| Path         | Component                   | Auth      |
| ------------ | --------------------------- | --------- |
| `/login`     | `pages/login/index.tsx`     | Public    |
| `/`          | Redirect → `/dashboard`     | Protected |
| `/dashboard` | `pages/dashboard/index.tsx` | Protected |
| `/expenses`  | `pages/expenses/index.tsx`  | Protected |
| `/incomes`   | `pages/incomes/index.tsx`   | Protected |
| `*`          | Redirect → `/dashboard`     | Protected |

Protected routes are wrapped in `<ProtectedRoute>` (uses `<Outlet>`). If `authState === "unauthenticated"` it redirects to `/login`. AWS Amplify Hosting handles the SPA fallback (all URLs → `index.html`) in production — no infra changes needed.

## Auth (`src/contexts/AuthContext.tsx`)

Auth state is managed centrally in `AuthContext` (not in individual pages):

```typescript
interface AuthContextValue {
  authState: "loading" | "unauthenticated" | "authenticated";
  username: string | null;
  signIn: (name: string) => void; // called by LoginPage after Cognito success
  signOut: () => void; // called by AppLayout after amplifySignOut()
}
```

`<AuthProvider>` wraps the entire app inside `<BrowserRouter>`. Components access it via `useAuth()`.

## API Client (`src/lib/api.ts`)

Single axios instance. An Amplify interceptor attaches the Cognito `idToken` as the `Authorization` header on every request:

```typescript
api.interceptors.request.use(async (config) => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (token) config.headers.Authorization = token;
  return config;
});
```

All API functions are thin wrappers imported from `src/lib/api.ts`. Types come from `@packages/core`.

## Data Fetching — Custom Hooks

The frontend does **not** use React Query or SWR. Each resource has hand-written hooks in `src/hooks/{module}/`:

```
hooks/
  expenses/
    useExpenses.ts       → list with pagination, startDate/endDate filters
    useCreateExpense.ts
    useUpdateExpense.ts
    useDeleteExpense.ts
  incomes/               → same pattern
  metrics/
  usePeriod.ts           → shared period state (startDate, endDate)
  useIsMobile.ts
```

Hooks expose `{ data, loading, error, refresh }`. Staleness is tracked via a `fetchedKey` string — the hook re-fetches when params change or `refresh()` is called.

Abort controllers are used to cancel in-flight requests on unmount.

## Source Structure

```
src/
  pages/
    login/index.tsx        → LoginPage (public)
    dashboard/
      index.tsx            → DashboardPage
      MonthlyChart.tsx     → dashboard-specific widget
    expenses/index.tsx     → ExpensesPage
    incomes/index.tsx      → IncomesPage
  components/
    layout/
      AppLayout.tsx        → app shell, sidebar/mobile nav (uses useNavigate + useAuth)
      ProtectedRoute.tsx   → auth guard using <Outlet>
    shared/
      TransactionList.tsx  → full-page transaction list scaffold (expenses + incomes)
      RecentTransactionsCard.tsx → compact card used in Dashboard
      CategoryTreemap.tsx
      MobileFAB.tsx        → mobile floating action button (used by all 3 pages)
      PeriodSelector.tsx   → period filter toggle (used by TransactionList)
      ExpenseDrawer.tsx
      IncomeDrawer.tsx
    ui/                    → shadcn/ui primitives (DO NOT edit manually)
  contexts/
    AuthContext.tsx        → AuthProvider + useAuth() hook
```

**Rules:**

- Page-specific sub-components live in `src/pages/[name]/` alongside their page.
- Cross-page components live in `src/components/shared/`.
- `src/components/ui/` is managed exclusively by shadcn — never edit manually.

### Adding a shadcn component

```bash
pnpm dlx shadcn add <component>
```

## Date Handling

Use `luxon` for display formatting in the frontend. Dates sent to and received from the API are Unix timestamps in **milliseconds** — never ISO strings.
