import { Income } from "../domains";
import { DbRepository } from "./DbRepository";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { BaseDbRepository } from "@/modules/shared/repositories";
import { IncomeStatus } from "@packages/core";

export interface DynamoDbRepositoryImpProps {
  dbClient: DynamoDBDocumentClient;
  incomesTableName: string;
}

export class DynamoDbRepositoryImp
  extends BaseDbRepository
  implements DbRepository
{
  constructor(private readonly props: DynamoDbRepositoryImpProps) {
    super();
  }

  async create(income: Income): Promise<Income> {
    const item = {
      userId: income.user.id,
      id: this.generateId(),
      amount: income.amount,
      description: income.description,
      category: income.category,
      creationDate: this.getCurrentTimestamp(),
      status: income.status || IncomeStatus.RECEIVED,
      projectedDate: income?.projectedDate,
      receivedDate: income?.receivedDate,
    };

    await this.props.dbClient.send(
      new PutCommand({
        TableName: this.props.incomesTableName,
        Item: item,
      }),
    );

    return new Income({
      ...income,
      id: item.id,
      creationDate: item.creationDate,
      status: item.status,
    });
  }
}
