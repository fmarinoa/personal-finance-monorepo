# Infrastructure Architecture

## Stack

AWS CDK (TypeScript) in `apps/infra/`. Manages Cognito, DynamoDB, API Gateway, and Lambda.

## Resources

| Construct       | File                          | Description                     |
| --------------- | ----------------------------- | ------------------------------- |
| `CognitoAuth`   | `constructs/CognitoAuth.ts`   | User Pool + Cognito authorizer  |
| `ExpensesTable` | `constructs/ExpensesTable.ts` | DynamoDB table for expenses     |
| `IncomesTable`  | `constructs/IncomesTable.ts`  | DynamoDB table for incomes      |
| `FinanceApi`    | `constructs/FinanceApi.ts`    | REST API + one Lambda per route |

## Lambda Auto-Discovery

`FinanceApi` imports `dispatcher` from `apps/backend/src/handler/index.ts` at CDK synth time and iterates `dispatcher.routes`. For each route it creates a separate `NodejsFunction`:

- **Entry point:** always `handler/index.ts`, handler export `handler`
- **ROUTE_ID:** set per Lambda — `dispatcher.getHandler()` uses it at runtime to pick the right handler
- **Permissions:** every Lambda gets `ReadWriteData` on both DynamoDB tables
- **Bundling:** esbuild, minified, CJS, `@aws-sdk/*` excluded (provided by the runtime)

Adding a new endpoint requires only registering it in `handler/index.ts` — CDK picks it up automatically on the next deploy.

## Route ID Convention

`Dispatcher.toRouteId(method, path)` generates a camelCase ID:

- `GET /expenses` → `getExpenses`
- `GET /expenses/{id}` → `getExpensesById`
- `POST /incomes` → `postIncomes`

This ID is used as the Lambda function name suffix and set as `ROUTE_ID`.

## Lambda Environment Variables

| Variable              | Source                                               |
| --------------------- | ---------------------------------------------------- |
| `ROUTE_ID`            | Set per-function by CDK (derived from method + path) |
| `EXPENSES_TABLE_NAME` | DynamoDB table name from CDK                         |
| `INCOMES_TABLE_NAME`  | DynamoDB table name from CDK                         |
| `NODE_ENV`            | `production` (prod) or `development` (dev)           |

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
