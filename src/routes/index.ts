import { Router } from 'express';
import { AppContainer } from '../container';
import { createV1Routes } from './v1';

export function createRoutes(container: AppContainer): Router {
  const router = Router();

  // Health check
  router.get('/health', (req, res) => container.controllers.health.check(req, res));

  // API v1
  router.use('/api/v1', createV1Routes(container));

  return router;
}