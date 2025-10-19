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
   *       ...
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ParseTeamRequest'
   *           example:                            # <- default payload shown in UI
   *             teamText: "Raya, Romero, Calafiori, Chalobah, Doku, Enzo, Gakpo, Semenyo, Kudus, Joao Pedro, Haaland"
   *             strictMode: false
   *             includeSuggestions: true
   *             useLLM: true
   *             gameweek: 10
   *           examples:
   *             simple:
   *               summary: Parsing simple sans LLM
   *               value:
   *                 teamText: "Salah, Haaland, Son, Saka, KDB"
   *                 strictMode: false
   *                 includeSuggestions: true
   *                 useLLM: false
   *             withLLM:
   *               summary: Avec résolution LLM pour surnoms
   *               value:
   *                 teamText: "Mo Salah, Big Erl, Sonny, KDB, Bukayo"
   *                 useLLM: true
   *                 strictMode: false
   *                 includeSuggestions: true
   *             withGameweek:
   *               summary: Avec enrichissement fixtures pour GW7
   *               value:
   *                 teamText: "Salah, Haaland, Son, Saka, Bruno, TAA, Saliba, Gabriel, Trippier, Gvardiol, Raya"
   *                 gameweek: 7
   *                 useLLM: false
   *                 strictMode: false
   *             fullTeam:
   *               summary: Équipe complète (11 joueurs) avec tous les paramètres
   *               value:
   *                 teamText: "Raya, TAA, Saliba, Gabriel, Trippier, Salah, Saka, Bruno, Son, Haaland, Watkins"
   *                 gameweek: 7
   *                 useLLM: true
   *                 strictMode: false
   *                 includeSuggestions: true
   *     responses:
   *       200:
   *         description: Équipe parsée avec succès
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/ParsedTeam'
   *       400:
   *         description: Erreur de validation
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error: { type: string }
   *                 message: { type: string }
   *             example:
   *               error: "Validation failed"
   *               message: "Invalid request body"
   *       500:
   *         description: Erreur serveur interne
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error: { type: string }
   *                 message: { type: string }
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
