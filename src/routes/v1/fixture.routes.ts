import { Router } from 'express';
import { FixtureController } from '../../controllers/fixture.controller';

export function createFixtureRoutes(controller: FixtureController): Router {
  const router = Router();

  /**
   * @route GET /api/v1/fixtures/:club/:gameweek
   * @desc Get fixture for a club in a gameweek
   */
  router.get('/:club/:gameweek', (req, res, next) =>
    controller.getFixture(req, res, next)
  );

  /**
   * @route GET /api/v1/fixtures/insights/:gameweek
   * @desc Get fixture insights for a gameweek
   */
  router.get('/insights/:gameweek', (req, res, next) =>
    controller.getFixtureInsights(req, res, next)
  );

  return router;
}