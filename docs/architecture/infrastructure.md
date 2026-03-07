# Infrastructure Architecture

## Stack

AWS CDK (TypeScript) in `apps/infra/`. Manages Cognito, DynamoDB, API Gateway, and Lambda.

## Resources

| Construct            | File                                   | Description                                                                     |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| `CognitoAuth`        | `constructs/CognitoAuth.ts`            | User Pool + Cognito authorizer                                                  |
| `ExpensesTable`      | `constructs/ExpensesTable.ts`          | DynamoDB table for expenses                                                     |
| `IncomesTable`       | `constructs/IncomesTable.ts`           | DynamoDB table for incomes                                                      |
| `FinanceApi`         | `constructs/FinanceApi.ts`             | Orchestrator: creates RestApi, loads dispatcher, delegates to domain constructs |
| `BaseRouteConstruct` | `constructs/api/BaseRouteConstruct.ts` | Abstract base: `createLambdaFunction`, `registerRoute`, `resolveApiResource`    |
| `ExpensesApi`        | `constructs/api/ExpensesApi.ts`        | `/expenses` routes — expenses table ReadWrite                                   |
| `IncomesApi`         | `constructs/api/IncomesApi.ts`         | `/incomes` routes — incomes table ReadWrite                                     |
| `MetricsApi`         | `constructs/api/MetricsApi.ts`         | `/metrics` routes — both tables ReadOnly                                        |

## Lambda Auto-Discovery

`FinanceApi` imports `dispatcher` from `apps/backend/src/handler/index.ts` at CDK synth time and filters `dispatcher.routes` by path prefix, delegating each group to its domain construct:

- **Entry point:** always `handler/index.ts`, handler export `handler`
- **ROUTE_ID:** set per Lambda — `dispatcher.getHandler()` uses it at runtime to pick the right handler
- **Permissions:** least-privilege — each Lambda only accesses the tables it needs (see table below)
- **Bundling:** esbuild, minified, CJS, `@aws-sdk/*` excluded (provided by the runtime)

Adding a new endpoint requires only registering it in `handler/index.ts` — CDK picks it up automatically on the next deploy.

## IAM Permissions (Least Privilege)

| Domain construct | Tables granted                   | Permission             |
| ---------------- | -------------------------------- | ---------------------- |
| `ExpensesApi`    | `ExpensesTable` only             | `ReadWriteData`        |
| `IncomesApi`     | `IncomesTable` only              | `ReadWriteData`        |
| `MetricsApi`     | `ExpensesTable` + `IncomesTable` | `ReadData` (read-only) |

## Route ID Convention

`Dispatcher.toRouteId(method, path)` generates a camelCase ID:

- `GET /expenses` → `getExpenses`
- `GET /expenses/{id}` → `getExpensesById`
- `POST /incomes` → `postIncomes`

This ID is used as the Lambda function name suffix and set as `ROUTE_ID`.

## Lambda Environment Variables

Environment variables are injected per domain — each Lambda only receives the table names it actually uses:

| Variable              | Injected by                  | Present in                 |
| --------------------- | ---------------------------- | -------------------------- |
| `ROUTE_ID`            | `BaseRouteConstruct`         | All Lambdas                |
| `NODE_ENV`            | `BaseRouteConstruct`         | All Lambdas                |
| `EXPENSES_TABLE_NAME` | `ExpensesApi` / `MetricsApi` | Expenses + Metrics Lambdas |
| `INCOMES_TABLE_NAME`  | `IncomesApi` / `MetricsApi`  | Incomes + Metrics Lambdas  |

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
