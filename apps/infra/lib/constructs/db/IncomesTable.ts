import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

import { BaseTable, BaseTableProps } from "./BaseTable";

export class IncomesTable extends BaseTable {
  public readonly table: dynamodb.Table;

  constructor(props: BaseTableProps) {
    super(props);

    this.table = this.createTable("Incomes");

    this.table.addGlobalSecondaryIndex({
      indexName: "userIdEffectiveDateIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "effectiveDate", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "userIdStatusIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "status", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
