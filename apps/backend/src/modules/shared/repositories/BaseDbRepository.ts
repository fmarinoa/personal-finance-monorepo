import { Expense } from "@/modules/expenses/domains";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";

export abstract class BaseDbRepository {
  protected generateId(): string {
    return randomUUID();
  }

  protected getCurrentTimestamp(): number {
    return DateTime.now().toMillis();
  }

  protected buildUpdateExpression(
    expense: Expense,
    fieldsToUpdate: string[],
  ): {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, unknown>;
  } {
    const attributeNames: Record<string, string> = {};
    const attributeValues: Record<string, unknown> = {};
    const setExpressions: string[] = [];

    fieldsToUpdate.forEach((field) => {
      const attributeName = `#${field}`;
      const attributeValue = `:${field}`;

      attributeNames[attributeName] = field;
      attributeValues[attributeValue] = expense[field as keyof Expense];
      setExpressions.push(`${attributeName} = ${attributeValue}`);
    });

    return {
      UpdateExpression: `SET ${setExpressions.join(", ")}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    };
  }
}
