import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { BaseController } from "@/modules/shared/controllers";
import { User } from "@/modules/shared/domains";

import { Income } from "../domains";
import { IncomeService } from "../services/IncomeService";

interface IncomeControllerProps {
  incomeService: IncomeService;
}

export class IncomeController extends BaseController {
  constructor(private readonly props: IncomeControllerProps) {
    super();
  }

  async create(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { context, body } = this.retrieveRequestContext(event);
    const [amount, description, category, status, receivedDate, projectedDate] =
      this.retrieveFromBody(body!, [
        "amount",
        "description",
        "category",
        "status",
        "receivedDate",
        "projectedDate",
      ]);

    const incomeToCreate = Income.instanceForCreate({
      user: new User({ id: context.userId }),
      amount,
      description,
      category,
      status,
      projectedDate,
      receivedDate,
    });

    const response = await this.props.incomeService.create(incomeToCreate);
    return this.created(response);
  }

  async list(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { context, queryParams } = this.retrieveRequestContext(event);
    const [limit, page, startDate, endDate, onlyReceived] =
      this.retrieveFromQueryParams(queryParams!, [
        "limit",
        "page",
        "startDate",
        "endDate",
        "onlyReceived",
      ]);

    const user = new User({ id: context.userId });

    const { filters } = Income.validateFilters({
      limit,
      page,
      startDate,
      endDate,
    });

    const result = await this.props.incomeService.list(user, {
      ...filters,
      onlyReceived: onlyReceived === "true",
    });

    return this.ok(result);
  }

  async update(e: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { context, body, pathParams } = this.retrieveRequestContext(e);
    const [incomeId] = this.retrieveFromPathParameters(pathParams!, ["id"]);

    const [amount, description, category, status, receivedDate, projectedDate] =
      this.retrieveFromBody(body!, [
        "amount",
        "description",
        "category",
        "status",
        "receivedDate",
        "projectedDate",
      ]);

    const incomeToUpdate = Income.instanceForUpdate({
      user: new User({ id: context.userId }),
      id: incomeId,
      amount,
      description,
      category,
      status,
      projectedDate,
      receivedDate,
    });

    const response = await this.props.incomeService.update(incomeToUpdate);
    return this.ok(response);
  }
}
