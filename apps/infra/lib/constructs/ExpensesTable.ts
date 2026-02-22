import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cdk from "aws-cdk-lib";

interface ExpensesTableProps {
  stage: string;
  isProd: boolean;
}

export class ExpensesTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: ExpensesTableProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, "Table", {
      tableName: `Expenses${props.stage}`,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.isProd,
      },
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "userIdPaymentDateIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "paymentDate", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
