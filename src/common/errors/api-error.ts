import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

export class ApiError extends HttpException {
  public readonly code: ErrorCode;
  public readonly details?: any;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: any,
  ) {
    super(
      {
        success: false,
        error: {
          code,
          message,
          details,
        },
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );

    this.code = code;
    this.details = details;
  }

  static notFound(message: string = 'Resource not found', details?: any): ApiError {
    return new ApiError(ErrorCode.NOT_FOUND, message, HttpStatus.NOT_FOUND, details);
  }

  static unauthorized(message: string = 'Unauthorized', details?: any): ApiError {
    return new ApiError(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED, details);
  }

  static forbidden(message: string = 'Forbidden', details?: any): ApiError {
    return new ApiError(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN, details);
  }

  static validation(message: string = 'Validation failed', details?: any): ApiError {
    return new ApiError(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, details);
  }

  static internal(message: string = 'Internal server error', details?: any): ApiError {
    return new ApiError(ErrorCode.INTERNAL_SERVER_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR, details);
  }

  static todoNotFound(id: string): ApiError {
    return new ApiError(
      ErrorCode.TODO_NOT_FOUND,
      `Todo with ID ${id} not found`,
      HttpStatus.NOT_FOUND,
      { todoId: id },
    );
  }
}