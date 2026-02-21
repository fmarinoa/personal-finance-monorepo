# Copilot Instructions

## Project Overview

This is a **pnpm monorepo** for a personal finance application using AWS infrastructure. The architecture follows a clean layered pattern with Lambda functions, RDS PostgreSQL, and React frontend.

## Build & Run Commands

### Root commands

- `pnpm prettier` - Format all code with Prettier
- No tests configured yet

### Per-workspace commands

Navigate to specific workspace (`apps/backend`, `apps/infra`, `packages/core`) and run:

- `pnpm prettier` - Format code in that workspace

### Deployment (from `apps/infra`)

**Prerequisites:**

- AWS CLI configured with valid credentials
- CDK CLI installed globally: `npm install -g aws-cdk`

**Commands:**

```bash
# Bootstrap CDK (first time only per account/region)
cdk bootstrap

# Preview changes before deploying
cdk diff -c stage=dev

# Deploy to dev environment
cdk deploy -c stage=dev

# Deploy to prod environment
cdk deploy -c stage=prod

# Auto-approve deployment (skip confirmation)
cdk deploy -c stage=dev --require-approval never
```

**Stage behavior:**

- Stage defaults to `dev` if not specified
- Stack name format: `FinanceBackendStack{stage}`
- Prod environment has increased resources (storage, multi-AZ options)

## Architecture

### Monorepo Structure

```
/apps
  /backend      → Lambda functions (Node.js 20)
  /frontend     → Vite + React (planned)
  /infra        → AWS CDK infrastructure
/packages
  /core         → Shared TypeScript types/interfaces
  /db           → SQL migrations and schemas
```

### Backend Layer Architecture

The backend follows a **strict layered architecture** with dependency flow in one direction:

```
Handler → Controller → Service → Repository → Database
```

**Key principles:**

1. **Handler** (`/handler/index.ts`): Defines Lambda configurations with Middy middlewares
2. **Controller** (`/controllers`): HTTP concerns (validation, status codes, request/response mapping)
3. **Service** (`/services`): Business logic orchestration
4. **Repository** (`/repositories`): Database access only
5. **Domain** (`/domains`): Entity models with validation (uses Zod)

### Infrastructure Auto-Discovery

The CDK stack in `apps/infra/lib/BackendStack.ts` **automatically discovers and deploys lambdas** by:

- Reading `apps/backend/src/handler/index.ts`
- Creating a Lambda + API Gateway route for each exported `LambdaConfig`
- Auto-wiring VPC, RDS credentials, and permissions

**To add a new endpoint:**

1. Create controller method
2. Add entry to `lambdas` object in `handler/index.ts` with `method`, `path`, and `handler`
3. CDK will auto-deploy on next `cdk deploy`

### Database Access Pattern

**Always use PostgreSQL stored functions**, not direct SQL queries in repositories:

- Functions are defined in `packages/db/migrations/001_initial_schema.sql`
- Repositories call functions with parameterized queries: `SELECT * FROM function_name($1, $2)`
- Function signature convention: **userId is always the first parameter**
- Example: `create_expense(p_user_id UUID, p_amount NUMERIC, ...)`

### Database Connection

Repositories use:

- **pg** connection pool (singleton pattern, reused across Lambda invocations)
- **AWS Secrets Manager** to fetch RDS credentials from `DB_SECRET_ARN` env var
- Lazy initialization of pool in `getPool()` method

## Key Conventions

### TypeScript Path Aliases

All backend code uses `@/` for imports:

```typescript
import { Expense } from "@/domains";
import { RdsRepository } from "@/repositories/RdsRepository";
```

Configured in `apps/backend/tsconfig.json`

### Workspace Dependencies

Use `workspace:*` protocol for internal packages:

```json
"@packages/core": "workspace:*"
```

### Database Naming Convention

- **Database:** snake_case (e.g., `category_code`, `user_id`)
- **TypeScript:** camelCase (e.g., `categoryCode`, `userId`)
- **Repositories must map** between conventions when reading/writing

### Domain Model Validation

Domain entities use **static factory methods** with Zod validation:

```typescript
// For CREATE
const expense = Expense.instanceForCreate({ amount, description, category });
if (expense instanceof ZodError) {
  // Handle validation error
}

// For UPDATE
const expense = Expense.instanceForUpdate({ id, amount, description });
```

Returns `Entity | ZodError` instead of throwing exceptions.

### Controller Helpers

`BaseController` provides utility methods:

- `getContext(event)` - Extract userId, body, pathParams, queryParams
- `retriveFromBody(body, keys)` - Extract multiple fields from parsed body
- `retriveFromPathParameters(pathParams, keys)` - Extract path params
- `retriveFromQueryParams(queryParams, keys)` - Extract query params
- Response methods: `ok()`, `created()`, `noContent()`, `badRequest()`, `unauthorized()`, `notFound()`, `internalError()`

### Parameter Order Convention

**Across all layers, userId comes first:**

```typescript
// Service
create(userId: string, expense: Expense)
update(userId: string, expense: Expense)
delete(userId: string, expenseId: string)

// Repository - same order
create(userId: string, expense: Expense)

// SQL functions - same order
create_expense(p_user_id UUID, p_amount NUMERIC, ...)
update_expense(p_user_id UUID, p_id UUID, ...)
delete_expense(p_user_id UUID, p_id UUID)
```

### Dependency Injection

- Services injected into controllers via constructor
- Repositories injected into services via constructor
- Singletons exported from `index.ts` files (e.g., `expenseController`, `expenseService`, `dbRepository`)

### Middy Middleware Stack

Lambda handlers use Middy with specific middleware order:

```typescript
middy(handler)
  .use(requireBody()) // First: validate body exists
  .use(jsonBodyParser()) // Second: parse JSON
  .use(httpErrorHandler()); // Last: catch and format errors
```

## AWS Infrastructure Details

### Lambda Configuration

- **Runtime:** Node.js 20
- **VPC:** Private subnets with egress (no NAT Gateway in dev)
- **Environment variables:**
  - `DB_SECRET_ARN` - RDS credentials secret ARN
  - `STAGE` - Deployment stage (dev/prod)

### RDS Setup

- **Engine:** PostgreSQL 15
- **Subnet:** Private isolated (no internet access)
- **Credentials:** Auto-generated and stored in Secrets Manager
- Database name: `financedb_${stage}`

### API Gateway

- Auto-generated from `handler/index.ts` lambda configs
- REST API with stage-based deployments
- Supports path parameters (e.g., `/expenses/{id}`)
