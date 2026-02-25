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
      user: new User({ id: context.authorizer?.claims["sub"] }),
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
}
