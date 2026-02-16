import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

/**
 * IncomeController
 * Maneja todas las operaciones CRUD de ingresos
 * Responsabilidades: Validación de input, transformación de responses, manejo de errores HTTP
 */
export class IncomeController {
  /**
   * POST /income
   * Crea un nuevo ingreso
   */
  async create(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      if (!event.body) {
        return this.badRequest("Request body is required");
      }

      const body = JSON.parse(event.body);
      const { amount, description, source } = body;

      // Validaciones
      if (!amount || amount <= 0) {
        return this.badRequest("Amount must be greater than 0");
      }

      if (!description || description.trim().length === 0) {
        return this.badRequest("Description is required");
      }

      const userId = this.getUserId(event);
      if (!userId) {
        return this.unauthorized("User not authenticated");
      }

      // TODO: Implementar service/repository
      const mockIncome = {
        id: "income-uuid",
        userId,
        amount,
        description,
        source: source || null,
        createdAt: new Date().toISOString(),
      };

      return this.created(mockIncome);
    } catch (error) {
      console.error("Error creating income:", error);
      return this.internalError("Failed to create income");
    }
  }

  /**
   * GET /income
   * Lista ingresos con paginación
   */
  async list(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const userId = this.getUserId(event);
      if (!userId) {
        return this.unauthorized("User not authenticated");
      }

      const limit = parseInt(event.queryStringParameters?.limit || "20", 10);
      const offset = parseInt(event.queryStringParameters?.offset || "0", 10);

      if (limit < 1 || limit > 100) {
        return this.badRequest("Limit must be between 1 and 100");
      }

      if (offset < 0) {
        return this.badRequest("Offset must be non-negative");
      }

      // TODO: Implementar service/repository
      const mockResponse = {
        items: [],
        pagination: { limit, offset, total: 0 },
      };

      return this.ok(mockResponse);
    } catch (error) {
      console.error("Error listing income:", error);
      return this.internalError("Failed to list income");
    }
  }

  /**
   * PUT /income/{id}
   * Actualiza un ingreso existente
   */
  async update(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const incomeId = event.pathParameters?.id;
      if (!incomeId) {
        return this.badRequest("Income ID is required");
      }

      if (!event.body) {
        return this.badRequest("Request body is required");
      }

      const body = JSON.parse(event.body);
      const { amount, description, source } = body;

      if (amount === undefined && !description && source === undefined) {
        return this.badRequest("At least one field must be provided");
      }

      if (amount !== undefined && amount <= 0) {
        return this.badRequest("Amount must be greater than 0");
      }

      const userId = this.getUserId(event);
      if (!userId) {
        return this.unauthorized("User not authenticated");
      }

      // TODO: Implementar service/repository
      const mockIncome = {
        id: incomeId,
        userId,
        amount: amount || 1000,
        description: description || "Updated income",
        source: source || null,
        updatedAt: new Date().toISOString(),
      };

      return this.ok(mockIncome);
    } catch (error) {
      console.error("Error updating income:", error);
      return this.internalError("Failed to update income");
    }
  }

  /**
   * DELETE /income/{id}
   * Elimina un ingreso
   */
  async delete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const incomeId = event.pathParameters?.id;
      if (!incomeId) {
        return this.badRequest("Income ID is required");
      }

      const userId = this.getUserId(event);
      if (!userId) {
        return this.unauthorized("User not authenticated");
      }

      // TODO: Implementar service/repository
      return this.noContent();
    } catch (error) {
      console.error("Error deleting income:", error);
      return this.internalError("Failed to delete income");
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getUserId(event: APIGatewayProxyEvent): string | null {
    return event.headers["x-user-id"] || "mock-user-123";
  }

  private ok(data: any): APIGatewayProxyResult {
    return {
      statusCode: 200,
      headers: this.corsHeaders(),
      body: JSON.stringify(data),
    };
  }

  private created(data: any): APIGatewayProxyResult {
    return {
      statusCode: 201,
      headers: this.corsHeaders(),
      body: JSON.stringify(data),
    };
  }

  private noContent(): APIGatewayProxyResult {
    return {
      statusCode: 204,
      headers: this.corsHeaders(),
      body: "",
    };
  }

  private badRequest(message: string): APIGatewayProxyResult {
    return {
      statusCode: 400,
      headers: this.corsHeaders(),
      body: JSON.stringify({ error: message }),
    };
  }

  private unauthorized(message: string): APIGatewayProxyResult {
    return {
      statusCode: 401,
      headers: this.corsHeaders(),
      body: JSON.stringify({ error: message }),
    };
  }

  private internalError(message: string): APIGatewayProxyResult {
    return {
      statusCode: 500,
      headers: this.corsHeaders(),
      body: JSON.stringify({ error: message }),
    };
  }

  private corsHeaders() {
    return {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,X-User-Id",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    };
  }
}

export const incomeController = new IncomeController();
