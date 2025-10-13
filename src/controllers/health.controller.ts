import { Request, Response } from 'express';
import { ApiResponse, HealthResponse } from '../types';
import { AppConfig } from '../types/config.types';
import { IPlayerStoreService } from '../services/player/player-store.service';

export class HealthController {
  constructor(
    private config: AppConfig,
    private playerStore: IPlayerStoreService
  ) {}

  /**
   * @openapi
   * /health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Health check de l'API
   *     description: |
   *       Retourne l'état de santé de l'API et des informations système.
   *       
   *       **Informations retournées :**
   *       - Status global (healthy/unhealthy)
   *       - Version de l'API
   *       - Environnement d'exécution
   *       - Nombre de joueurs chargés en mémoire
   *       - État du service LLM (activé/désactivé)
   *       
   *       **Use cases :**
   *       - Monitoring (Prometheus, Datadog)
   *       - Kubernetes readiness/liveness probes
   *       - Load balancer health checks
   *       - Status page publique
   *     operationId: getHealth
   *     responses:
   *       200:
   *         description: API opérationnelle
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/HealthResponse'
   *             examples:
   *               healthy:
   *                 summary: Système en bonne santé
   *                 value:
   *                   success: true
   *                   data:
   *                     status: "healthy"
   *                     version: "2.0.0"
   *                     environment: "development"
   *                     playersLoaded: 741
   *                     llm:
   *                       enabled: true
   *                       provider: "openai"
   *                       model: "gpt-4o-mini"
   *                       hasKey: true
   *               llmDisabled:
   *                 summary: LLM désactivé
   *                 value:
   *                   success: true
   *                   data:
   *                     status: "healthy"
   *                     version: "2.0.0"
   *                     environment: "production"
   *                     playersLoaded: 741
   *                     llm:
   *                       enabled: false
   *                       provider: "openai"
   *                       model: "gpt-4o-mini"
   *                       hasKey: false
   */
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