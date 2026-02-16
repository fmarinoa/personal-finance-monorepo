import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

/**
 * MetricsController
 * Maneja endpoints de analytics y reportes
 * Responsabilidades: Validación de parámetros, transformación de datos agregados, responses
 */
export class MetricsController {
  /**
   * GET /metrics/expenses-by-month?year=2026
   * Obtiene gastos totales agrupados por mes
   */
  async getExpensesByMonth(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    try {
      const userId = this.getUserId(event);
      if (!userId) {
        return this.unauthorized("User not authenticated");
      }

      // Validar parámetro year
      const yearParam = event.queryStringParameters?.year;
      if (!yearParam) {
        return this.badRequest("Year parameter is required");
      }

      const year = parseInt(yearParam, 10);
      if (isNaN(year) || year < 2000 || year > 2100) {
        return this.badRequest(
          "Year must be a valid year between 2000 and 2100",
        );
      }

      // TODO: Llamar a repository/service para obtener datos agregados
      // const data = await metricsService.getExpensesByMonth(userId, year);

      // Mock response
      const mockData = {
        year,
        data: [
          { month: `${year}-01`, total: 1250.0 },
          { month: `${year}-02`, total: 840.2 },
        ],
      };

      return this.ok(mockData);
    } catch (error) {
      console.error("Error getting expenses by month:", error);
      return this.internalError("Failed to get expenses by month");
    }
  }

  /**
   * GET /metrics/income-by-month?year=2026
   * Obtiene ingresos totales agrupados por mes
   */
  async getIncomeByMonth(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    try {
      const userId = this.getUserId(event);
      if (!userId) {
        return this.unauthorized("User not authenticated");
      }

      const yearParam = event.queryStringParameters?.year;
      if (!yearParam) {
        return this.badRequest("Year parameter is required");
      }

      const year = parseInt(yearParam, 10);
      if (isNaN(year) || year < 2000 || year > 2100) {
        return this.badRequest(
          "Year must be a valid year between 2000 and 2100",
        );
      }

      // TODO: Implementar service/repository
      const mockData = {
        year,
        data: [
          { month: `${year}-01`, total: 3000.0 },
          { month: `${year}-02`, total: 3200.0 },
        ],
      };

      return this.ok(mockData);
    } catch (error) {
      console.error("Error getting income by month:", error);
      return this.internalError("Failed to get income by month");
    }
  }

  /**
   * GET /metrics/balance?year=2026
   * Obtiene balance mensual (ingresos - gastos)
   */
  async getMonthlyBalance(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    try {
      const userId = this.getUserId(event);
      if (!userId) {
        return this.unauthorized("User not authenticated");
      }

      const yearParam = event.queryStringParameters?.year;
      if (!yearParam) {
        return this.badRequest("Year parameter is required");
      }

      const year = parseInt(yearParam, 10);
      if (isNaN(year) || year < 2000 || year > 2100) {
        return this.badRequest(
          "Year must be a valid year between 2000 and 2100",
        );
      }

      // TODO: Implementar lógica que combine expenses e income
      // const balance = await metricsService.getMonthlyBalance(userId, year);

      const mockData = {
        year,
        data: [
          {
            month: `${year}-01`,
            income: 3000.0,
            expenses: 1250.0,
            balance: 1750.0,
          },
          {
            month: `${year}-02`,
            income: 3200.0,
            expenses: 840.2,
            balance: 2359.8,
          },
        ],
      };

      return this.ok(mockData);
    } catch (error) {
      console.error("Error getting monthly balance:", error);
      return this.internalError("Failed to get monthly balance");
    }
  }

  /**
   * GET /metrics/expenses-by-category?year=2026&month=1
   * Obtiene gastos agrupados por categoría
   */
  async getExpensesByCategory(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    try {
      const userId = this.getUserId(event);
      if (!userId) {
        return this.unauthorized("User not authenticated");
      }

      const yearParam = event.queryStringParameters?.year;
      const monthParam = event.queryStringParameters?.month;

      if (!yearParam) {
        return this.badRequest("Year parameter is required");
      }

      const year = parseInt(yearParam, 10);
      if (isNaN(year) || year < 2000 || year > 2100) {
        return this.badRequest("Year must be valid");
      }

      let month: number | undefined;
      if (monthParam) {
        month = parseInt(monthParam, 10);
        if (isNaN(month) || month < 1 || month > 12) {
          return this.badRequest("Month must be between 1 and 12");
        }
      }

      // TODO: Implementar service/repository
      const mockData = {
        year,
        month: month || null,
        data: [
          { categoryCode: "food", categoryName: "Alimentación", total: 450.0 },
          {
            categoryCode: "transport",
            categoryName: "Transporte",
            total: 200.0,
          },
          {
            categoryCode: "entertainment",
            categoryName: "Entretenimiento",
            total: 190.2,
          },
        ],
      };

      return this.ok(mockData);
    } catch (error) {
      console.error("Error getting expenses by category:", error);
      return this.internalError("Failed to get expenses by category");
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

export const metricsController = new MetricsController();
