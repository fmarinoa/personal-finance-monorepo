import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "node:path";

interface BackendStackProps extends cdk.StackProps {
  stage: string;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { stage } = props;
    const isProd = stage === "prod";

    const vpc = new ec2.Vpc(this, `FinanceVpc-${stage}`, {
      maxAzs: 2,
      // natGateways: isProd ? 2 : 1, // Alta disponibilidad solo en Prod
      natGateways: 0,
    });

    const db = new rds.DatabaseInstance(this, `FinanceDb${stage}`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      databaseName: `financedb_${stage}`,
      credentials: rds.Credentials.fromGeneratedSecret("postgres"),
      multiAz: false,
      allocatedStorage: isProd ? 50 : 20,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    const api = new apigateway.RestApi(this, `FinanceApi${stage}`, {
      restApiName: `Finance API - ${stage.toUpperCase()}`,
      deployOptions: {
        stageName: stage,
      },
    });

    // ============================================
    // AUTO-CONSTRUCCIÓN DE LAMBDAS
    // ============================================
    const { lambdas } = require("../../backend/src/handler/index.ts");
    const resourceCache: Record<string, apigateway.IResource> = {};

    Object.entries(lambdas).forEach(([name, config]: [string, any]) => {
      const lambdaFn = new lambdaNodejs.NodejsFunction(
        this,
        `${name}Lambda${stage}`,
        {
          runtime: lambda.Runtime.NODEJS_20_X,
          entry: path.join(__dirname, "../../backend/src/handler/index.ts"),
          handler: `lambdas.${name}.handler`,
          vpc,
          vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
          environment: {
            DB_SECRET_ARN: db.secret!.secretArn,
            STAGE: stage,
          },
          timeout: cdk.Duration.seconds(config.timeout || 10),
          memorySize: config.memorySize || 1024,
        },
      );

      db.secret!.grantRead(lambdaFn);
      db.connections.allowDefaultPortFrom(lambdaFn);

      const pathParts = config.path.split("/");
      let currentResource: apigateway.IResource = api.root;

      pathParts.forEach((part: string) => {
        const resourceKey = `${currentResource.path}/${part}`;
        if (!resourceCache[resourceKey]) {
          resourceCache[resourceKey] = currentResource.addResource(part);
        }
        currentResource = resourceCache[resourceKey];
      });

      currentResource.addMethod(
        config.method,
        new apigateway.LambdaIntegration(lambdaFn),
      );
    });

    // Outputs
    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
    new cdk.CfnOutput(this, "DbSecretArn", { value: db.secret!.secretArn });
  }
}
