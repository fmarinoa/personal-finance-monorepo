import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const requireBody = () => ({
  before: async (request: {
    event: APIGatewayProxyEvent;
    response?: APIGatewayProxyResult;
  }) => {
    if (!request.event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body is required" }),
      };
    }
  },
});

export const requirePathParameters = (paramName: string[]) => ({
  before: async (request: {
    event: APIGatewayProxyEvent;
    response?: APIGatewayProxyResult;
  }) => {
    let missingParams: string[] = [];
    for (const name of paramName) {
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
