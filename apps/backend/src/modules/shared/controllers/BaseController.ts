import {
  APIGatewayEventRequestContext,
  APIGatewayProxyEvent,
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyResult,
} from "aws-lambda";

export abstract class BaseController {
  protected retrieveRequestContext(event: APIGatewayProxyEvent): {
    context: APIGatewayEventRequestContext;
    pathParams: APIGatewayProxyEventPathParameters | null;
    queryParams: APIGatewayProxyEventQueryStringParameters | null;
    body: Record<string, any> | null;
  } {
    return {
      context: event.requestContext,
      pathParams: event.pathParameters,
      queryParams: event.queryStringParameters ?? {},
      body: event.body as unknown as Record<string, any>,
    };
  }

  protected retrieveFromBody(body: Record<string, any>, keys: string[]): any[] {
    return keys.map((key) => body[key]);
  }

  protected retrieveFromPathParameters(
    pathParameters: APIGatewayProxyEventPathParameters,
    keys: string[],
  ): any[] {
    return keys.map((key) => {
      const value = pathParameters[key];
      if (value === undefined)
        throw new Error(`Missing path parameter: ${key}`);
      return value;
    });
  }

  protected retrieveFromQueryParams(
    queryParams: APIGatewayProxyEventQueryStringParameters,
    keys: string[],
  ): any[] {
    return keys.map((key) => queryParams[key]);
  }

  // ── Success responses ─────────────────────────────────────────────────────

  protected ok(data: unknown): APIGatewayProxyResult {
    return {
      statusCode: 200,
      headers: this.corsHeaders(),
      body: JSON.stringify(data),
    };
  }

  protected created(data: unknown): APIGatewayProxyResult {
    return {
      statusCode: 201,
      headers: this.corsHeaders(),
      body: JSON.stringify(data),
    };
  }

  protected noContent(): APIGatewayProxyResult {
    return { statusCode: 204, headers: this.corsHeaders(), body: "" };
  }

  // ── Headers ───────────────────────────────────────────────────────────────

  private corsHeaders() {
    return {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,X-User-Id",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    };
  }
}
