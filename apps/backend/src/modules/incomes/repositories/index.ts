import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { INCOMES_TABLE_NAME } from "..";
import { DynamoDbRepositoryImp } from "./DynamoDbRepositoryImp";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const dbRepository = new DynamoDbRepositoryImp({
  dbClient: docClient,
  incomesTableName: INCOMES_TABLE_NAME,
});
