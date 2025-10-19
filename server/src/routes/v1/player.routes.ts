import { Router } from 'express';
import { PlayerController } from '../../controllers/player.controller';

export function createPlayerRoutes(controller: PlayerController): Router {
  const router = Router();

  /**
   * @route GET /api/v1/players
   * @desc Get players list with filters
   */
  router.get('/', (req, res, next) => controller.getPlayers(req, res, next));

  return router;
}