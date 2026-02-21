export interface BaseErrorProps {
  statusCode: number;
  message: string;
  details?: unknown;
}

export abstract class BaseError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;
  readonly expose: boolean;

  constructor(props: BaseErrorProps) {
    super(props.message);
    this.name = new.target.name;
    this.statusCode = props.statusCode;
    this.details = props.details;
    this.expose = props.statusCode < 500; // 4xx → expone mensaje, 5xx → lo oculta
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
