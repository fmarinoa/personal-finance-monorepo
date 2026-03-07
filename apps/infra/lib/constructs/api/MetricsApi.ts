import type { RouteDefinition } from "@packages/lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

import { BaseRouteConstruct, type BaseRouteProps } from "./BaseRouteConstruct";

interface MetricsApiProps extends BaseRouteProps {
  routes: RouteDefinition[];
  tables: {
    expenses: dynamodb.Table;
    incomes: dynamodb.Table;
  };
}

export class MetricsApi extends BaseRouteConstruct {
  constructor(scope: Construct, id: string, props: MetricsApiProps) {
    super(scope, id, props);

    for (const route of props.routes) {
      const fn = this.createLambdaFunction(route, {
        EXPENSES_TABLE_NAME: props.tables.expenses.tableName,
        INCOMES_TABLE_NAME: props.tables.incomes.tableName,
      });
      props.tables.expenses.grantReadData(fn);
      props.tables.incomes.grantReadData(fn);
      this.registerRoute(route, fn);
    }
  }
}
