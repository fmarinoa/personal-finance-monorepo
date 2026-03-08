import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

import { BaseTable, BaseTableProps } from "./BaseTable";

export class ExpensesTable extends BaseTable {
  public readonly table: dynamodb.Table;

  constructor(props: BaseTableProps) {
    super(props);

    this.table = this.createTable("Expenses");

    this.table.addGlobalSecondaryIndex({
      indexName: "userIdPaymentDateIndex",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "paymentDate", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
