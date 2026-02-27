import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { FiltersForList, IncomeStatus } from "@packages/core";

import { BaseDbRepository } from "@/modules/shared/repositories";

import { Income } from "../domains";
import { DbRepository } from "./DbRepository";

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
      effectiveDate:
        income.receivedDate ??
        income.projectedDate ??
        this.getCurrentTimestamp(),
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

  async list(
    userId: string,
    filters: FiltersForList,
  ): Promise<{ data: Income[]; total: number; totalAmount: number }> {
    const expressionAttributeValues: Record<string, any> = {
      ":userId": userId,
    };

    let keyConditionExpression = "userId = :userId";

    if (filters.startDate && filters.endDate) {
      keyConditionExpression +=
        " AND effectiveDate BETWEEN :startDate AND :endDate";
      expressionAttributeValues[":startDate"] = filters.startDate;
      expressionAttributeValues[":endDate"] = filters.endDate;
    } else if (filters.startDate) {
      keyConditionExpression += " AND effectiveDate >= :startDate";
      expressionAttributeValues[":startDate"] = filters.startDate;
    } else if (filters.endDate) {
      keyConditionExpression += " AND effectiveDate <= :endDate";
      expressionAttributeValues[":endDate"] = filters.endDate;
    }

    const queryInput: QueryCommandInput = {
      TableName: this.props.incomesTableName,
      IndexName: "userIdEffectiveDateIndex",
      KeyConditionExpression: keyConditionExpression,
      FilterExpression: "#status <> :deletedStatus",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
        ":deletedStatus": IncomeStatus.DELETED,
      },
      ScanIndexForward: false,
    };

    const allItems: Record<string, any>[] = [];
    let lastKey: Record<string, any> | undefined;
    do {
      if (lastKey) queryInput.ExclusiveStartKey = lastKey;
      const { Items, LastEvaluatedKey } = await this.props.dbClient.send(
        new QueryCommand(queryInput),
      );
      if (Items?.length) allItems.push(...Items);
      lastKey = LastEvaluatedKey;
    } while (lastKey);

    const allIncomes = allItems
      .map((item) => Income.buildFromDbItem(item))
      .sort((a, b) => {
        const dateDiff = b.effectiveDate - a.effectiveDate;
        return dateDiff !== 0 ? dateDiff : b.creationDate - a.creationDate;
      });

    const total = allIncomes.length;
    const totalAmount = allIncomes.reduce((sum, i) => sum + i.amount, 0);

    if (filters.limit === undefined) {
      return { data: allIncomes, total, totalAmount };
    }

    const start = filters.page ? (filters.page - 1) * filters.limit : 0;
    return {
      data: allIncomes.slice(start, start + filters.limit),
      total,
      totalAmount,
    };
  }
}
