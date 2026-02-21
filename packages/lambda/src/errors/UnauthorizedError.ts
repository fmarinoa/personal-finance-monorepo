import { BaseError } from "./BaseErrors";

export class UnauthorizedError extends BaseError {
  constructor({
    message = "Unauthorized",
    details,
  }: {
    message?: string;
    details?: unknown;
  }) {
    super({ statusCode: 401, message, details });
  }
}
