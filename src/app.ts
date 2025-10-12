import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AppContainer } from './container';
import { createRoutes } from './routes';
import { 
  errorHandler, 
  notFoundHandler, 
  requestLogger,
  createRateLimiter,
  rateLimitConfig 
} from './middleware';
import { AppConfig } from './types/config.types';
import { createLogger } from './utils/logger.utils';

const logger = createLogger('App');

export function createApp(config: AppConfig): Application {
  const app = express();

  // Security & parsing
  app.use(helmet());
  app.use(cors(config.cors));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // Rate limiting (optional)
  if (process.env.ENABLE_RATE_LIMIT === '1') {
    app.use(createRateLimiter(rateLimitConfig()));
    logger.info('Rate limiting enabled');
  }

  // Initialize dependency injection container
  logger.info('Creating dependency injection container...');
  const container = new AppContainer(config);

  // Routes
  app.use('/', createRoutes(container));

  // Error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info('Express app configured ✓');
  return app;
}