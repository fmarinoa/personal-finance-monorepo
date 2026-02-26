import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import jsonBodyParser from "@middy/http-json-body-parser";
import { Dispatcher, HttpMethod } from "@packages/lambda";
import { APIGatewayProxyHandler } from "aws-lambda";

import { requireBody, requirePathParameters } from "@/middlewares";
import { expenseController } from "@/modules/expenses/controllers";
import { incomeController } from "@/modules/incomes/controllers";
import { metricsController } from "@/modules/metrics/controllers";

const BODY_METHODS: HttpMethod[] = ["POST", "PUT", "PATCH"];
const PATH_PARAM_PATTERN = /\{(\w+)\}/g;

function middyAdapter(
  method: HttpMethod,
  path: string,
  fn: APIGatewayProxyHandler,
): APIGatewayProxyHandler {
  const pathParams = [...path.matchAll(PATH_PARAM_PATTERN)].map((m) => m[1]);

  let handler = middy(fn);

  if (pathParams.length) {
    handler = handler.use(requirePathParameters(pathParams));
  }

  if (BODY_METHODS.includes(method)) {
    handler = handler.use(requireBody()).use(jsonBodyParser());
  }

  return handler.use(httpErrorHandler());
}

export const dispatcher = new Dispatcher(middyAdapter)
  .post("/expenses", (e) => expenseController.create(e), {
    timeout: 10,
    description: "Create a new expense",
  })
  .get("/expenses", (e) => expenseController.list(e), {
    timeout: 5,
    description: "List all expenses for the authenticated user",
  })
  .get("/expenses/{id}", (e) => expenseController.getById(e), {
    timeout: 5,
    description: "Get expense by ID",
  })
  .patch("/expenses/{id}", (e) => expenseController.update(e), {
    timeout: 10,
    description: "Update an existing expense by ID",
  })
  .delete("/expenses/{id}", (e) => expenseController.delete(e), {
    timeout: 5,
    description: "Delete an expense by ID",
  })
  .get(
    "/metrics/dashboard-summary",
    (e) => metricsController.getDashboardSummary(e),
    {
      timeout: 10,
      description: "Get dashboard summary metrics for a given month period",
    },
  )
  .post("/incomes", (e) => incomeController.create(e), {
    timeout: 10,
    description: "Create a new income",
  })
  .get("/incomes", (e) => incomeController.list(e), {
    timeout: 5,
    description: "List all incomes for the authenticated user",
  });

export const handler: APIGatewayProxyHandler = (...args) =>
  dispatcher.getHandler()(...args);
