import type { RouteDefinition } from "@packages/lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

import { BaseRouteConstruct, type BaseRouteProps } from "./BaseRouteConstruct";

interface ExpensesApiProps extends BaseRouteProps {
  routes: RouteDefinition[];
  table: dynamodb.Table;
  attachmentsBucket: s3.Bucket;
}

export class ExpensesApi extends BaseRouteConstruct {
  constructor(scope: Construct, id: string, props: ExpensesApiProps) {
    super(scope, id, props);

    for (const route of props.routes) {
      const fn = this.createLambdaFunction(route, {
        EXPENSES_TABLE_NAME: props.table.tableName,
        EXPENSES_ATTACHMENTS_BUCKET_NAME: props.attachmentsBucket.bucketName,
      });
      props.table.grantReadWriteData(fn);

      if (route.path.includes("attachment")) {
        props.attachmentsBucket.grantReadWrite(fn);
      }

      this.registerRoute(route, fn);
    }
  }
}
