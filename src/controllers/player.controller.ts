import { Request, Response, NextFunction } from 'express';
import { ApiResponse, PlayerFilters } from '../types';
import { IPlayerStoreService } from '../services/player/player-store.service';
import { createLogger } from '../utils/logger.utils';

const logger = createLogger('PlayerController');

export class PlayerController {
  constructor(private playerStore: IPlayerStoreService) {}

  getPlayers(
    req: Request<{}, {}, {}, PlayerFilters & { limit?: string }>,
    res: Response<ApiResponse>,
    next: NextFunction
  ): void {
    try {
      const { position, club, limit = '50' } = req.query;

      const filters: PlayerFilters = {
        position: position as any,
        club
      };

      let players = this.playerStore.search(filters);

      players = players
        .sort((a, b) => b.score - a.score)
        .slice(0, parseInt(limit));

      const formatted = players.map(p => ({
        name: p.playerName,
        club: p.clubName,
        position: p.position,
        price: p.price,
        score: p.score,
        pointsPerGame: p.pointsPerGame
      }));

      res.json({
        success: true,
        data: {
          count: formatted.length,
          players: formatted
        }
      });
    } catch (error) {
      next(error);
    }
  }
}