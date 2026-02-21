import { BaseError } from "./BaseErrors";

export class InternalError extends BaseError {
  constructor({
    message = "Internal Server Error",
    details,
  }: {
    message?: string;
    details?: unknown;
  }) {
    super({ statusCode: 500, message, details });
  }
}
