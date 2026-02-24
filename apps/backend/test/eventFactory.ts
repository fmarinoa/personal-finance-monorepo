import type { APIGatewayProxyEvent } from "aws-lambda";

export function buildEvent(
  overrides: Partial<APIGatewayProxyEvent> = {},
): APIGatewayProxyEvent {
  return {
    requestContext: {
      authorizer: { claims: { sub: "user-123" } },
    } as any,
    body: null,
    queryStringParameters: null,
    pathParameters: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: "GET",
    isBase64Encoded: false,
    path: "/expenses",
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: "/expenses",
    ...overrides,
  } as APIGatewayProxyEvent;
}

export const TEST_USER_ID = "user-123";
