import { BadRequestError } from "@packages/lambda";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DateTime } from "luxon";
import z from "zod";

import { BaseController } from "@/modules/shared/controllers";

import { MetricsService } from "../services/MetricsService";

const dashboardSummaryQuerySchema = z.object({
  period: z
    .string()
    .optional()
    .transform((val) => val || DateTime.now().toFormat("yyyy-MM"))
    .pipe(
      z.string().regex(/^\d{4}-\d{2}$/, "period must be in YYYY-MM format"),
    ),
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
    const [period] = this.retrieveFromQueryParams(queryParams!, ["period"]);

    const { error, data } = dashboardSummaryQuerySchema.safeParse({ period });
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
