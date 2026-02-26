import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { EXPENSES_TABLE_NAME } from "..";
import { DynamoDbRepositoryImp } from "./DynamoDbRepositoryImp";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const dbRepository = new DynamoDbRepositoryImp({
  dbClient: docClient,
  expensesTableName: EXPENSES_TABLE_NAME,
});
