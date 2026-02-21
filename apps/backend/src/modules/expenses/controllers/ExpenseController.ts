import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { BaseController } from "@/modules/shared/controllers";
import { User } from "@/modules/shared/domains";
import { Expense } from "../domains";
import { ExpenseService } from "../services/ExpenseService";
import { NotFoundError } from "@packages/lambda";

interface ExpenseControllerProps {
  expenseService: ExpenseService;
}

export class ExpenseController extends BaseController {
  constructor(private readonly props: ExpenseControllerProps) {
    super();
  }

  async create(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { context, body } = this.retrieveRequestContext(event);
    const [amount, description, category, paymentMethod, paymentDate] =
      this.retrieveFromBody(body!, [
        "amount",
        "description",
        "category",
        "paymentMethod",
        "paymentDate",
      ]);

    const expenseToCreate = Expense.instanceForCreate({
      user: new User({ id: context.authorizer?.claims["sub"] }),
      amount,
      description,
      paymentMethod,
      paymentDate,
      category,
    });

    const response = await this.props.expenseService.create(expenseToCreate);
    return this.created(response);
  }

  async list(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { context, queryParams } = this.retrieveRequestContext(event);
    const [limit, nextToken, startDate, endDate] = this.retrieveFromQueryParams(
      queryParams!,
      ["limit", "nextToken", "startDate", "endDate"],
    );

    const user = new User({ id: context.authorizer?.claims["sub"] });

    const { filters } = Expense.validateFilters({
      limit,
      nextToken,
      startDate,
      endDate,
    });

    const result = await this.props.expenseService.list(user, filters);

    return this.ok(result);
  }

  async getById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { context, pathParams } = this.retrieveRequestContext(event);
    const [expenseId] = this.retrieveFromPathParameters(pathParams!, ["id"]);

    const expense = new Expense({
      user: new User({ id: context.authorizer?.claims["sub"] }),
      id: expenseId,
    });

    const response = await this.props.expenseService.getById(expense);

    return this.ok(response);
  }

  async update(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { context, pathParams, body } = this.retrieveRequestContext(event);
    const [amount, description, category, paymentMethod, paymentDate] =
      this.retrieveFromBody(body!, [
        "amount",
        "description",
        "category",
        "paymentMethod",
        "paymentDate",
      ]);
    const [expenseId] = this.retrieveFromPathParameters(pathParams!, ["id"]);

    const expense = Expense.instanceForUpdate({
      user: new User({ id: context.authorizer?.claims["sub"] }),
      id: expenseId,
      amount,
      description,
      category,
      paymentMethod,
      paymentDate,
    });

    const response = await this.props.expenseService.update(expense);

    return this.ok(response);
  }

  async delete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { context, pathParams, body } = this.retrieveRequestContext(event);
    const [expenseId] = this.retrieveFromPathParameters(pathParams!, ["id"]);
    const [reason] = this.retrieveFromBody(body!, ["reason"]);

    const expense = new Expense({
      user: new User({ id: context.authorizer?.claims["sub"] }),
      id: expenseId,
      onDelete: { reason },
    });

    const deleted = await this.props.expenseService.delete(expense);

    if (!deleted) throw new NotFoundError({ details: "Expense not found" });

    return this.noContent();
  }
}
