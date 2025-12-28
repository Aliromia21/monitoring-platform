export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "INVALID_CREDENTIALS"
  | "EMAIL_ALREADY_EXISTS"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly status: number;
  public readonly code: AppErrorCode;
  public readonly details?: unknown;

  constructor(status: number, code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
