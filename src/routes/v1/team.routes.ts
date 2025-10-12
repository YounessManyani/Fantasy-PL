import { Router } from 'express';
import { TeamController } from '../../controllers/team.controller';
import { validateRequest } from '../../middleware/validator.middleware';
import { parseTeamSchema } from '../../models/schemas/team.schema';

export function createTeamRoutes(controller: TeamController): Router {
  const router = Router();

  /**
   * @route POST /api/v1/teams/parse
   * @desc Parse team from text
   */
  router.post(
    '/parse',
    validateRequest(parseTeamSchema),
    (req, res, next) => controller.parseTeam(req, res, next)
  );

  return router;
}