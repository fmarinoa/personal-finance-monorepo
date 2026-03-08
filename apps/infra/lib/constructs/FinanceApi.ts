import type { Dispatcher } from "@packages/lambda";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

import { ExpensesApi } from "./api/ExpensesApi";
import { IncomesApi } from "./api/IncomesApi";
import { MetricsApi } from "./api/MetricsApi";

interface FinanceApiProps {
  stage: string;
  isProd: boolean;
  tables: {
    expenses: dynamodb.Table;
    incomes: dynamodb.Table;
  };
  buckets: {
    expensesAttachments: s3.Bucket;
    incomesAttachments: s3.Bucket;
  };
  authorizer: apigateway.CognitoUserPoolsAuthorizer;
}

export class FinanceApi extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: FinanceApiProps) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, "RestApi", {
      restApiName: `Finance API - ${props.stage.toUpperCase()}`,
      deployOptions: { stageName: props.stage.toLowerCase() },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
        maxAge: cdk.Duration.hours(1),
      },
    });

    const dispatcher = this.loadDispatcher();

    const baseProps = {
      api: this.api,
      authorizer: props.authorizer,
      stage: props.stage,
      isProd: props.isProd,
    };

    new ExpensesApi(this, "ExpensesApi", {
      ...baseProps,
      routes: dispatcher.routes.filter((r) => r.path.startsWith("/expenses")),
      table: props.tables.expenses,
      attachmentsBucket: props.buckets.expensesAttachments,
    });

    new IncomesApi(this, "IncomesApi", {
      ...baseProps,
      routes: dispatcher.routes.filter((r) => r.path.startsWith("/incomes")),
      table: props.tables.incomes,
      attachmentsBucket: props.buckets.incomesAttachments,
    });

    new MetricsApi(this, "MetricsApi", {
      ...baseProps,
      routes: dispatcher.routes.filter((r) => r.path.startsWith("/metrics")),
      tables: props.tables,
    });
  }

  private loadDispatcher(): Dispatcher {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require("@/handler/index.ts");
      const dispatcher = module.dispatcher;

      if (!dispatcher) {
        throw new Error("dispatcher not exported from handler/index.ts");
      }

      return dispatcher;
    } catch (error) {
      throw new Error(
        `Failed to load dispatcher: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
