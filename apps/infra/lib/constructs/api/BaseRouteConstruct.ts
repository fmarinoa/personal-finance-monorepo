import * as path from "node:path";

import type { RouteDefinition } from "@packages/lambda";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export interface BaseRouteProps {
  api: apigateway.RestApi;
  authorizer: apigateway.CognitoUserPoolsAuthorizer;
  stage: string;
  isProd: boolean;
}

export abstract class BaseRouteConstruct extends Construct {
  protected readonly api: apigateway.RestApi;
  protected readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;
  protected readonly stage: string;
  protected readonly isProd: boolean;

  private readonly resourceCache = new Map<string, apigateway.IResource>();

  constructor(scope: Construct, id: string, props: BaseRouteProps) {
    super(scope, id);
    this.api = props.api;
    this.authorizer = props.authorizer;
    this.stage = props.stage;
    this.isProd = props.isProd;
  }

  protected createLambdaFunction(
    route: RouteDefinition,
    environment: Record<string, string>,
  ): lambdaNodejs.NodejsFunction {
    const kebabId = route.id.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

    return new lambdaNodejs.NodejsFunction(
      this,
      `${route.id}Lambda${this.stage}`,
      {
        functionName: `finance-${kebabId}-${this.stage.toLowerCase()}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(__dirname, "../../../../backend/src/handler/index.ts"),
        handler: "handler",
        description: route.description,
        environment: {
          NODE_ENV: this.isProd ? "production" : "development",
          ROUTE_ID: route.id,
          ...environment,
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

  protected registerRoute(
    route: RouteDefinition,
    fn: lambdaNodejs.NodejsFunction,
  ): void {
    const resource = this.resolveApiResource(route.path);
    resource.addMethod(
      route.method,
      new apigateway.LambdaIntegration(fn, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      },
    );
  }

  private resolveApiResource(routePath: string): apigateway.IResource {
    let current: apigateway.IResource = this.api.root;

    for (const part of routePath.replace(/^\//, "").split("/")) {
      const key = `${current.path}/${part}`;
      if (!this.resourceCache.has(key)) {
        this.resourceCache.set(key, current.addResource(part));
      }
      current = this.resourceCache.get(key)!;
    }

    return current;
  }
}
