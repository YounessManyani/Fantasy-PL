import { Router } from 'express';
import { TransferController } from '../../controllers/transfer.controller';
import { validateRequest } from '../../middleware/validator.middleware';
import { recommendSchema } from '../../models/schemas/team.schema';

export function createTransferRoutes(controller: TransferController): Router {
  const router = Router();

  /**
   * @route POST /api/v1/transfers/recommend
   * @desc Get transfer recommendations
   */
  router.post(
    '/recommend',
    validateRequest(recommendSchema),
    (req, res, next) => controller.recommend(req, res, next)
  );

  return router;
}