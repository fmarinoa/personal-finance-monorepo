import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cdk from "aws-cdk-lib";
import * as path from "node:path";
import type { Dispatcher, RouteDefinition } from "@packages/lambda";

interface FinanceApiProps {
  stage: string;
  isProd: boolean;
  expensesTable: dynamodb.Table;
  authorizer: apigateway.CognitoUserPoolsAuthorizer;
}

export class FinanceApi extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: FinanceApiProps) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, "RestApi", {
      restApiName: `Finance API - ${props.stage.toUpperCase()}`,
      deployOptions: { stageName: props.stage.toLowerCase() },
    });

    this.registerRoutes(props);
  }

  private registerRoutes(props: FinanceApiProps): void {
    let dispatcher: Dispatcher;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require("@/handler/index.ts");
      dispatcher = module.dispatcher;

      if (!dispatcher) {
        throw new Error("dispatcher not exported from handler/index.ts");
      }
    } catch (error) {
      throw new Error(
        `Failed to load dispatcher: ${error instanceof Error ? error.message : error}`,
      );
    }

    const resourceCache = new Map<string, apigateway.IResource>();

    for (const route of dispatcher.routes) {
      const fn = this.createLambdaFunction(route, props);
      props.expensesTable.grantReadWriteData(fn);

      const resource = this.resolveApiResource(route.path, resourceCache);
      resource.addMethod(route.method, new apigateway.LambdaIntegration(fn), {
        authorizer: props.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });
    }
  }

  private createLambdaFunction(
    route: RouteDefinition,
    props: FinanceApiProps,
  ): lambdaNodejs.NodejsFunction {
    const kebabId = route.id.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

    return new lambdaNodejs.NodejsFunction(
      this,
      `${route.id}Lambda${props.stage}`,
      {
        functionName: `finance-${kebabId}-${props.stage.toLowerCase()}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, "../../../backend/src/handler/index.ts"),
        handler: "handler",
        description: route.description,
        environment: {
          EXPENSES_TABLE_NAME: props.expensesTable.tableName,
          NODE_ENV: props.isProd ? "production" : "development",
          ROUTE_ID: route.id,
        },
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
        },
      },
    );
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
}
