import { Request, Response, NextFunction } from "express";
import { ApiResponse, ParseTeamRequest } from "../types";
import { ITeamParserService } from "../services/team/team-parser.service";
import { ITeamValidatorService } from "../services/team/team-validator.service";
import { createLogger } from "../utils/logger.utils";

const logger = createLogger("TeamController");

export class TeamController {
  constructor(
    private teamParser: ITeamParserService,
    private teamValidator: ITeamValidatorService
  ) {}

  /**
   * @openapi
   * /api/v1/teams/parse:
   *   post:
   *     tags:
   *       - Teams
   *     summary: Parse une équipe depuis du texte brut
   *     description: |
   *       Analyse du texte contenant des noms de joueurs et retourne une équipe structurée.
   *
   *       **Stratégies de résolution :**
   *       1. Cache lookup (O(1))
   *       2. Exact match
   *       3. Surname match
   *       4. Fuzzy matching (Levenshtein)
   *       5. LLM resolution (si `useLLM: true`)
   *
   *       **Exemples de formats supportés :**
   *       - `"Salah, Haaland, Son"`
   *       - `"Mohamed Salah\nErling Haaland\nSon Heung-min"`
   *       - `"Salah (Liverpool), KDB, TAA"`
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ParseTeamRequest'
   *           examples:
   *             simple:
   *               summary: Parsing simple
   *               value:
   *                 teamText: "Salah, Haaland, Son, Saka, KDB"
   *                 useLLM: false
   *             withLLM:
   *               summary: Avec résolution LLM
   *               value:
   *                 teamText: "Mo Salah, Big Erl, Sonny, KDB, Bukayo"
   *                 useLLM: true
   *                 strictMode: false
   *             withGameweek:
   *               summary: Avec enrichissement fixtures
   *               value:
   *                 teamText: "Salah, Haaland, Son"
   *                 gameweek: 10
   *     responses:
   *       200:
   *         description: Équipe parsée avec succès
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/ParsedTeam'
   *             examples:
   *               success:
   *                 summary: Parsing réussi
   *                 value:
   *                   success: true
   *                   data:
   *                     players:
   *                       - playerName: "Mohamed Salah"
   *                         clubName: "Liverpool"
   *                         position: "MID"
   *                         price: 13.0
   *                         score: 2.45
   *                     unknown: []
   *                     duplicates: []
   *                     suggestions: {}
   *                     stats:
   *                       totalValue: 45.5
   *                       formation: "3-3-4"
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                 message:
   *                   type: string
   *       500:
   *         description: Internal server error
   */
  async parseTeam(
    req: Request<{}, {}, ParseTeamRequest>,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { teamText, strictMode, includeSuggestions, useLLM, gameweek } =
        req.body;

      logger.info("Parsing team", {
        useLLM,
        gameweek,
        textLength: teamText.length,
      });

      const result = await this.teamParser.parse(teamText, {
        strictMode,
        includeSuggestions,
        useLLM,
        gameweek,
      });

      const validation = this.teamValidator.validate(result.players);

      const debug = {
        llmRequested: useLLM,
        llmAvailable: !!useLLM,
        llmUsed: useLLM,
        unknownCount: result.unknown.length,
      };

      logger.info("Parsing complete", {
        playersFound: result.players.length,
        unknown: result.unknown.length,
        llmUsed: debug.llmUsed,
      });

      res.json({
        success: true,
        data: {
          ...result,
          validation,
          debug,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
