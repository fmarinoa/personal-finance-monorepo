import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { BaseController } from "./BaseController";
import { Expense } from "@/domains";
import { ExpenseService } from "@/services/ExpenseService";

interface ExpenseControllerProps {
    expenseService: ExpenseService;
}

/**
 * ExpenseController
 * Maneja todas las operaciones CRUD de gastos
 * Responsabilidades: Validación de input, transformación de responses, manejo de errores HTTP
 */
export class ExpenseController extends BaseController {
    constructor(private readonly props: ExpenseControllerProps) {
        super();
    }

    /**
     * POST /expenses
     * Crea un nuevo gasto
     */
    async create(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        try {
            const { userId, body } = this.getContext(event);
            const [amount, description, category] = this.retriveFromBody(body!, [
                "amount",
                "description",
                "category",
            ]);

            const expenseToCreate = Expense.instanceForCreate({
                amount,
                description,
                categoryCode: category?.code,
            });

            if (expenseToCreate instanceof Error) {
                return this.badRequest(`Validation error: ${expenseToCreate.message}`);
            }

            const response = await this.props.expenseService.create(
                userId,
                expenseToCreate,
            );
            return this.created(response);
        } catch (error) {
            console.error("Error creating expense:", error);
            return this.internalError("Failed to create expense");
        }
    }

    /**
     * GET /expenses
     * Lista gastos con paginación
     */
    async list(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        try {
            const { userId, queryParams } = this.getContext(event);
            const [limitStr, offsetStr] = this.retriveFromQueryParams(queryParams!, [
                "limit",
                "offset",
            ]);

            const limit = parseInt(limitStr || "20", 10);
            const offset = parseInt(offsetStr || "0", 10);

            if (limit < 1 || limit > 100) {
                return this.badRequest("Limit must be between 1 and 100");
            }

            if (offset < 0) {
                return this.badRequest("Offset must be non-negative");
            }

            const result = await this.props.expenseService.list(
                userId,
                limit,
                offset,
            );

            return this.ok(result);
        } catch (error) {
            console.error("Error listing expenses:", error);
            return this.internalError("Failed to list expenses");
        }
    }

    /**
     * PUT /expenses/{id}
     * Actualiza un gasto existente
     */
    async update(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        try {
            const { userId, pathParams, body } = this.getContext(event);
            const [amount, description, category] = this.retriveFromBody(body!, [
                "amount",
                "description",
                "category",
            ]);
            const [expenseId] = this.retriveFromPathParameters(pathParams!, ["id"]);

            const expenseToUpdate = Expense.instanceForUpdate({
                id: expenseId,
                amount,
                description,
                categoryCode: category?.code,
            });

            if (expenseToUpdate instanceof Error) {
                return this.badRequest(`Validation error: ${expenseToUpdate.message}`);
            }

            const expense = await this.props.expenseService.update(
                userId,
                expenseToUpdate,
            );

            if (!expense) {
                return this.notFound("Expense not found");
            }

            return this.ok(expense);
        } catch (error) {
            console.error("Error updating expense:", error);
            return this.internalError("Failed to update expense");
        }
    }

    /**
     * DELETE /expenses/{id}
     * Elimina un gasto
     */
    async delete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        try {
            const { userId, pathParams } = this.getContext(event);
            const [expenseId] = this.retriveFromPathParameters(pathParams!, ["id"]);

            const deleted = await this.props.expenseService.delete(userId,expenseId);

            if (!deleted) {
                return this.notFound("Expense not found");
            }

            return this.noContent();
        } catch (error) {
            console.error("Error deleting expense:", error);
            return this.internalError("Failed to delete expense");
        }
    }
}
