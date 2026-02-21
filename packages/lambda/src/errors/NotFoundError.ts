import { BaseError } from "./BaseErrors";

export class NotFoundError extends BaseError {
  constructor({
    message = "Not Found",
    details,
  }: {
    message?: string;
    details?: unknown;
  }) {
    super({ statusCode: 404, message, details });
  }
}
