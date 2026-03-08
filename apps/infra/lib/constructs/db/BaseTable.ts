import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface BaseTableProps {
  scope: Construct;
  id: string;
  stage: string;
  isProd: boolean;
}

export abstract class BaseTable extends Construct {
  constructor(private readonly props: BaseTableProps) {
    super(props.scope, props.id);
  }

  protected createTable(name: string): dynamodb.Table {
    return new dynamodb.Table(this, "Table", {
      tableName: `${name}${this.props.stage}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: this.props.isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: this.props.isProd,
      },
    });
  }
}
