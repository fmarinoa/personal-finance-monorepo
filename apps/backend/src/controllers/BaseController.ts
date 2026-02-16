import {
    APIGatewayProxyEvent,
    APIGatewayProxyEventPathParameters,
    APIGatewayProxyEventQueryStringParameters,
    APIGatewayProxyResult,
} from "aws-lambda";

export abstract class BaseController {
    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Extracts the user context from an API Gateway event.
     * @param event - The API Gateway proxy event containing request context and body
     * @returns An object containing the authenticated user's ID and the parsed request body
     * @throws {Error} If the user is not authenticated (no sub claim in authorizer)
     */
    protected getContext(event: APIGatewayProxyEvent, opts?: { validateExistUser: boolean }): {
        userId: string;
        pathParams: APIGatewayProxyEventPathParameters | null;
        queryParams: APIGatewayProxyEventQueryStringParameters | null;
        body: Record<string, any> | null;
    } {
        const userId = event.requestContext.authorizer?.claims?.sub;
        if (opts?.validateExistUser && !userId) {
            throw new Error("User not authenticated");
        }
        const body = event.body as unknown as Record<string, any>;
        return {
            userId,
            pathParams: event.pathParameters,
            queryParams: event.queryStringParameters,
            body
        };
    }

    /**
     * Extrae valores del body parseado por los middlewares
     * @param event - API Gateway event con body ya parseado
     * @param keys - Claves a extraer del body
     * @returns Array de valores en el mismo orden que las claves
     */
    protected retriveFromBody(body: Record<string, any>, keys: string[]): any[] {
        return keys.map((key) => body[key]);
    }

    protected retriveFromPathParameters(
        pathParameters: APIGatewayProxyEventPathParameters,
        keys: string[],
    ): any[] {
        let result: any[] = [];
        keys.forEach((key) => {
            const value = pathParameters[key];
            if (value === undefined) {
                throw new Error(`Missing path parameter: ${key}`);
            }
            result.push(value);
        });
        return result;
    }

    protected retriveFromQueryParams(
        queryParams: APIGatewayProxyEventQueryStringParameters,
        keys: string[],
    ): any[] {
        return keys.map((key) => queryParams[key]);
    }

    /**
     * Response helpers
     */
    protected ok(data: any): APIGatewayProxyResult {
        return {
            statusCode: 200,
            headers: this.corsHeaders(),
            body: JSON.stringify(data),
        };
    }

    protected created(data: any): APIGatewayProxyResult {
        return {
            statusCode: 201,
            headers: this.corsHeaders(),
            body: JSON.stringify(data),
        };
    }

    protected noContent(): APIGatewayProxyResult {
        return {
            statusCode: 204,
            headers: this.corsHeaders(),
            body: "",
        };
    }

    protected badRequest(message: string): APIGatewayProxyResult {
        return {
            statusCode: 400,
            headers: this.corsHeaders(),
            body: JSON.stringify({ error: message }),
        };
    }

    protected unauthorized(message: string): APIGatewayProxyResult {
        return {
            statusCode: 401,
            headers: this.corsHeaders(),
            body: JSON.stringify({ error: message }),
        };
    }

    protected notFound(message: string): APIGatewayProxyResult {
        return {
            statusCode: 404,
            headers: this.corsHeaders(),
            body: JSON.stringify({ error: message }),
        };
    }

    protected internalError(message: string): APIGatewayProxyResult {
        return {
            statusCode: 500,
            headers: this.corsHeaders(),
            body: JSON.stringify({ error: message }),
        };
    }

    protected corsHeaders() {
        return {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-User-Id",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        };
    }
}
