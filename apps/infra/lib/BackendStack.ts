import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { CognitoAuth } from "./constructs/CognitoAuth";
import { ExpensesTable } from "./constructs/ExpensesTable";
import { FinanceApi } from "./constructs/FinanceApi";
import { IncomesTable } from "./constructs/IncomesTable";

interface BackendStackProps extends cdk.StackProps {
  stage: string;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { stage } = props;
    const isProd = stage === "Prod";

    // Create Cognito authentication
    const cognitoAuth = new CognitoAuth(this, "CognitoAuth", {
      stage,
      isProd,
    });

    // Create resources
    const expensesTable = new ExpensesTable(this, "ExpensesTable", {
      stage,
      isProd,
    });

    const incomesTable = new IncomesTable(this, "IncomesTable", {
      stage,
      isProd,
    });

    const api = new FinanceApi(this, "FinanceApi", {
      stage,
      isProd,
      tables: {
        expenses: expensesTable.table,
        incomes: incomesTable.table,
      },
      authorizer: cognitoAuth.authorizer,
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

    new cdk.CfnOutput(this, "IncomesTableName", {
      description: "DynamoDB table name for incomes",
      exportName: `IncomesTableName-${stage}`,
      value: incomesTable.table.tableName,
    });

    new cdk.CfnOutput(this, "Region", {
      description: "AWS Region where resources are deployed",
      value: this.region,
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      description: "Cognito User Pool ID",
      exportName: `UserPoolId-${stage}`,
      value: cognitoAuth.userPool.userPoolId,
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      description: "Cognito User Pool Client ID",
      exportName: `UserPoolClientId-${stage}`,
      value: cognitoAuth.userPoolClient.userPoolClientId,
    });
  }
}
