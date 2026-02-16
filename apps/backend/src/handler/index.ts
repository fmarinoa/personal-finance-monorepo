import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import { expenseController } from "@/controllers";
import { requireBody } from "@/middlewares";

export interface LambdaConfig {
  handler: APIGatewayProxyHandler;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  timeout?: number;
  memorySize?: number;
}

export const lambdas: Record<string, LambdaConfig> = {
  createExpense: {
    handler: middy((event: APIGatewayProxyEvent) =>
      expenseController.create(event),
    )
      .use(requireBody())
      .use(jsonBodyParser())
      .use(httpErrorHandler()),
    method: "POST",
    path: "expenses",
    timeout: 10,
  },

  listExpenses: {
    handler: (event) => expenseController.list(event),
    method: "GET",
    path: "expenses",
    timeout: 5,
  },

  updateExpense: {
    handler: middy((event: APIGatewayProxyEvent) =>
      expenseController.update(event),
    )
      .use(requireBody())
      .use(jsonBodyParser())
      .use(httpErrorHandler()),
    method: "PUT",
    path: "expenses/{id}",
    timeout: 10,
  },

  deleteExpense: {
    handler: (event) => expenseController.delete(event),
    method: "DELETE",
    path: "expenses/{id}",
    timeout: 5,
  },

  //   getExpensesByMonth: {
  //     handler: (event) => metricsController.getExpensesByMonth(event),
  //     method: "GET",
  //     path: "metrics/expenses-by-month",
  //     timeout: 15,
  //     memorySize: 512,
  //   },
};
