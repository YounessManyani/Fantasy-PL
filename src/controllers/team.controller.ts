import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ParseTeamRequest } from '../types';
import { ITeamParserService } from '../services/team/team-parser.service';
import { ITeamValidatorService } from '../services/team/team-validator.service';
import { createLogger } from '../utils/logger.utils';

const logger = createLogger('TeamController');

export class TeamController {
  constructor(
    private teamParser: ITeamParserService,
    private teamValidator: ITeamValidatorService
  ) {}

  async parseTeam(
    req: Request<{}, {}, ParseTeamRequest>,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { teamText, strictMode, includeSuggestions, useLLM, gameweek } = req.body;

      logger.info('Parsing team', {
        useLLM,
        gameweek,
        textLength: teamText.length
      });

      // Parse team
      const result = await this.teamParser.parse(teamText, {
        strictMode,
        includeSuggestions,
        useLLM,
        gameweek
      });

      // Add validation
      const validation = this.teamValidator.validate(result.players);

      // Add debug info
      const debug = {
        llmRequested: useLLM,
        llmAvailable: !!useLLM,
        llmUsed: useLLM,
        unknownCount: result.unknown.length
      };

      logger.info('Parsing complete', {
        playersFound: result.players.length,
        unknown: result.unknown.length,
        llmUsed: debug.llmUsed
      });

      res.json({
        success: true,
        data: {
          ...result,
          validation,
          debug
        }
      });
    } catch (error) {
      next(error);
    }
  }
}