import { Expense } from "../domains/Expense";
import { DbRepository } from "./DbRepository";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  QueryCommandInput,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { BaseDbRepository } from "@/modules/shared/repositories";
import {
  BadRequestError,
  NotFoundError,
  InternalError,
} from "@packages/lambda";
import { ExpenseStatus, FiltersForList } from "@packages/core";

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
  ): Promise<{ data: Expense[]; nextToken?: string }> {
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
      Limit: filters.limit,
      FilterExpression: "#status <> :activeStatus",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
        ":activeStatus": ExpenseStatus.DELETED,
      },
      ScanIndexForward: false,
    };

    if (filters.nextToken) {
      try {
        queryInput.ExclusiveStartKey = JSON.parse(
          Buffer.from(filters.nextToken, "base64").toString("utf-8"),
        );
      } catch (error) {
        throw new BadRequestError({ details: "Invalid nextToken" });
      }
    }

    const { Items, LastEvaluatedKey } = await this.props.dbClient.send(
      new QueryCommand(queryInput),
    );

    if (!Items) {
      return { data: [], nextToken: undefined };
    }

    const data = Items.map((item: Record<string, any>) =>
      Expense.buildFromDbItem(item),
    ).sort((a: Expense, b: Expense) => b.paymentDate - a.paymentDate);

    const nextToken = LastEvaluatedKey
      ? Buffer.from(JSON.stringify(LastEvaluatedKey)).toString("base64")
      : undefined;

    return { data, nextToken };
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
      const result = await this.props.dbClient.send(
        new UpdateCommand({
          TableName: this.props.expensesTableName,
          Key: { userId: expense.user.id, id: expense.id },
          UpdateExpression,
          ExpressionAttributeNames,
          ExpressionAttributeValues,
          ConditionExpression: "attribute_exists(userId)",
        }),
      );

      if (!result.Attributes) {
        throw new NotFoundError({ details: "Expense not found" });
      }

      return Expense.buildFromDbItem(result.Attributes);
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
