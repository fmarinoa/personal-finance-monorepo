# Backend Architecture

## Layer Flow

```
Handler → Controller → Service → Repository → DynamoDB
```

All layers for a feature live under `apps/backend/src/modules/{feature}/`:

```
modules/
  expenses/
    controllers/   → ExpenseController
    domains/       → Expense (domain + validation)
    repositories/  → DynamoDbRepositoryImp
    services/      → ExpenseServiceImp
    index.ts       → singletons wired via DI
  incomes/         → same structure
  metrics/         → controllers + services only (no repository)
  shared/
    controllers/   → BaseController
    domains/       → BaseDomain, User
    repositories/  → BaseDbRepository
    schemas.ts     → periodSchema, schemaForList (shared Zod schemas)
```

## Handler (`src/handler/index.ts`)

Registers all routes via `Dispatcher`. CDK reads the `dispatcher.routes` list at synth time to create one Lambda per route. Each Lambda receives a `ROUTE_ID` env var; `dispatcher.getHandler()` resolves the correct handler at runtime.

Middy middleware is applied per-route in `middyAdapter`:

- Routes with `{param}` → `requirePathParameters(params)`
- `POST / PUT / PATCH` → `requireBody()` + `jsonBodyParser()`
- All routes → `httpErrorHandler()` (last)

## Domain Layer

Domain classes extend `BaseDomain<T>` and implement the corresponding `@packages/core` interface.

### Static Factory Methods

All validation happens in static factory methods that throw `BadRequestError` on failure — never return a `ZodError`:

| Method                         | Purpose                                           |
| ------------------------------ | ------------------------------------------------- |
| `instanceForCreate(data)`      | Validates + constructs a new entity               |
| `instanceForUpdate(data)`      | Validates partial fields for a patch              |
| `instanceForDelete(data)`      | Validates `reason` for soft-delete (Expense only) |
| `validateFilters(filters)`     | Validates `startDate`, `endDate`, `limit`, `page` |
| `buildFromDbItem(item, opts?)` | Hydrates an instance from a raw DynamoDB record   |

```typescript
static instanceForCreate(data: CreateExpensePayload & { user: User }): Expense {
  const { error, data: newData } = schemaForCreate.safeParse(data);
  if (error) throw new BadRequestError({ details: error.message });
  return new Expense({ ...newData, user: new User({ id: data.user.id }) });
}
```

### `BaseDomain.updateFromExisting(existing)`

Encapsulates safe partial merging — strips `undefined` fields from `this` before merging over `existing`. Used in the service layer during updates:

```typescript
// Service
const existing = await this.props.dbRepository.getById(expense);
expense.updateFromExisting(existing); // merges existing + patch safely
await this.props.dbRepository.update(expense);
```

Never spread a domain instance directly — all fields including unset ones are own enumerable properties (Node22 `useDefineForClassFields: true`):

```typescript
// ❌ Wrong — undefined fields override existing values
const merged = { ...existing, ...partialExpense };

// ✅ Correct — use updateFromExisting instead
partialExpense.updateFromExisting(existing);
```

### Dates

All dates are Unix timestamps in **milliseconds** (`DateTime.now().toMillis()`). `schemaForList` coerces string query params from API Gateway to numbers automatically.

### Enum Pattern

Enums are `const` objects with a matching type alias — never TypeScript `enum`:

```typescript
export const ExpenseStatus = { ACTIVE: "ACTIVE", DELETED: "DELETED" } as const;
export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus];
```

## Controller Layer

Controllers extend `BaseController` and use its helpers:

```typescript
const { context, body, pathParams, queryParams } =
  this.retrieveRequestContext(event);

const [amount, description] = this.retrieveFromBody(body!, [
  "amount",
  "description",
]);
const [id] = this.retrieveFromPathParameters(pathParams!, ["id"]);
const [limit, page] = this.retrieveFromQueryParams(queryParams!, [
  "limit",
  "page",
]);
```

- Success responses: `this.ok(data)` → 200, `this.created(data)` → 201, `this.noContent()` → 204
- Errors: throw `BadRequestError`, `NotFoundError`, or `InternalError` from `@packages/lambda`
- `DELETE` receives `reason` as a query param (no body middleware on DELETE)

## `userId` Flow

Extracted from Cognito JWT claims and immediately wrapped:

```typescript
// Controller — wraps in User
const user = new User({ id: context.authorizer?.claims["sub"] });

// Service — receives User object
list(user: User, filters: FiltersForList): Promise<PaginatedResponse<Expense>>

// Repository — receives user.id string
list(userId: string, filters: FiltersForList): Promise<...>
```

## Service Layer

Services hold business logic and translate between domain objects and repositories. Errors from repositories that are not `BaseError` subclasses are wrapped in `InternalError`.

## Repository Layer

### `BaseDbRepository` Helpers

```typescript
this.generateId(); // → randomUUID()
this.getCurrentTimestamp(); // → DateTime.now().toMillis()
this.buildUpdateExpression(item, fields); // → { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues }
```

### DynamoDB Pagination

`nextToken` is a base64-encoded `ExclusiveStartKey`. Repositories encode/decode it — controllers and services never see raw DynamoDB keys.

### Soft Delete

Expenses are never hard-deleted. The repository sets `status: "DELETED"` and records `deletionDate` + `reason` in the `onDelete` field.

Incomes have no DELETE endpoint — soft-delete is handled via `PATCH` to `status: "DELETED"`.

## Dependency Injection

Constructor injection throughout. Singletons wired in each module's `index.ts`:

```typescript
export const dbRepository = new DynamoDbRepositoryImp();
export const expenseService = new ExpenseServiceImp({ dbRepository });
export const expenseController = new ExpenseController({ expenseService });
```

## Income Module

Incomes support two statuses before deletion: `PROJECTED` (expected future income) and `RECEIVED` (confirmed). `instanceForCreate` uses a discriminated union schema:

- `PROJECTED` → requires `projectedDate`
- `RECEIVED` (default) → defaults `receivedDate` to `DateTime.now().toMillis()`

## Shared Types (`packages/core`)

```
core/src/types/
  modules/expenses/
    subtypes.ts   → ExpenseCategory, PaymentMethod, ExpenseStatus, DeleteReason
    expense.ts    → Expense, CreateExpensePayload, FiltersForList
  modules/incomes/
    subtypes.ts   → IncomeCategory, IncomeStatus
    incomes.ts    → Income, CreateIncomePayload
  common.ts       → PaginatedResponse<T>, DateRange
  metrics.ts      → DashboardSummary, DashboardChartPoint, CategoryBreakdown, MonthlyMetric
```

Import via: `import type { Expense } from "@packages/core"`

## Path Aliases

Backend uses `@/` → `src/`. Tests in `apps/backend/test/` use the same alias (configured in `vitest.config.ts`).

## Test Conventions

- Tests live in `apps/backend/test/` mirroring `src/` structure
- `test/eventFactory.ts` — `buildEvent()` helper for `APIGatewayProxyEvent` mocks
- Services and repositories are mocked with `vi.fn()` — never mock domain classes
- Run a single file: `pnpm vitest run test/modules/expenses/domains/Expense.test.ts`
