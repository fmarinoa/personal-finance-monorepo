# Copilot Instructions

## Project Overview

pnpm monorepo for a personal finance application on AWS. Backend uses Lambda + DynamoDB + Cognito. Frontend uses Vite + React + AWS Amplify. Infrastructure managed with AWS CDK.

## Commands

### Root

```bash
pnpm lint        # ESLint across all workspaces
pnpm prettier    # Prettier across all workspaces
```

### apps/backend

```bash
pnpm test                                              # run all tests (vitest)
pnpm test:coverage                                     # run with coverage report (60% threshold)
pnpm vitest run test/modules/expenses/domains/Expense.test.ts  # run a single test file
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
  backend/    → Lambda functions (Node.js 22), DynamoDB
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

`@packages/lambda` provides the `Dispatcher` class. `handler/index.ts` uses method chaining with a Middy adapter:

```typescript
export const dispatcher = new Dispatcher(middyAdapter)
  .post("/expenses", (e) => expenseController.create(e))
  .get("/expenses", (e) => expenseController.list(e))
  .get("/expenses/{id}", (e) => expenseController.getById(e))
  .patch("/expenses/{id}", (e) => expenseController.update(e))
  .delete("/expenses/{id}", (e) => expenseController.delete(e));

export const handler: APIGatewayProxyHandler = (...args) =>
  dispatcher.getHandler()(...args);
```

## Key Conventions

### userId — Wrapped in User Object

`userId` is extracted from Cognito claims (`context.authorizer?.claims["sub"]`) and immediately wrapped in a `User` domain object. The `User` is passed through every layer:

```typescript
// Controller
const user = new User({ id: context.authorizer?.claims["sub"] });

// Service interface
list(user: User, filters: FiltersForList): Promise<PaginatedResponse<Expense>>

// Repository
list(userId: string, filters: FiltersForList): Promise<...>
// (repositories receive user.id, not the User object)
```

### Domain Validation — Static Factory Methods That Throw

Domain factory methods validate with Zod and **throw** `BadRequestError` on failure. Never return a ZodError:

```typescript
// instanceForCreate uses the parsed Zod output (transforms applied)
static instanceForCreate(data: CreateExpensePayload & { user: User }): Expense {
  const { error, data: newData } = schemaForCreate.safeParse(data);
  if (error) throw new BadRequestError({ details: error.message });
  return new Expense({ ...newData, user: new User({ id: data.user.id }) });
}

// instanceForUpdate / instanceForDelete follow the same throw pattern
```

### Expense Class Fields and Partial Spreading

The Expense class uses `useDefineForClassFields: true` (inherited from Node22 target). All declared fields initialize to `undefined` as own enumerable properties, even when not passed to the constructor. **Never spread an Expense instance directly over another** when patching — all undefined fields will override existing values:

```typescript
// ❌ Wrong — overrides existing.category with undefined
const merged = { ...existing, ...partialExpense };

// ✅ Correct — strip undefined fields first
const patch = Object.fromEntries(
  Object.entries(partialExpense).filter(([, v]) => v !== undefined),
);
const merged = { ...existing, ...patch, user: partialExpense.user };
```

### Controller Helpers (BaseController)

```typescript
const { context, body, pathParams, queryParams } =
  this.retrieveRequestContext(event);

this.retrieveFromBody(body!, ["amount", "description"]);
this.retrieveFromPathParameters(pathParams!, ["id"]);
this.retrieveFromQueryParams(queryParams!, ["limit", "page"]);
```

Response methods: `ok()`, `created()`, `noContent()`. Errors are thrown as `BadRequestError`, `NotFoundError`, `InternalError` from `@packages/lambda` and caught by Middy's `httpErrorHandler`.

### DELETE uses Query Params for Reason

The DELETE endpoint receives `reason` as a **query param**, not in the body (DELETE requests have no body middleware):

```typescript
const [reason] = this.retrieveFromQueryParams(queryParams!, ["reason"]);
const expense = Expense.instanceForDelete({ user, id: expenseId, reason });
```

`reason` must be a valid `DeleteReason` enum value (`DUPLICATE`, `WRONG_AMOUNT`, `WRONG_CATEGORY`, `CANCELLED`, `OTHER`).

### Soft Delete

Expenses are never hard-deleted. The repository sets `status: "DELETED"` and records `deletionDate` + `reason` in the `onDelete` field.

### DynamoDB Pagination

`nextToken` is a base64-encoded `ExclusiveStartKey`. Repositories encode/decode it transparently — controllers and services never handle raw DynamoDB keys.

### Dependency Injection

Constructor injection throughout. Singletons exported from each module's `index.ts`:

```typescript
// modules/expenses/index.ts
export const dbRepository = new DynamoDbRepositoryImp();
export const expenseService = new ExpenseServiceImp({ dbRepository });
export const expenseController = new ExpenseController({ expenseService });
```

### Middy Middleware Order

Path param endpoints get `requirePathParameters` before `httpErrorHandler`. Body endpoints additionally get `requireBody` + `jsonBodyParser`. This is wired automatically in `handler/index.ts` based on the route path and method — controllers receive already-parsed body and validated path params.

```typescript
// Auto-applied in handler/index.ts middyAdapter:
if (pathParams.length) handler.use(requirePathParameters(pathParams));
if (BODY_METHODS.includes(method))
  handler.use(requireBody()).use(jsonBodyParser());
handler.use(httpErrorHandler());
```

### TypeScript Path Aliases

Backend uses `@/` mapped to `src/`:

```typescript
import { Expense } from "@/modules/expenses/domains";
import { expenseController } from "@/modules/expenses/controllers";
```

Tests in `apps/backend/test/` use the same alias (configured in `vitest.config.ts`).

### Shared Types (packages/core)

Types are organized by module under `src/types/modules/`:

```
core/src/types/
  modules/expenses/
    subtypes.ts.ts  → ExpenseCategory, PaymentMethod, ExpenseStatus, DeleteReason (const objects + types)
    expense.ts      → Expense, CreateExpensePayload, FiltersForList
  common.ts         → PaginatedResponse<T>, DeleteReason
  metrics.ts        → MonthlyMetric
```

Import via the package name: `import type { Expense } from "@packages/core"`.

### Test Structure

Backend tests live in `apps/backend/test/` mirroring the source structure:

```
test/
  eventFactory.ts                          → buildEvent() helper for APIGatewayProxyEvent mocks
  modules/expenses/
    controllers/ExpenseController.test.ts
    domains/Expense.test.ts
    services/ExpenseServiceImp.test.ts
```

Services and repositories are mocked with `vi.fn()`. Never mock the domain classes — test them directly.

## AWS Infrastructure

- **Auth:** Cognito User Pool — userId = `context.authorizer?.claims["sub"]`
- **Database:** DynamoDB (current); `packages/db/migrations/` has PL/pgSQL ready for a future RDS migration
- **Stage:** `dev` or `prod` via `-c stage=dev`. Stack name: `FinanceBackendStack{stage}`
- **Lambda env vars:** `STAGE`, `TABLE_NAME`, `DB_SECRET_ARN` (future RDS)

## Commits

Conventional Commits format, English only, no emojis, lowercase type, no scope, max 100 chars:

```
feat: add new feature
fix: bug fix
refactor: code change that neither fixes a bug nor adds a feature
test: adding missing tests or correcting existing tests
chore: changes to the build process or auxiliary tools
```
