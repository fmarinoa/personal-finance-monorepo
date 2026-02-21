import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/BackendStack";

const app = new cdk.App();

const stage = app.node.tryGetContext("stage") || "Dev";

new BackendStack(app, `FinanceBackendStack${stage}`, {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-2",
  },
});
