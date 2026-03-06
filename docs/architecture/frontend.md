# Frontend Architecture

## Stack

Vite + React 19 + TypeScript + Tailwind CSS v4 + AWS Amplify (auth) + Axios (HTTP)

## Environment Variables

Populated from CDK `Outputs` after `cdk deploy`. Copy `.env.example` → `.env`:

```
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_URL=https://your-api-id.execute-api.your-region.amazonaws.com/dev
```

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

## Component Structure

```
components/
  layout/          → app shell, nav
  dashboard/       → Dashboard page and widgets
  expenses/        → ExpensesPage, Table, PeriodSelector
  incomes/         → IncomeDrawer, list page
  shared/          → ExpenseDrawer, IncomeDrawer, CategoryTreemap (cross-feature)
  ui/              → shadcn components (DO NOT edit manually)
  LoginPage.tsx
```

### `src/components/ui/`

Contains shadcn/ui primitives (`Button`, `Card`, `Select`, etc.). **Never edit these by hand.** Add new components via:

```bash
pnpm dlx shadcn add <component>
```

Feature-specific components live in `src/components/{feature}/`.

## Date Handling

Use `date-fns` for display formatting in the frontend. Dates sent to and received from the API are Unix timestamps in **milliseconds** — never ISO strings.
