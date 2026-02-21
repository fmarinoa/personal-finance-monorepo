import { DynamoDbRepositoryImp } from "./DynamoDbRepositoryImp";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { EXPENSES_TABLE_NAME } from "..";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const dbRepository = new DynamoDbRepositoryImp({
  dbClient: docClient,
  expensesTableName: EXPENSES_TABLE_NAME,
});
