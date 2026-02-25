import { DynamoDbRepositoryImp } from "./DynamoDbRepositoryImp";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { INCOMES_TABLE_NAME } from "..";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const dbRepository = new DynamoDbRepositoryImp({
  dbClient: docClient,
  incomesTableName: INCOMES_TABLE_NAME,
});
