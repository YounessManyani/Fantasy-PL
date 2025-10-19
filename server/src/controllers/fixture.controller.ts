import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";
import { IFixtureCalculatorService } from "../services/fixture/fixture-calculator.service";
import { createLogger } from "../utils/logger.utils";

const logger = createLogger("FixtureController");

export class FixtureController {
  constructor(private fixtureCalculator: IFixtureCalculatorService) {}

  /**
   * @openapi
   * /api/v1/fixtures/{club}/{gameweek}:
   *   get:
   *     tags:
   *       - Fixtures
   *     summary: Récupère le fixture d'un club pour un gameweek
   *     description: |
   *       Retourne les informations de fixture pour un club spécifique à un gameweek donné.
   *
   *       ## 📊 Informations Retournées :
   *
   *       - **opponent**: Adversaire
   *       - **home**: Match à domicile (true) ou extérieur (false)
   *       - **fdr**: Fixture Difficulty Rating (1-5)
   *       - **difficulty**: Label textuel (easy/medium/hard)
   *       - **factor**: Multiplicateur de score (1.1 / 1.0 / 0.9)
   *
   *       ## 🎯 FDR Mapping :
   *
   *       - **FDR 1-2** → `easy` → Factor 1.1 (+10%)
   *       - **FDR 3** → `medium` → Factor 1.0 (normal)
   *       - **FDR 4-5** → `hard` → Factor 0.9 (-10%)
   *
   *       ## 📝 Notes :
   *
   *       - Les noms de clubs acceptent les synonymes (ex: "Spurs" → "Tottenham Hotspur")
   *       - Certaines équipes peuvent avoir des "blank gameweeks" (pas de match)
   *       - Les données FDR sont pré-calculées pour la saison 2025-26
   *     operationId: getFixture
   *     parameters:
   *       - in: path
   *         name: club
   *         required: true
   *         schema:
   *           type: string
   *         description: Nom du club (accepte synonymes)
   *         examples:
   *           fullName:
   *             value: Liverpool
   *             summary: Nom complet
   *           shortName:
   *             value: Spurs
   *             summary: Surnom
   *       - in: path
   *         name: gameweek
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 38
   *         description: Numéro du gameweek
   *         example: 10
   *     responses:
   *       200:
   *         description: Fixture trouvé
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         club:
   *                           type: string
   *                         gameweek:
   *                           type: integer
   *                         fixture:
   *                           $ref: '#/components/schemas/Fixture'
   *                         factor:
   *                           type: number
   *                           format: float
   *                           description: Multiplicateur de score
   *             examples:
   *               easyFixture:
   *                 summary: Match facile à domicile
   *                 value:
   *                   success: true
   *                   data:
   *                     club: "Liverpool"
   *                     gameweek: 10
   *                     fixture:
   *                       opponent: "Aston Villa"
   *                       home: true
   *                       fdr: 3
   *                       difficulty: "medium"
   *                     factor: 1.0
   *               hardFixture:
   *                 summary: Match difficile à l'extérieur
   *                 value:
   *                   success: true
   *                   data:
   *                     club: "Arsenal"
   *                     gameweek: 6
   *                     fixture:
   *                       opponent: "Newcastle United"
   *                       home: false
   *                       fdr: 4
   *                       difficulty: "hard"
   *                     factor: 0.9
   *       400:
   *         description: Gameweek invalide
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 error:
   *                   type: string
   *             example:
   *               success: false
   *               error: "Invalid gameweek. Must be between 1 and 38."
   *       404:
   *         description: Fixture non trouvé
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 error:
   *                   type: string
   *             examples:
   *               noFixture:
   *                 summary: Pas de match ce gameweek
   *                 value:
   *                   success: false
   *                   error: "No fixture found for Liverpool in gameweek 7"
   *               unknownClub:
   *                 summary: Club non reconnu
   *                 value:
   *                   success: false
   *                   error: "No fixture found for UnknownFC in gameweek 10"
   */
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
          error: "Invalid gameweek. Must be between 1 and 38.",
        });
        return;
      }

      const fixture = this.fixtureCalculator.getFixture(club, gw);

      if (!fixture) {
        res.status(404).json({
          success: false,
          error: `No fixture found for ${club} in gameweek ${gw}`,
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
          factor,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /api/v1/fixtures/insights/{gameweek}:
   *   get:
   *     tags:
   *       - Fixtures
   *     summary: Analyse des fixtures pour un gameweek
   *     description: |
   *       **⚠️ ENDPOINT NON IMPLÉMENTÉ - Placeholder pour future feature**
   *
   *       Cet endpoint est prévu pour fournir une analyse complète des fixtures
   *       d'un gameweek spécifique, incluant :
   *
   *       - Clubs avec les fixtures les plus faciles
   *       - Clubs avec les fixtures les plus difficiles
   *       - Analyse des matchs à domicile vs extérieur
   *       - Recommandations de capitaine basées sur FDR
   *       - Statistiques agrégées par position
   *
   *       ## 🚧 Status : À Implémenter
   *
   *       Pour implémenter, créer un `FixtureAnalystService` avec :
   *       - `analyzeGameweek(gw: number): FixtureInsights`
   *       - `getBestFixtures(gw: number, limit: number): Club[]`
   *       - `getWorstFixtures(gw: number, limit: number): Club[]`
   *     operationId: getFixtureInsights
   *     parameters:
   *       - in: path
   *         name: gameweek
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 38
   *         description: Numéro du gameweek à analyser
   *         example: 10
   *     responses:
   *       200:
   *         description: Analyse des fixtures (placeholder)
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         gameweek:
   *                           type: integer
   *                         message:
   *                           type: string
   *             example:
   *               success: true
   *               data:
   *                 gameweek: 10
   *                 message: "Fixture insights endpoint - implement with FixtureAnalyst service"
   *       400:
   *         description: Gameweek invalide
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 error:
   *                   type: string
   */
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
          error: "Invalid gameweek. Must be between 1 and 38.",
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
          message:
            "Fixture insights endpoint - implement with FixtureAnalyst service",
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
