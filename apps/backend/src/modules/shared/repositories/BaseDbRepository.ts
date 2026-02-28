import { randomUUID } from "crypto";
import { DateTime } from "luxon";

export abstract class BaseDbRepository<T> {
  protected generateId(): string {
    return randomUUID();
  }

  protected getCurrentTimestamp(): number {
    return DateTime.now().toMillis();
  }

  protected buildUpdateExpression(
    item: T,
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
      attributeValues[attributeValue] = item[field as keyof T];
      setExpressions.push(`${attributeName} = ${attributeValue}`);
    });

    return {
      UpdateExpression: `SET ${setExpressions.join(", ")}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    };
  }
}
