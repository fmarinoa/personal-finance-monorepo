# Infrastructure Architecture

## Stack

AWS CDK (TypeScript) in `apps/infra/`. Manages Cognito, DynamoDB, API Gateway, and Lambda.

## Resources

| Construct            | File                                   | Description                                                                     |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| `CognitoAuth`        | `constructs/CognitoAuth.ts`            | User Pool + Cognito authorizer                                                  |
| `ExpensesTable`      | `constructs/db/ExpensesTable.ts`       | DynamoDB table for expenses                                                     |
| `IncomesTable`       | `constructs/db/IncomesTable.ts`        | DynamoDB table for incomes                                                      |
| `BaseTable`          | `constructs/db/BaseTable.ts`           | Abstract base: `createTable()` with `PAY_PER_REQUEST`, PITR, removal policy     |
| `ExpensesBucket`     | `constructs/storage/ExpensesBucket.ts` | S3 bucket for expense attachments                                               |
| `IncomesBucket`      | `constructs/storage/IncomesBucket.ts`  | S3 bucket for income attachments                                                |
| `FinanceApi`         | `constructs/FinanceApi.ts`             | Orchestrator: creates RestApi, loads dispatcher, delegates to domain constructs |
| `BaseRouteConstruct` | `constructs/api/BaseRouteConstruct.ts` | Abstract base: `createLambdaFunction`, `registerRoute`, `resolveApiResource`    |
| `ExpensesApi`        | `constructs/api/ExpensesApi.ts`        | `/expenses` routes — expenses table + attachments bucket ReadWrite              |
| `IncomesApi`         | `constructs/api/IncomesApi.ts`         | `/incomes` routes — incomes table + attachments bucket ReadWrite                |
| `MetricsApi`         | `constructs/api/MetricsApi.ts`         | `/metrics` routes — both tables ReadOnly                                        |

## Lambda Auto-Discovery

`FinanceApi` imports `dispatcher` from `apps/backend/src/handler/index.ts` at CDK synth time and filters `dispatcher.routes` by path prefix, delegating each group to its domain construct:

- **Entry point:** always `handler/index.ts`, handler export `handler`
- **ROUTE_ID:** set per Lambda — `dispatcher.getHandler()` uses it at runtime to pick the right handler
- **Permissions:** least-privilege — each Lambda only accesses the tables it needs (see table below)
- **Bundling:** esbuild, minified, CJS, `@aws-sdk/*` excluded (provided by the runtime)

Adding a new endpoint requires only registering it in `handler/index.ts` — CDK picks it up automatically on the next deploy.

## S3 Attachment Buckets

Two buckets are created per stage — one per module:

| Bucket name                    | Module   |
| ------------------------------ | -------- |
| `expenses-attachments-{stage}` | Expenses |
| `incomes-attachments-{stage}`  | Incomes  |

**Object key pattern:** `{userId}/{recordId}/{sanitized_filename}.{ext}`  
Example: `abc-123/exp-456/recibo_almuerzo.jpg`

- `{ext}` is derived from the validated `contentType` — never from the original filename extension
- Only `image/jpeg`, `image/png`, and `application/pdf` are accepted
- Only the Lambda functions that serve the `/attachment` route for a given module receive S3 permissions — all other Lambdas in that module do not

**Removal policy:** `RETAIN` in prod, `DESTROY` in dev.

## DynamoDB Tables

Both tables share the same base configuration via `BaseTable` (`constructs/db/`):

- **Billing:** `PAY_PER_REQUEST`
- **Removal policy:** `RETAIN` in prod, `DESTROY` in dev
- **PITR:** enabled in prod only

### ExpensesTable GSIs

| Index name               | PK       | SK            | Usage                         |
| ------------------------ | -------- | ------------- | ----------------------------- |
| `userIdPaymentDateIndex` | `userId` | `paymentDate` | `GET /expenses` list endpoint |

### IncomesTable GSIs

| Index name                 | PK       | SK              | Usage                            |
| -------------------------- | -------- | --------------- | -------------------------------- |
| `userIdEffectiveDateIndex` | `userId` | `effectiveDate` | `GET /incomes` (all statuses)    |
| `userIdStatusIndex`        | `userId` | `status`        | `GET /incomes?onlyReceived=true` |

`effectiveDate` is a computed attribute written by the repository: `receivedDate ?? projectedDate ?? creationDate`. It is updated on every income PATCH to keep the GSI sort key current.

## IAM Permissions (Least Privilege)

| Domain construct | DynamoDB                           | S3                                               |
| ---------------- | ---------------------------------- | ------------------------------------------------ |
| `ExpensesApi`    | `ExpensesTable` — ReadWrite        | `ExpensesBucket` — only the `/attachment` Lambda |
| `IncomesApi`     | `IncomesTable` — ReadWrite         | `IncomesBucket` — only the `/attachment` Lambda  |
| `MetricsApi`     | Both tables — ReadData (read-only) | —                                                |

## Route ID Convention

`Dispatcher.toRouteId(method, path)` generates a camelCase ID:

- `GET /expenses` → `getExpenses`
- `GET /expenses/{id}` → `getExpensesById`
- `POST /incomes` → `postIncomes`

This ID is used as the Lambda function name suffix and set as `ROUTE_ID`.

## Lambda Environment Variables

Environment variables are injected per domain — each Lambda only receives the variables it actually uses:

| Variable                           | Injected by                  | Present in                 |
| ---------------------------------- | ---------------------------- | -------------------------- |
| `ROUTE_ID`                         | `BaseRouteConstruct`         | All Lambdas                |
| `NODE_ENV`                         | `BaseRouteConstruct`         | All Lambdas                |
| `EXPENSES_TABLE_NAME`              | `ExpensesApi` / `MetricsApi` | Expenses + Metrics Lambdas |
| `INCOMES_TABLE_NAME`               | `IncomesApi` / `MetricsApi`  | Incomes + Metrics Lambdas  |
| `EXPENSES_ATTACHMENTS_BUCKET_NAME` | `ExpensesApi`                | Expenses Lambdas only      |
| `INCOMES_ATTACHMENTS_BUCKET_NAME`  | `IncomesApi`                 | Incomes Lambdas only       |

## Stages

Two stages: `Dev` and `Prod`. Stack name: `FinanceBackendStack{Stage}`.

`isProd` disables CDK `CfnOutput`s (API URL, table names, Cognito IDs are only printed for Dev to avoid leaking prod values).

## Auth

Cognito User Pool with a `CognitoUserPoolsAuthorizer` attached to all API Gateway methods. The authenticated `userId` is available in Lambda as:

```typescript
context.authorizer?.claims["sub"];
```

## Commands

```bash
# From apps/infra/
pnpm diff:dev    # cdk diff -c stage=dev
pnpm deploy:dev  # cdk deploy -c stage=dev
```

Prerequisites: AWS CLI configured, `npm install -g aws-cdk`, first time: `cdk bootstrap`.
