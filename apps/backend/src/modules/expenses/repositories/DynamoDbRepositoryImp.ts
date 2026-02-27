import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ExpenseStatus, FiltersForList } from "@packages/core";
import { InternalError, NotFoundError } from "@packages/lambda";

import { BaseDbRepository } from "@/modules/shared/repositories";

import { Expense } from "../domains/Expense";
import { DbRepository } from "./DbRepository";

export interface DynamoDbRepositoryImpProps {
  dbClient: DynamoDBDocumentClient;
  expensesTableName: string;
}

export class DynamoDbRepositoryImp
  extends BaseDbRepository
  implements DbRepository
{
  constructor(private readonly props: DynamoDbRepositoryImpProps) {
    super();
  }

  async create(expense: Expense): Promise<Expense> {
    const item = {
      userId: expense.user.id,
      id: this.generateId(),
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      paymentDate: expense.paymentDate || this.getCurrentTimestamp(),
      creationDate: this.getCurrentTimestamp(),
      status: ExpenseStatus.ACTIVE,
    };

    await this.props.dbClient.send(
      new PutCommand({
        TableName: this.props.expensesTableName,
        Item: item,
      }),
    );

    return new Expense({
      ...expense,
      id: item.id,
      creationDate: item.creationDate,
    });
  }

  async list(
    userId: string,
    filters: FiltersForList,
  ): Promise<{
    data: Expense[];
    total: number;
  }> {
    const expressionAttributeValues: Record<string, any> = {
      ":userId": userId,
    };

    let keyConditionExpression = "userId = :userId";

    if (filters.startDate && filters.endDate) {
      keyConditionExpression +=
        " AND paymentDate BETWEEN :startDate AND :endDate";
      expressionAttributeValues[":startDate"] = filters.startDate;
      expressionAttributeValues[":endDate"] = filters.endDate;
    } else if (filters.startDate) {
      keyConditionExpression += " AND paymentDate >= :startDate";
      expressionAttributeValues[":startDate"] = filters.startDate;
    } else if (filters.endDate) {
      keyConditionExpression += " AND paymentDate <= :endDate";
      expressionAttributeValues[":endDate"] = filters.endDate;
    }

    const queryInput: QueryCommandInput = {
      TableName: this.props.expensesTableName,
      IndexName: "userIdPaymentDateIndex",
      KeyConditionExpression: keyConditionExpression,
      FilterExpression: "#status <> :deletedStatus",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
        ":deletedStatus": ExpenseStatus.DELETED,
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

    const allExpenses = allItems
      .map((item) => Expense.buildFromDbItem(item))
      .sort((a, b) => {
        const paymentDateDiff = b.paymentDate - a.paymentDate;
        return paymentDateDiff !== 0
          ? paymentDateDiff
          : b.creationDate - a.creationDate;
      });

    const total = allExpenses.length;

    if (filters.limit === undefined) {
      return { data: allExpenses, total };
    }

    const limit = filters.limit;
    const start = filters.page ? (filters.page - 1) * limit : 0;
    const data = allExpenses.slice(start, start + limit);

    return { data, total };
  }

  async getById(expense: Expense): Promise<Expense> {
    const { Item } = await this.props.dbClient.send(
      new GetCommand({
        TableName: this.props.expensesTableName,
        Key: {
          userId: expense.user.id,
          id: expense.id,
        },
      }),
    );

    if (!Item) {
      throw new NotFoundError({ details: "Expense not found" });
    }

    return Expense.buildFromDbItem(Item);
  }

  async update(expense: Expense): Promise<Expense> {
    const fieldsToUpdate = [
      "amount",
      "description",
      "category",
      "paymentDate",
      "paymentMethod",
      "lastUpdatedDate",
    ].filter((field) => expense[field as keyof Expense] !== undefined);

    const request = new Expense({
      ...expense,
      lastUpdatedDate: this.getCurrentTimestamp(),
    });

    const {
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    } = this.buildUpdateExpression(request, fieldsToUpdate);

    try {
      await this.props.dbClient.send(
        new UpdateCommand({
          TableName: this.props.expensesTableName,
          Key: { userId: expense.user.id, id: expense.id },
          UpdateExpression,
          ExpressionAttributeNames,
          ExpressionAttributeValues,
          ConditionExpression: "attribute_exists(userId)",
          ReturnValues: "ALL_NEW",
        }),
      );

      return request;
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        throw new NotFoundError({ details: "Expense not found" });
      }
      throw error;
    }
  }

  async delete(expense: Expense): Promise<void> {
    try {
      const request = new Expense({
        ...expense,
        status: ExpenseStatus.DELETED,
        lastUpdatedDate: this.getCurrentTimestamp(),
        onDelete: {
          ...expense.onDelete,
          deletionDate: this.getCurrentTimestamp(),
        },
      });

      const {
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } = this.buildUpdateExpression(request, [
        "status",
        "lastUpdatedDate",
        "onDelete",
      ]);

      await this.props.dbClient.send(
        new UpdateCommand({
          TableName: this.props.expensesTableName,
          Key: { userId: expense.user.id, id: expense.id },
          UpdateExpression,
          ExpressionAttributeNames,
          ExpressionAttributeValues,
        }),
      );
    } catch (error: any) {
      throw new InternalError({ details: error });
    }
  }
}
