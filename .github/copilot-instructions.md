# Copilot Instructions

## Project Overview

pnpm monorepo for a personal finance application on AWS. Backend uses Lambda + DynamoDB + Cognito. Frontend uses Vite + React + AWS Amplify. Infrastructure managed with AWS CDK.

## Commands

### Root

```bash
pnpm lint        # ESLint across all workspaces
pnpm prettier    # Prettier across all workspaces
```

### apps/frontend

```bash
pnpm dev         # Vite dev server
pnpm build       # tsc -b && vite build
pnpm lint        # ESLint
```

### apps/infra

```bash
pnpm diff:dev    # cdk diff -c stage=dev
pnpm diff:prod   # cdk diff -c stage=prod
pnpm deploy:dev  # cdk deploy -c stage=dev
pnpm deploy:prod # cdk deploy -c stage=prod
```

### Deployment prerequisites

- AWS CLI configured with valid credentials
- `npm install -g aws-cdk`
- First time: `cdk bootstrap`

## Architecture

### Monorepo Structure

```
apps/
  backend/    → Lambda functions (Node.js 20), DynamoDB
  frontend/   → Vite + React 19 + Tailwind + AWS Amplify
  infra/      → AWS CDK (Cognito, DynamoDB, API Gateway)
packages/
  core/       → Shared TypeScript types (src/types/modules/)
  lambda/     → Dispatcher class for Lambda auto-discovery
  db/         → SQL migrations (prepared for future RDS migration)
```

### Backend Layer Architecture

Strict one-way dependency flow:

```
Handler → Controller → Service → Repository → Database
```

1. **Handler** (`handler/index.ts`): registers routes via `Dispatcher` with Middy middleware
2. **Controller**: HTTP parsing, Zod validation, response formatting
3. **Service**: business logic, calls repository
4. **Repository**: DynamoDB access only
5. **Domain**: entity models with Zod static factory methods

All backend layers live under `apps/backend/src/modules/{feature}/`.

### Infrastructure Auto-Discovery

`apps/infra/lib/BackendStack.ts` reads `handler/index.ts` and creates a Lambda + API Gateway route for each registered entry. To add a new endpoint:

1. Create controller method
2. Register in `handler/index.ts` via `dispatcher.{method}(path, handler)`
3. CDK auto-deploys on next `cdk deploy`

### packages/lambda Dispatcher

`@packages/lambda` provides the `Dispatcher` class used in `handler/index.ts`:

```typescript
const dispatcher = new Dispatcher();
dispatcher.post("/expenses", expenseController.create);
dispatcher.get("/expenses", expenseController.list);
dispatcher.get("/expenses/{id}", expenseController.getById);
dispatcher.put("/expenses/{id}", expenseController.update);
dispatcher.delete("/expenses/{id}", expenseController.delete);
export default dispatcher.export();
```

## Key Conventions

### userId — Always First Parameter

userId is extracted from Cognito authorizer claims and passed down every layer first:

```typescript
// Controller
const userId = context.authorizer?.claims["sub"];

// Service interface
create(userId: string, expense: Expense): Promise<Expense>

// Repository interface — same order
create(userId: string, expense: Expense): Promise<Expense>

// SQL functions (packages/db) — same order
create_expense(p_user_id UUID, p_amount NUMERIC, ...)
```

### Domain Validation — Static Factory Methods

Domains return `Entity | ZodError` instead of throwing:

```typescript
const expense = Expense.instanceForCreate({ amount, description, category });
if (expense instanceof ZodError) {
  return this.badRequest(expense.message);
}
```

### Controller Helpers (BaseController)

- `getContext(event)` → `{ userId, body, pathParams, queryParams }`
- `retriveFromBody(body, keys)` / `retriveFromPathParameters(pathParams, keys)` / `retriveFromQueryParams(queryParams, keys)`
- Response methods: `ok()`, `created()`, `noContent()`, `badRequest()`, `unauthorized()`, `notFound()`, `internalError()`

### Soft Delete

Expenses are never hard-deleted. The repository sets `status: "DELETED"` and records `deletionDate` + `reason` in the `onDelete` field.

### DynamoDB Pagination

`nextToken` is a base64-encoded `ExclusiveStartKey`. Repositories encode/decode it transparently — controllers and services never handle raw DynamoDB keys.

### Dependency Injection

Constructor injection throughout. Singletons exported from each module's `index.ts`:

```typescript
// modules/expenses/index.ts
export const dbRepository = new DynamoDbRepositoryImp();
export const expenseService = new ExpenseServiceImp(dbRepository);
export const expenseController = new ExpenseController(expenseService);
```

### Middy Middleware Order

```typescript
middy(handler)
  .use(requireBody()) // validate body exists
  .use(jsonBodyParser()) // parse JSON
  .use(httpErrorHandler()); // catch and format errors
```

Only endpoints that require a body use `requireBody()`.

### TypeScript Path Aliases

Backend uses `@/` mapped to `src/`:

```typescript
import { Expense } from "@/domains";
import { expenseController } from "@/modules/expenses";
```

### Shared Types (packages/core)

Types are organized by module under `src/types/modules/`:

```
core/src/types/
  modules/expenses/
    subtypes.ts   → ExpenseCategory, PaymentMethod, ExpenseStatus (const objects)
    expense.ts    → Expense, CreateExpensePayload, FiltersForList
  common.ts       → PaginatedResponse<T>
  metrics.ts      → MonthlyMetric
```

Import via the package name: `import type { Expense } from "@packages/core"`.

### Database Naming

- DB columns: `snake_case` (`user_id`, `payment_date`)
- TypeScript: `camelCase` (`userId`, `paymentDate`)
- Repositories handle the mapping.

## AWS Infrastructure

- **Auth:** Cognito User Pool — userId = `context.authorizer?.claims["sub"]`
- **Database:** DynamoDB (current); `packages/db/migrations/` has PL/pgSQL ready for a future RDS migration
- **Stage:** `dev` or `prod` via `-c stage=dev`. Stack name: `FinanceBackendStack{stage}`
- **Lambda env vars:** `STAGE`, `TABLE_NAME`, `DB_SECRET_ARN` (future RDS)
