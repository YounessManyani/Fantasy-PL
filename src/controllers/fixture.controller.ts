import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { IFixtureCalculatorService } from '../services/fixture/fixture-calculator.service';
import { createLogger } from '../utils/logger.utils';

const logger = createLogger('FixtureController');

export class FixtureController {
  constructor(private fixtureCalculator: IFixtureCalculatorService) {}

  getFixture(
    req: Request<{ club: string; gameweek: string }>,
    res: Response<ApiResponse>,
    next: NextFunction
  ): void {
    try {
      const { club, gameweek } = req.params;
      const gw = parseInt(gameweek);

      if (isNaN(gw) || gw < 1 || gw > 38) {
        res.status(400).json({
          success: false,
          error: 'Invalid gameweek. Must be between 1 and 38.'
        });
        return;
      }

      const fixture = this.fixtureCalculator.getFixture(club, gw);

      if (!fixture) {
        res.status(404).json({
          success: false,
          error: `No fixture found for ${club} in gameweek ${gw}`
        });
        return;
      }

      const factor = this.fixtureCalculator.getFactor(fixture.fdr);

      res.json({
        success: true,
        data: {
          club,
          gameweek: gw,
          fixture,
          factor
        }
      });
    } catch (error) {
      next(error);
    }
  }

  getFixtureInsights(
    req: Request<{ gameweek: string }>,
    res: Response<ApiResponse>,
    next: NextFunction
  ): void {
    try {
      const gameweek = parseInt(req.params.gameweek);

      if (isNaN(gameweek) || gameweek < 1 || gameweek > 38) {
        res.status(400).json({
          success: false,
          error: 'Invalid gameweek. Must be between 1 and 38.'
        });
        return;
      }

      logger.info(`Getting fixture insights for GW${gameweek}`);

      // This would need fixture analyst service integration
      // For now, return a basic response
      res.json({
        success: true,
        data: {
          gameweek,
          message: 'Fixture insights endpoint - implement with FixtureAnalyst service'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}