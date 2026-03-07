import { BadRequestError } from "@packages/lambda";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { BaseController } from "@/modules/shared/controllers";
import { periodSchema } from "@/modules/shared/schemas";

import { MetricsService } from "../services/MetricsService";

interface MetricsControllerProps {
  metricsService: MetricsService;
}

export class MetricsController extends BaseController {
  constructor(private readonly props: MetricsControllerProps) {
    super();
  }

  async getDashboardSummary(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    const { context, queryParams } = this.retrieveRequestContext(event);
    const [startDate, endDate, onlyReceived] = this.retrieveFromQueryParams(
      queryParams!,
      ["startDate", "endDate", "onlyReceived"],
    );

    const { error, data } = periodSchema.safeParse({
      startDate,
      endDate,
    });
    if (error) throw new BadRequestError({ details: error.message });

    const userId = context.userId;
    const summary = await this.props.metricsService.getDashboardSummary(
      userId,
      { ...data, onlyReceived: onlyReceived === "true" },
    );

    return this.ok(summary);
  }

  async getDashboardChart(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    const { context, queryParams } = this.retrieveRequestContext(event);
    const [startDate, endDate, onlyReceived] = this.retrieveFromQueryParams(
      queryParams!,
      ["startDate", "endDate", "onlyReceived"],
    );

    const { error, data } = periodSchema.safeParse({
      startDate,
      endDate,
    });
    if (error) throw new BadRequestError({ details: error.message });

    const userId = context.userId;
    const chartData = await this.props.metricsService.getDashboardChart(
      userId,
      { ...data, onlyReceived: onlyReceived === "true" },
    );

    return this.ok(chartData);
  }

  async getDashboardCategoryBreakdown(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    const { context, queryParams } = this.retrieveRequestContext(event);
    const [startDate, endDate, onlyExpenses, onlyIncomes] =
      this.retrieveFromQueryParams(queryParams!, [
        "startDate",
        "endDate",
        "onlyExpenses",
        "onlyIncomes",
      ]);

    const isOnlyExpenses = onlyExpenses === "true";
    const isOnlyIncomes = onlyIncomes === "true";

    const { error, data } = periodSchema.safeParse({ startDate, endDate });
    if (error) throw new BadRequestError({ details: error.message });

    const userId = context.userId;
    const breakdown = await this.props.metricsService.getCategoryBreakdown(
      userId,
      { ...data, onlyExpenses: isOnlyExpenses, onlyIncomes: isOnlyIncomes },
    );

    return this.ok(breakdown);
  }
}
