import { Request, Response, NextFunction } from 'express';
import { ApiResponse, RecommendRequest } from '../types';
import { ITeamParserService } from '../services/team/team-parser.service';
import { ITransferRecommenderService } from '../services/transfer/transfer-recommender.service';
import { createLogger } from '../utils/logger.utils';

const logger = createLogger('TransferController');

export class TransferController {
  constructor(
    private teamParser: ITeamParserService,
    private recommender: ITransferRecommenderService
  ) {}
/**
 * @openapi
 * /api/v1/transfers/recommend:
 *   post:
 *     tags:
 *       - Transfers
 *     summary: Recommande des transferts optimaux
 *     description: |
 *       Analyse l'équipe actuelle et recommande les meilleurs transferts possibles.
 *       
 *       **Algorithmes utilisés :**
 *       - Single Transfer: Exhaustive search O(n × m)
 *       - Double Transfer: Greedy heuristic (NP-hard problem)
 *       
 *       **Facteurs pris en compte :**
 *       - Score des joueurs (base + fixture adjustment)
 *       - Budget disponible
 *       - Limites de club (max 3 par club)
 *       - Positions (swap uniquement dans même position)
 *       
 *       **Stratégies :**
 *       - `best_gain`: Maximise le gain de score
 *       - `best_value`: Maximise le ratio gain/coût
 *       - `balanced`: Équilibre entre gain et coût
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecommendRequest'
 *           examples:
 *             singleTransfer:
 *               summary: 1 transfert simple
 *               value:
 *                 teamText: "Salah, Haaland, Son, Saka, KDB, TAA, Van Dijk, Gabriel, Porro, Watkins, Isak"
 *                 bank: 2.5
 *                 maxTransfers: 1
 *                 gameweek: 10
 *             doubleTransfer:
 *               summary: 2 transferts
 *               value:
 *                 teamText: "Salah, Haaland, Son, Saka, KDB, TAA, Van Dijk, Gabriel, Porro, Watkins, Isak"
 *                 bank: 5.0
 *                 maxTransfers: 2
 *                 strategy: "best_value"
 *     responses:
 *       200:
 *         description: Recommandations générées
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TransferRecommendation'
 *       400:
 *         description: No players recognized
 */
  async recommend(
    req: Request<{}, {}, RecommendRequest>,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { teamText, bank, maxTransfers, strictMode, useLLM, gameweek, strategy } = req.body;

      logger.info('Recommend request', {
        useLLM,
        bank,
        maxTransfers,
        gameweek,
        strategy
      });

      // First parse the team
      const teamResult = await this.teamParser.parse(teamText, {
        strictMode,
        useLLM,
        gameweek
      });

      logger.info('Team parsing', {
        playersFound: teamResult.players.length,
        unknown: teamResult.unknown.length,
        llmResolved: teamResult.llmStats?.resolved || 0
      });

      if (teamResult.players.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No players recognized',
          data: {
            unknown: teamResult.unknown,
            suggestions: teamResult.suggestions,
            llmStats: teamResult.llmStats
          }
        });
        return;
      }

      // Get recommendations
      logger.info(`Finding transfers for ${teamResult.players.length} players...`);
      
      const recommendations = this.recommender.recommend(teamResult.players, {
        bank,
        maxTransfers,
        gameweek,
        strategy
      });

      logger.info('Recommendations complete', {
        transfersFound: recommendations.transfers?.length || 0,
        totalGain: recommendations.impact?.scoreGain || 0,
        success: recommendations.success
      });

      // Log transfer details
      if (recommendations.transfers?.length > 0) {
        recommendations.transfers.forEach((t, i) => {
          logger.debug(
            `Transfer ${i + 1}: ${t.out.playerName} → ${t.in.playerName} (+${t.gain.toFixed(2)} score, £${t.cost}m)`
          );
        });
      }

      // Combine results with debug info
      res.json({
        success: true,
        data: {
          ...recommendations,
          parsedTeam: teamResult,
          debug: {
            llmRequested: useLLM,
            llmAvailable: !!useLLM,
            llmUsed: useLLM,
            playersParsed: teamResult.players.length,
            unknownPlayers: teamResult.unknown.length,
            llmResolvedCount: teamResult.llmStats?.resolved || 0,
            transfersFound: recommendations.transfers?.length || 0
          }
        }
      });
    } catch (error) {
      logger.error('Recommend error', error);
      next(error);
    }
  }
}