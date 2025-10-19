import { Router } from 'express';
import { AppContainer } from '../../container';
import { createTeamRoutes } from './team.routes';
import { createTransferRoutes } from './transfer.routes';
import { createPlayerRoutes } from './player.routes';
import { createFixtureRoutes } from './fixture.routes';

export function createV1Routes(container: AppContainer): Router {
  const router = Router();

  router.use('/teams', createTeamRoutes(container.controllers.team));
  router.use('/transfers', createTransferRoutes(container.controllers.transfer));
  router.use('/players', createPlayerRoutes(container.controllers.player));
  router.use('/fixtures', createFixtureRoutes(container.controllers.fixture));

  return router;
}