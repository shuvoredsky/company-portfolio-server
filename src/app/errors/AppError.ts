export interface TErrorSource {
  path: string | number;
  message: string;
}

export interface TGenericErrorResponse {
  statusCode: number;
  message: string;
  errorSources: TErrorSource[];
}

class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string, stack = '') {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;

