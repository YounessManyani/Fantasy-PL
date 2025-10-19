import {
  Player,
  EnrichedPlayer,
  ParsedTeam,
  ParseOptions,
  PlayerSuggestion,
  LLMStats,
} from "../../types";
import { INameResolverService } from "../name/name-resolver.service";
import { IPlayerStoreService } from "../player/player-store.service";
import { IFixtureCalculatorService } from "../fixture/fixture-calculator.service";
import { ITeamStatsService } from "./team-stats.service";
import { IPlayerSearchService } from "../player/player-search.service";
import { createLogger } from "../../utils/logger.utils";
import { round } from "../../utils/math.utils";

const logger = createLogger("TeamParser");

export interface ITeamParserService {
  parse(teamText: string, options?: ParseOptions): Promise<ParsedTeam>;
}

export class TeamParserService implements ITeamParserService {
  constructor(
    private nameResolver: INameResolverService,
    private playerStore: IPlayerStoreService,
    private fixtureCalculator: IFixtureCalculatorService,
    private statsService: ITeamStatsService,
    private searchService: IPlayerSearchService
  ) {}

  async parse(
    teamText: string,
    options: ParseOptions = {}
  ): Promise<ParsedTeam> {
    const {
      strictMode = false,
      includeSuggestions = true,
      useLLM = false,
      gameweek,
    } = options;

    logger.info("Parsing team", { strictMode, useLLM, gameweek });

    // Extract player names
    const playerNames = this.extractPlayerNames(teamText);
    logger.debug(`Found ${playerNames.length} player names to resolve`);

    // Resolve each name
    const results: ParsedTeam = {
      players: [],
      unknown: [],
      duplicates: [],
      suggestions: {},
      stats: {} as any,
      llmStats: {
        attempted: 0,
        resolved: 0,
        names: [],
      },
    };

    const seen = new Set<number>();

    for (const name of playerNames) {
      logger.debug(`Processing: "${name}"`);

      const player = await this.nameResolver.resolve(name, {
        strictMode,
        useLLM,
      });

      if (player) {
        // Check if LLM resolved
        if ((player as any).__llm_resolved) {
          results.llmStats!.resolved++;
          results.llmStats!.names.push({
            input: name,
            matched: player.playerName,
          });
        }

        // Check for duplicates
        if (seen.has(player.id)) {
          results.duplicates.push(name);
        } else {
          seen.add(player.id);
          const enriched = this.enrichPlayer(player, gameweek);
          results.players.push(enriched);
        }
      } else {
        results.unknown.push(name);

        if (useLLM) {
          results.llmStats!.attempted++;
        }

        // Generate suggestions
        if (includeSuggestions) {
          results.suggestions[name] = this.searchService.findSuggestions(name);
        }
      }
    }

    // Calculate team statistics
    results.stats = this.statsService.calculate(results.players);

    logger.info("Parsing complete", {
      found: results.players.length,
      unknown: results.unknown.length,
      llmResolved: results.llmStats?.resolved || 0,
    });

    return results;
  }

  private extractPlayerNames(text: string): string[] {
    // Remove content in parentheses
    const cleaned = text.replace(/\([^)]*\)/g, "");

    return cleaned
      .split(/[,;\n]+/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }

  private enrichPlayer(player: Player, gameweek?: number): EnrichedPlayer {
    const base: EnrichedPlayer = {
      ...player,
      nextFixture: null,
      adjustedScore: player.score,
    };

    // Enrich with fixture data if gameweek provided
    if (gameweek) {
      const fixture = this.fixtureCalculator.getFixture(
        player.clubName,
        gameweek
      );

      if (fixture) {
        const factor = this.fixtureCalculator.getFactor(fixture.fdr);
        base.nextFixture = fixture;
        base.adjustedScore = round(player.score * factor);
      }
    }

    return base;
  }
}
