import { Request, Response, NextFunction } from "express";
import { ApiResponse, RecommendRequest } from "../types";
import { ITeamParserService } from "../services/team/team-parser.service";
import { ITransferRecommenderService } from "../services/transfer/transfer-recommender.service";
import { createLogger } from "../utils/logger.utils";

const logger = createLogger("TransferController");

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
   *       Analyse l'équipe actuelle et recommande les meilleurs transferts possibles
   *       basés sur les critères fournis.
   *
   *       ## 🧠 Algorithmes Utilisés :
   *
   *       ### Single Transfer (maxTransfers: 1)
   *       - **Complexité**: O(n × m)
   *         - n = taille de l'équipe (11)
   *         - m = candidats par position (~20)
   *       - **Méthode**: Exhaustive search
   *       - **Temps d'exécution**: < 100ms
   *
   *       ### Double Transfer (maxTransfers: 2)
   *       - **Complexité**: O(n²) avec heuristique greedy
   *       - **Problème**: NP-hard (combinatorial optimization)
   *       - **Solution**: Approximation greedy (non optimale mais rapide)
   *       - **Temps d'exécution**: < 500ms
   *
   *       ## 📊 Facteurs Pris en Compte :
   *
   *       1. **Score des Joueurs**
   *          - Score de base (calculé via z-scores multi-facteurs)
   *          - Ajustement par fixture (FDR multipliers)
   *
   *       2. **Contraintes Budgétaires**
   *          - Prix joueur + bank disponible
   *          - Validation du budget total
   *
   *       3. **Règles FPL**
   *          - Max 3 joueurs par club
   *          - Swap uniquement dans même position
   *          - Validation de formation (1 GK, 3-5 DEF, etc.)
   *
   *       4. **Fixture Difficulty (si gameweek fourni)**
   *          - FDR 1-2 (easy): +10% score
   *          - FDR 3 (medium): score normal
   *          - FDR 4-5 (hard): -10% score
   *
   *       ## 🎯 Stratégies de Recommandation :
   *
   *       - **best_gain** (défaut): Maximise le gain de score
   *       - **best_value**: Maximise le ratio gain/coût
   *       - **balanced**: Équilibre entre gain et coût (70/30)
   *
   *       ## 📈 Output :
   *
   *       - Liste de transfers recommandés
   *       - Impact total (gain de score, coût)
   *       - Explication textuelle détaillée
   *       - Nouvelle équipe après transferts
   *       - Comparaison avant/après
   *     operationId: recommendTransfers
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
   *                 strategy: "best_gain"
   *                 useLLM: false
   *             doubleTransfer:
   *               summary: 2 transferts avec budget serré
   *               value:
   *                 teamText: "Salah, Son, Saka, KDB, Palmer, TAA, Van Dijk, Gabriel, Porro, Watkins, Isak"
   *                 bank: 5.0
   *                 maxTransfers: 2
   *                 strategy: "best_value"
   *                 useLLM: false
   *             withGameweek:
   *               summary: Transferts optimisés pour GW10
   *               value:
   *                 teamText: "Salah, Haaland, Son, Saka, KDB, TAA, Van Dijk, Gabriel, Porro, Watkins, Isak"
   *                 bank: 3.0
   *                 maxTransfers: 1
   *                 gameweek: 10
   *                 strategy: "best_gain"
   *             balancedStrategy:
   *               summary: Stratégie équilibrée
   *               value:
   *                 teamText: "Salah, Haaland, Son, Saka, KDB, TAA, Van Dijk, Gabriel, Porro, Watkins, Isak"
   *                 bank: 2.0
   *                 maxTransfers: 1
   *                 strategy: "balanced"
   *     responses:
   *       200:
   *         description: Recommandations générées avec succès
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/TransferRecommendation'
   *             examples:
   *               singleTransferSuccess:
   *                 summary: 1 transfert recommandé
   *                 value:
   *                   success: true
   *                   data:
   *                     success: true
   *                     transfers:
   *                       - out:
   *                           playerName: "Dominic Solanke"
   *                           clubName: "Bournemouth"
   *                           position: "FWD"
   *                           price: 7.5
   *                           score: 1.85
   *                         in:
   *                           playerName: "Chris Wood"
   *                           clubName: "Nottingham Forest"
   *                           position: "FWD"
   *                           price: 6.0
   *                           score: 2.35
   *                         gain: 0.50
   *                         cost: -1.5
   *                         meta:
   *                           gameweek: 10
   *                           outFixture:
   *                             opponent: "Manchester City"
   *                             home: false
   *                             fdr: 4
   *                             difficulty: "hard"
   *                           inFixture:
   *                             opponent: "Chelsea"
   *                             home: true
   *                             fdr: 4
   *                             difficulty: "hard"
   *                           outAdjusted: 1.67
   *                           inAdjusted: 2.12
   *                     impact:
   *                       scoreGain: 0.50
   *                       cost: -1.5
   *                       transfersUsed: 1
   *                       averageGain: 0.50
   *                     explanation: "• Replace Dominic Solanke (FWD, Bournemouth, £7.5m) with Chris Wood (FWD, Nottingham Forest, £6.0m)\n  → Score: +0.50 | Cost: -£1.5m\n  GW10 fixtures → OUT: Bournemouth: Manchester City (A), FDR 4 — hard | IN: Nottingham Forest: Chelsea (H), FDR 4 — hard\n  Adjusted: IN 2.12 vs OUT 1.67 (uses FDR multipliers)\n\nTotal impact: +0.50 expected score for £1.5m"
   *                     newTeam:
   *                       - playerName: "Mohamed Salah"
   *                       - playerName: "Chris Wood"
   *                     comparison:
   *                       old:
   *                         totalValue: 83.5
   *                         totalScore: 23.65
   *                         averageScore: 2.15
   *                       new:
   *                         totalValue: 82.0
   *                         totalScore: 24.15
   *                         averageScore: 2.20
   *                       improvements:
   *                         totalScore: 0.50
   *                         averageScore: 0.05
   *                         valueChange: -1.5
   *                     parsedTeam:
   *                       players:
   *                         - playerName: "Mohamed Salah"
   *                       unknown: []
   *                       llmStats:
   *                         resolved: 0
   *                     debug:
   *                       llmRequested: false
   *                       llmAvailable: false
   *                       llmUsed: false
   *                       playersParsed: 11
   *                       unknownPlayers: 0
   *                       llmResolvedCount: 0
   *                       transfersFound: 1
   *               doubleTransferSuccess:
   *                 summary: 2 transferts recommandés
   *                 value:
   *                   success: true
   *                   data:
   *                     transfers:
   *                       - out:
   *                           playerName: "Dominic Solanke"
   *                           position: "FWD"
   *                         in:
   *                           playerName: "Chris Wood"
   *                           position: "FWD"
   *                         gain: 0.50
   *                         cost: -1.5
   *                       - out:
   *                           playerName: "Jarrod Bowen"
   *                           position: "MID"
   *                         in:
   *                           playerName: "Bryan Mbeumo"
   *                           position: "MID"
   *                         gain: 0.35
   *                         cost: 0.5
   *                     impact:
   *                       scoreGain: 0.85
   *                       cost: -1.0
   *                       transfersUsed: 2
   *                       averageGain: 0.425
   *               noTransfersFound:
   *                 summary: Aucun transfert bénéfique trouvé
   *                 value:
   *                   success: true
   *                   data:
   *                     success: true
   *                     transfers: []
   *                     impact:
   *                       scoreGain: 0
   *                       cost: 0
   *                       transfersUsed: 0
   *                       averageGain: 0
   *                     explanation: "No beneficial transfers found within your constraints."
   *                     newTeam: []
   *       400:
   *         description: Erreur de validation ou aucun joueur reconnu
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 error:
   *                   type: string
   *                 data:
   *                   type: object
   *             examples:
   *               noPlayers:
   *                 summary: Aucun joueur reconnu
   *                 value:
   *                   success: false
   *                   error: "No players recognized"
   *                   data:
   *                     unknown:
   *                       - "Unknwn Player1"
   *                       - "Unknwn Player2"
   *                     suggestions:
   *                       "Unknwn Player1":
   *                         - name: "Known Player"
   *                           club: "Some Club"
   *                           similarity: 65
   *                     llmStats:
   *                       attempted: 2
   *                       resolved: 0
   *               invalidBudget:
   *                 summary: Budget invalide
   *                 value:
   *                   error: "Validation failed"
   *                   message: "Invalid request body"
   *                   details:
   *                     fieldErrors:
   *                       bank:
   *                         - "Number must be less than or equal to 100"
   *       500:
   *         description: Erreur serveur
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                 message:
   *                   type: string
   */
  async recommend(
    req: Request<{}, {}, RecommendRequest>,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        teamText,
        bank,
        maxTransfers,
        strictMode,
        useLLM,
        gameweek,
        strategy,
      } = req.body;

      logger.info("Recommend request", {
        useLLM,
        bank,
        maxTransfers,
        gameweek,
        strategy,
      });

      // First parse the team
      const teamResult = await this.teamParser.parse(teamText, {
        strictMode,
        useLLM,
        gameweek,
      });

      logger.info("Team parsing", {
        playersFound: teamResult.players.length,
        unknown: teamResult.unknown.length,
        llmResolved: teamResult.llmStats?.resolved || 0,
      });

      if (teamResult.players.length === 0) {
        res.status(400).json({
          success: false,
          error: "No players recognized",
          data: {
            unknown: teamResult.unknown,
            suggestions: teamResult.suggestions,
            llmStats: teamResult.llmStats,
          },
        });
        return;
      }

      // Get recommendations
      logger.info(
        `Finding transfers for ${teamResult.players.length} players...`
      );

      const recommendations = this.recommender.recommend(teamResult.players, {
        bank,
        maxTransfers,
        gameweek,
        strategy,
      });

      logger.info("Recommendations complete", {
        transfersFound: recommendations.transfers?.length || 0,
        totalGain: recommendations.impact?.scoreGain || 0,
        success: recommendations.success,
      });

      // Log transfer details
      if (recommendations.transfers?.length > 0) {
        recommendations.transfers.forEach((t, i) => {
          logger.debug(
            `Transfer ${i + 1}: ${t.out.playerName} → ${
              t.in.playerName
            } (+${t.gain.toFixed(2)} score, £${t.cost}m)`
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
            transfersFound: recommendations.transfers?.length || 0,
          },
        },
      });
    } catch (error) {
      logger.error("Recommend error", error);
      next(error);
    }
  }
}
