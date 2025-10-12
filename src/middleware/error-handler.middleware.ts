import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
import { createLogger } from '../utils/logger.utils';

const logger = createLogger('ErrorHandler');

export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ApiError>,
  next: NextFunction
): void {
  logger.error('Error occurred', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack
  });

  // Handle known error types
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation error',
      message: err.message
    });
    return;
  }

  if (err.name === 'NotFoundError') {
    res.status(404).json({
      error: 'Not found',
      message: err.message
    });
    return;
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
}

export function notFoundHandler(
  req: Request,
  res: Response<ApiError>
): void {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
}