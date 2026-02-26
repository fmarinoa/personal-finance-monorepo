import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface IncomesTableProps {
  stage: string;
  isProd: boolean;
}

export class IncomesTable extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: IncomesTableProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, "Table", {
      tableName: `Incomes${props.stage}`,
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
      indexName: "userIdEffectiveDateIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "effectiveDate", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
