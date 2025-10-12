import { Request, Response } from 'express';
import { ApiResponse, HealthResponse } from '../types';
import { AppConfig } from '../types/config.types';
import { IPlayerStoreService } from '../services/player/player-store.service';

export class HealthController {
  constructor(
    private config: AppConfig,
    private playerStore: IPlayerStoreService
  ) {}

  check(req: Request, res: Response<ApiResponse<HealthResponse>>): void {
    const health: HealthResponse = {
      status: 'healthy',
      version: this.config.app.version,
      environment: this.config.app.environment,
      playersLoaded: this.playerStore.getAll().length,
      llm: {
        enabled: this.config.llm.enabled,
        provider: this.config.llm.provider,
        model: this.config.llm.model,
        hasKey: !!this.config.llm.apiKey
      }
    };

    res.json({
      success: true,
      data: health
    });
  }
}