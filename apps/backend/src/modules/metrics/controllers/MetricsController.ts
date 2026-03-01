import { BadRequestError } from "@packages/lambda";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import z from "zod";

import { BaseController } from "@/modules/shared/controllers";

import { MetricsService } from "../services/MetricsService";

const dashboardSummaryQuerySchema = z.object({
  startDate: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "number" ? val : Number(val)))
    .refine((val) => Number.isFinite(val) && val > 0, {
      message: "startDate must be a positive number representing a timestamp",
    }),
  endDate: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "number" ? val : Number(val)))
    .refine((val) => Number.isFinite(val) && val > 0, {
      message: "endDate must be a positive number representing a timestamp",
    }),
});

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
    const [startDate, endDate] = this.retrieveFromQueryParams(queryParams!, [
      "startDate",
      "endDate",
    ]);

    const { error, data } = dashboardSummaryQuerySchema.safeParse({
      startDate,
      endDate,
    });
    if (error) throw new BadRequestError({ details: error.issues[0].message });

    const userId = context.authorizer?.claims["sub"];
    const summary = await this.props.metricsService.getDashboardSummary(
      userId,
      data,
    );

    return this.ok(summary);
  }

  async getDashboardChart(
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> {
    const { context } = this.retrieveRequestContext(event);

    const userId = context.authorizer?.claims["sub"];
    const chartData = await this.props.metricsService.getDashboardChart(userId);

    return this.ok(chartData);
  }
}
