import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ApiResponse, DatabaseError, ValidationError } from '../types';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Prisma database errors
const handlePrismaError = (error: any): AppError => {
  switch (error.code) {
    case 'P2002':
      return new AppError('Dữ liệu đã tồn tại', 409, 'DUPLICATE_DATA');
    case 'P2014':
      return new AppError('Dữ liệu không hợp lệ', 400, 'INVALID_DATA');
    case 'P2003':
      return new AppError('Ràng buộc khóa ngoại bị vi phạm', 400, 'FOREIGN_KEY_CONSTRAINT');
    case 'P2025':
      return new AppError('Không tìm thấy dữ liệu', 404, 'NOT_FOUND');
    case 'P1001':
      return new AppError('Không thể kết nối đến database', 503, 'DATABASE_CONNECTION_ERROR');
    case 'P1008':
      return new AppError('Timeout kết nối database', 408, 'DATABASE_TIMEOUT');
    default:
      logger.error('Unhandled Prisma Error:', error);
      return new AppError('Lỗi database không xác định', 500, 'DATABASE_ERROR');
  }
};

// Handle validation errors
const handleValidationError = (errors: ValidationError[]): AppError => {
  const message = errors.map(err => `${err.field}: ${err.message}`).join(', ');
  return new AppError(`Dữ liệu không hợp lệ: ${message}`, 400, 'VALIDATION_ERROR');
};

// Handle JWT errors
const handleJWTError = (): AppError => {
  return new AppError('Token không hợp lệ', 401, 'INVALID_TOKEN');
};

const handleJWTExpiredError = (): AppError => {
  return new AppError('Token đã hết hạn', 401, 'EXPIRED_TOKEN');
};

// Send error response in development
const sendErrorDev = (err: AppError, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: err.message,
    errors: [err.message],
    data: {
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode,
    },
  };

  res.status(err.statusCode).json(response);
};

// Send error response in production
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational errors: send message to client
  if (err.isOperational) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
      errors: [err.message],
    };

    res.status(err.statusCode).json(response);
  } else {
    // Programming or unknown errors: don't leak error details
    logger.error('ERROR:', err);

    const response: ApiResponse = {
      success: false,
      message: 'Đã xảy ra lỗi server!',
      errors: ['Internal server error'],
    };

    res.status(500).json(response);
  }
};

// Global error handling middleware
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error('Global Error Handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  let error = { ...err };
  error.message = err.message;

  // Handle specific errors
  if (err.name === 'PrismaClientKnownRequestError') {
    error = handlePrismaError(err);
  } else if (err.name === 'PrismaClientValidationError') {
    error = new AppError('Dữ liệu không hợp lệ', 400, 'VALIDATION_ERROR');
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else if (err.name === 'ValidationError' && err.details) {
    error = handleValidationError(err.details);
  } else if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File quá lớn', 413, 'FILE_TOO_LARGE');
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = new AppError('Quá nhiều file', 413, 'TOO_MANY_FILES');
    } else {
      error = new AppError('Lỗi upload file', 400, 'UPLOAD_ERROR');
    }
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Catch async errors
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Handle 404 errors
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const err = new AppError(`Không tìm thấy ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(err);
};

// Avoid duplicate named export; AppError is already exported as a class above
