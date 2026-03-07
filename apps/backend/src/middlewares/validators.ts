import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

type MiddyRequest = {
  event: APIGatewayProxyEvent;
  response?: APIGatewayProxyResult;
};

export const requireBody = () => ({
  before: async (request: MiddyRequest) => {
    if (!request.event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body is required" }),
      };
    }
  },
});

export const requirePathParameters = (paramNames: string[]) => ({
  before: async (request: MiddyRequest) => {
    const missingParams: string[] = [];
    for (const name of paramNames) {
      const paramValue = request.event.pathParameters?.[name];
      if (!paramValue) {
        missingParams.push(name);
      }
    }
    if (missingParams.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required path parameter(s): ${missingParams.join(", ")}`,
        }),
      };
    }
  },
});

export const hasUserId = () => ({
  before: async (request: MiddyRequest) => {
    if (!request.event.requestContext.authorizer?.claims["sub"]) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }
  },
});
