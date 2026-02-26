import * as path from "node:path";

import type { Dispatcher, RouteDefinition } from "@packages/lambda";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

interface BackendStackProps extends cdk.StackProps {
  stage: string;
}

/**
 * @deprecated This stack is deprecated and will be removed in favor of a more modular approach using constructs. Please refer to `BackendStack.ts` for the new implementation.
 */
export class BackendStack extends cdk.Stack {
  private readonly stage: string;
  private readonly isProd: boolean;
  private readonly api: apigateway.RestApi;
  private readonly expensesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    this.stage = props.stage;
    this.isProd = props.stage === "Prod";

    this.expensesTable = this.createExpensesTable();
    this.api = this.createApi();

    this.registerRoutes();
    this.createOutputs();
  }

  // ── Tables ────────────────────────────────────────────────────────────────

  private createExpensesTable(): dynamodb.Table {
    const table = new dynamodb.Table(this, `Expenses${this.stage}`, {
      tableName: `Expenses${this.stage}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: this.isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: this.isProd,
    });

    table.addGlobalSecondaryIndex({
      indexName: "userIdCreationDateIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "creationDate", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    return table;
  }

  // ── API Gateway ───────────────────────────────────────────────────────────

  private createApi(): apigateway.RestApi {
    return new apigateway.RestApi(this, `FinanceApi${this.stage}`, {
      restApiName: `Finance API - ${this.stage.toUpperCase()}`,
      deployOptions: { stageName: this.stage.toLocaleLowerCase() },
    });
  }

  // ── Route Registration ────────────────────────────────────────────────────

  private getEnvironmentVariables(): Record<string, string> {
    return {
      EXPENSES_TABLE_NAME: this.expensesTable.tableName,
      NODE_ENV: this.isProd ? "production" : "development",
    };
  }

  private registerRoutes(): void {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { dispatcher } = require("../../backend/src/handler/index.ts") as {
      dispatcher: Dispatcher;
    };
    const resourceCache = new Map<string, apigateway.IResource>();

    for (const route of dispatcher.routes) {
      const fn = this.createLambdaFunction(route);
      this.grantTableAccess(fn);

      const resource = this.resolveApiResource(route.path, resourceCache);
      resource.addMethod(route.method, new apigateway.LambdaIntegration(fn));
    }
  }

  private createLambdaFunction(
    route: RouteDefinition,
  ): lambdaNodejs.NodejsFunction {
    const kebabId = route.id.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

    return new lambdaNodejs.NodejsFunction(
      this,
      `${route.id}Lambda${this.stage}`, // ID de CloudFormation
      {
        functionName: `finance-${kebabId}-${this.stage.toLowerCase()}`, // ✅ Nombre visible
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, "../../backend/src/handler/index.ts"),
        handler: "handler",
        description: route.description,
        environment: this.getEnvironmentVariables(),
        timeout: cdk.Duration.seconds(route.timeout ?? 10),
        memorySize: route.memorySize ?? 1024,
        bundling: {
          minify: true,
          sourceMap: true,
          target: "es2022",
          format: lambdaNodejs.OutputFormat.CJS,
          mainFields: ["module", "main"],
          externalModules: ["@aws-sdk/*"],
          forceDockerBundling: false,
          banner: `const { dispatcher } = require('./index'); exports.handler = dispatcher.routes.find(r => r.id === '${route.id}').handler;`,
        },
      },
    );
  }

  private grantTableAccess(fn: lambdaNodejs.NodejsFunction): void {
    this.expensesTable.grantReadWriteData(fn);
  }

  private resolveApiResource(
    routePath: string,
    cache: Map<string, apigateway.IResource>,
  ): apigateway.IResource {
    let current: apigateway.IResource = this.api.root;

    for (const part of routePath.replace(/^\//, "").split("/")) {
      const key = `${current.path}/${part}`;
      if (!cache.has(key)) {
        cache.set(key, current.addResource(part));
      }
      current = cache.get(key)!;
    }

    return current;
  }

  // ── Outputs ───────────────────────────────────────────────────────────────

  private createOutputs(): void {
    new cdk.CfnOutput(this, "ApiUrl", {
      description: "API Gateway endpoint URL",
      exportName: `FinanceApiUrl-${this.stage}`,
      value: this.api.url,
    });

    new cdk.CfnOutput(this, "ApiId", {
      description: "API Gateway ID (for custom domains)",
      value: this.api.restApiId,
    });

    new cdk.CfnOutput(this, "ExpensesTableName", {
      description: "DynamoDB table name for expenses",
      exportName: `ExpensesTableName-${this.stage}`,
      value: this.expensesTable.tableName,
    });

    new cdk.CfnOutput(this, "Region", {
      description: "AWS Region where resources are deployed",
      value: this.region,
    });
  }
}
