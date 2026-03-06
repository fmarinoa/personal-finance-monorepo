# Copilot Instructions

## Rules and Workflow:

### 1. Front-end Development

- **No compilation rule:** After completing tasks on the frontend, **it is prohibited** to execute `build` commands.

- **Action:** Notify the user that they can refresh the browser directly to validate changes.

### 2. Backend and Reliability

- **Test-Driven:** When creating new features on the backend, it is mandatory to add unit/integration tests.

- **Verification:** Always run `pnpm test` after any changes. The task is not considered complete until the tests pass.

### 3. Infrastructure and Security (CRITICAL)

- **Restricted workspace:** The `infra` workspace affects the live AWS environment.

- **Protocol:** BEFORE modifying any file in `infra/`, you must request explicit permission from the user.

### 4. Using Skills

- Always consult the `.agents/skills/` folder to reuse existing logic before writing new scripts.

- Read the skill's docstrings to understand their parameters and return values.

### 5. Mandatory Planning Workflow

- **Template:** All plans MUST follow the structure in `.plans/template.md`.
- **Naming:** Save as `.plans/YYYY-MM-DD-feature-name.md`.
- **No Execution:** You are strictly forbidden from modifying source code or running terminal commands (except for discovery) while a plan is in "PENDING APPROVAL" status.
- **Approval:** Once I reply with "LGO", you must update the status to "IN PROGRESS" and begin execution.

### 6. Dependency Management (STRICT)

- **Exact Versions:** NEVER use carets (`^`) or tildes (`~`) when installing new dependencies.
- **Strict Installation:** Always use the `--save-exact` (or `-E`) flag.
- **Commands:** - Use `pnpm add -E <package>` for production dependencies.
  - Use `pnpm add -DE <package>` for dev dependencies.
- **Reasoning:** This ensures deterministic builds and prevents unexpected breaking changes in our AWS Lambda and Frontend environments.

### 7. Commit Messages

- Use conventional commits, English only, no emojis, lowercase type, max 100 chars:

## Skill System:

You have access to specialized behaviors in `.agents/skills/`. Before starting a task, scan that folder and:

1. If the task is UI/Frontend, adopt the persona and constraints defined in `frontend-design`.
2. If the task is react/hooks, adopt the persona and constraints defined in `vercel-react-best-practices`.
3. If the task is backend, adopt the persona and constraints defined in `nodejs-backend-patterns`.
4. Use the "description" field in each skill file to determine if it's applicable to the current request.
5. Always prioritize the specific rules inside a skill over general rules.

## Knowledge Retrieval Protocol:

- **Context First:** For any complex task, architectural change, or new feature, consult the relevant documentation in `docs/architecture/` (backend.md, frontend.md, infrastructure.md).
- **Stay Updated:** Do not rely on your general training data if a project document in `docs/` provides specific instructions.
- **Traceability:** If a change is driven by a rule in the documentation, mention which file you are following (e.g., "Following `docs/architecture/backend.md`...").

## Project Overview

pnpm monorepo for a personal finance application on AWS. Backend uses Lambda + DynamoDB + Cognito. Frontend uses Vite + React + AWS Amplify. Infrastructure managed with AWS CDK.

Architecture docs: [`docs/architecture/backend.md`](../docs/architecture/backend.md) · [`docs/architecture/frontend.md`](../docs/architecture/frontend.md) · [`docs/architecture/infrastructure.md`](../docs/architecture/infrastructure.md)

## Commands

### Root

```bash
pnpm lint        # ESLint across all workspaces
pnpm prettier    # Prettier across all workspaces
```

### apps/backend

```bash
pnpm test                                                      # run all tests (vitest)
pnpm test:coverage                                             # run with coverage report (60% threshold)
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
pnpm deploy:dev  # cdk deploy -c stage=dev
```

## Architecture

### Monorepo Structure

```
apps/
  backend/    → Lambda functions (Node.js 22), DynamoDB
  frontend/   → Vite + React 19 + Tailwind v4 + AWS Amplify + shadcn/ui
  infra/      → AWS CDK (Cognito, DynamoDB, API Gateway)
packages/
  core/       → Shared TypeScript types (src/types/modules/)
  lambda/     → Dispatcher class for Lambda auto-discovery
```

### Backend Layer Flow

```
Handler → Controller → Service → Repository → Database
```

All backend layers live under `apps/backend/src/modules/{feature}/`. Modules: `expenses`, `incomes`, `metrics`, `shared`.

**Currently implemented endpoints:**

- `POST /expenses`, `GET /expenses`, `GET /expenses/{id}`, `PATCH /expenses/{id}`, `DELETE /expenses/{id}`
- `POST /incomes`, `GET /incomes`, `PATCH /incomes/{id}`
- `GET /metrics/dashboard-summary`, `GET /metrics/dashboard-chart`, `GET /metrics/category-breakdown`

See [`docs/architecture/backend.md`](../docs/architecture/backend.md) for full detail on layers, domain patterns, DI, middleware, and conventions.

### Infrastructure Auto-Discovery

`FinanceApi` (CDK construct) reads `dispatcher.routes` from `handler/index.ts` at synth time and creates one Lambda per route. Each Lambda gets a `ROUTE_ID` env var; `dispatcher.getHandler()` uses it at runtime to invoke the right handler.

To add an endpoint: register it in `handler/index.ts` → CDK auto-creates the Lambda on next deploy.

See [`docs/architecture/infrastructure.md`](../docs/architecture/infrastructure.md) for full detail.

## Key Conventions

### Domain Factory Methods

Validate with Zod, throw `BadRequestError` on failure. Use:

- `Domain.instanceForCreate(data)` / `instanceForUpdate(data)` / `instanceForDelete(data)`
- `Domain.validateFilters(filters)` — validates `startDate`, `endDate`, `limit`, `page`
- `Domain.buildFromDbItem(item)` — hydrates from raw DynamoDB record

### Safe Partial Merging

Domain instances have `useDefineForClassFields: true` — all fields are own enumerable properties, including `undefined` ones. Use `domain.updateFromExisting(existing)` (from `BaseDomain`) in service-layer updates instead of manual spreading.

### `userId` Flow

Cognito `sub` → wrapped in `User` at the controller level → passed as `User` to services → unwrapped to `user.id` string at repositories.

### Dates

All dates are Unix timestamps in **milliseconds**. Backend & frontend use `luxon`.

### Enums

`const` object + type alias (never TypeScript `enum`). Defined in `packages/core/src/types/modules/`.

### DELETE Reason

`DELETE /expenses/{id}` receives `reason` as a **query param** (no body middleware on DELETE). Valid values: `DUPLICATE`, `WRONG_AMOUNT`, `WRONG_CATEGORY`, `CANCELLED`, `OTHER`.

### Soft Delete

Expenses: repository sets `status: "DELETED"` + `onDelete.{deletionDate, reason}`. Incomes: no DELETE endpoint — use `PATCH` to set `status: "DELETED"`.

### Dependency Injection

Constructor injection. Singletons exported from each module's `index.ts` and imported by `handler/index.ts`.

### TypeScript Path Aliases

Backend and frontend both use `@/` → `src/`. Configured in each app's `tsconfig.json` and `vitest.config.ts`.

### Shared Types

Import from `@packages/core`:

```typescript
import type { Expense, PaginatedResponse } from "@packages/core";
```

### Frontend Data Fetching

No React Query / SWR. Custom hooks in `src/hooks/{module}/` using `useState`/`useEffect`. API calls go through `src/lib/api.ts` (axios + Amplify auth interceptor). Do **not** edit `src/components/ui/` — those are shadcn components.

See [`docs/architecture/frontend.md`](../docs/architecture/frontend.md) for full detail.
