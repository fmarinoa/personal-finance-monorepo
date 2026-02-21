import { BaseError } from "./BaseErrors";

export class BadRequestError extends BaseError {
  constructor({
    message = "Bad Request",
    details,
  }: {
    message?: string;
    details?: unknown;
  }) {
    super({ statusCode: 400, message, details });
  }
}
