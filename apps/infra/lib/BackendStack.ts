import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ExpensesTable } from "./constructs/ExpensesTable";
import { FinanceApi } from "./constructs/FinanceApi";

interface BackendStackProps extends cdk.StackProps {
  stage: string;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { stage } = props;
    const isProd = stage === "Prod";

    // Create resources
    const expensesTable = new ExpensesTable(this, "ExpensesTable", {
      stage,
      isProd,
    });

    const api = new FinanceApi(this, "FinanceApi", {
      stage,
      isProd,
      expensesTable: expensesTable.table,
    });

    // Outputs
    if (isProd) return;

    new cdk.CfnOutput(this, "ApiUrl", {
      description: "API Gateway endpoint URL",
      exportName: `FinanceApiUrl-${stage}`,
      value: api.api.url,
    });

    new cdk.CfnOutput(this, "ApiId", {
      description: "API Gateway ID (for custom domains)",
      value: api.api.restApiId,
    });

    new cdk.CfnOutput(this, "ExpensesTableName", {
      description: "DynamoDB table name for expenses",
      exportName: `ExpensesTableName-${stage}`,
      value: expensesTable.table.tableName,
    });

    new cdk.CfnOutput(this, "Region", {
      description: "AWS Region where resources are deployed",
      value: this.region,
    });
  }
}
