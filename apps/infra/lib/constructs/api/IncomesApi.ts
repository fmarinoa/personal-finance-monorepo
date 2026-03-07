import type { RouteDefinition } from "@packages/lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

import { BaseRouteConstruct, type BaseRouteProps } from "./BaseRouteConstruct";

interface IncomesApiProps extends BaseRouteProps {
  routes: RouteDefinition[];
  table: dynamodb.Table;
}

export class IncomesApi extends BaseRouteConstruct {
  constructor(scope: Construct, id: string, props: IncomesApiProps) {
    super(scope, id, props);

    for (const route of props.routes) {
      const fn = this.createLambdaFunction(route, {
        INCOMES_TABLE_NAME: props.table.tableName,
      });
      props.table.grantReadWriteData(fn);
      this.registerRoute(route, fn);
    }
  }
}
