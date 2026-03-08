# Backend Architecture

## Layer Flow

```
Handler → Controller → Service → Repository → DynamoDB / S3
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
    repositories/  → BaseDbRepository, AttachmentRepository
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

### `AttachmentRepository`

Generates pre-signed S3 URLs for uploading and viewing file attachments. Lives in `modules/shared/repositories/` and is injected into `ExpenseServiceImp` and `IncomeServiceImpl`.

```typescript
await attachmentRepository.generateUrls(
  userId,
  recordId,
  contentType,
  filename,
);
// Returns: { uploadUrl, viewUrl, key }
```

- **`contentType`** — validated against the allowlist: `image/jpeg`, `image/png`, `application/pdf`
- **`filename`** — original filename from the client; sanitized (spaces → `_`, unsafe chars stripped, extension stripped and replaced with the validated one from `contentType`)
- **`key` pattern** — `{userId}/{recordId}/{sanitized_name}.{ext}` (e.g. `abc123/exp-456/receipt.jpg`)
- Pre-signed URLs expire in **5 minutes**
- The `key` returned is stored in the record's `attachmentKey` field via a subsequent PATCH

**Two-step attachment flow (create):**

1. `POST /expenses` → returns `{ id }`
2. `GET /expenses/{id}/attachment?contentType=...&filename=...` → returns `{ uploadUrl, viewUrl, key }`
3. Client `PUT` file directly to `uploadUrl` (no auth headers — pre-signed URL carries credentials)
4. `PATCH /expenses/{id}` with `{ attachmentKey: key }`

**Edit flow:** get pre-signed URL → upload → include `attachmentKey` in the same PATCH call.

### `fieldsToUpdate` — Explicit Allowlist

Both `DynamoDbRepositoryImp.update()` methods maintain an explicit allowlist of fields passed to `buildUpdateExpression`. When adding new updatable fields to a domain's `schemaForUpdate`, **always add them here too**:

```typescript
// expenses
const fieldsToUpdate = [
  "amount",
  "description",
  "category",
  "paymentDate",
  "paymentMethod",
  "attachmentKey",
  "lastUpdatedDate",
].filter((field) => expense[field] !== undefined);

// incomes
const fieldsToUpdate = [
  "amount",
  "description",
  "category",
  "status",
  "receivedDate",
  "projectedDate",
  "attachmentKey",
  "effectiveDate",
].filter((field) => income[field] !== undefined);
```

### `effectiveDate` (Incomes)

A computed field written on every create and update — `receivedDate ?? projectedDate ?? getCurrentTimestamp()`. Used as the sort key on the `userIdEffectiveDateIndex` GSI so incomes can be queried by date regardless of status. It is always kept in sync with the latest date fields.

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
    expense.ts    → Expense, CreateExpensePayload, FiltersForList, AttachmentUrls
  modules/incomes/
    subtypes.ts   → IncomeCategory, IncomeStatus
    incomes.ts    → Income, CreateIncomePayload
  common.ts       → PaginatedResponse<T>, DateRange
  metrics.ts      → DashboardSummary, DashboardChartPoint, CategoryBreakdown, MonthlyMetric
```

`AttachmentUrls` is defined in `expenses/expense.ts` but is module-agnostic — it applies to both expenses and incomes:

```typescript
export interface AttachmentUrls {
  uploadUrl: string; // pre-signed PUT URL for S3 (5 min TTL)
  viewUrl: string; // pre-signed GET URL for S3 (5 min TTL)
  key: string; // S3 object key, stored as attachmentKey on the record
}
```

`attachmentKey` is an optional field on both `Expense` and `Income` interfaces, and on their respective `CreateExpensePayload` / `CreateIncomePayload` types. It is also accepted by `schemaForUpdate` in both domain classes.

Import via: `import type { Expense, AttachmentUrls } from "@packages/core"`

## Path Aliases

Backend uses `@/` → `src/`. Tests in `apps/backend/test/` use the same alias (configured in `vitest.config.ts`).

## Test Conventions

- Tests live in `apps/backend/test/` mirroring `src/` structure
- `test/eventFactory.ts` — `buildEvent()` helper for `APIGatewayProxyEvent` mocks
- Services and repositories are mocked with `vi.fn()` — never mock domain classes
- Run a single file: `pnpm vitest run test/modules/expenses/domains/Expense.test.ts`
