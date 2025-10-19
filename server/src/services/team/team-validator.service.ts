import { Player, ValidationResult, Position } from "../../types";
import { FPLRules } from "../../types/config.types";
import {
  POSITION_LIMITS,
  POSITION_NAMES,
} from "../../models/constants/positions.constants";
import { ITeamStatsService } from "./team-stats.service";

export interface ITeamValidatorService {
  validate(players: Player[]): ValidationResult;
  canAddPlayer(team: Player[], playerIn: Player): boolean;
  checkClubLimits(team: Player[]): boolean;
}

export class TeamValidatorService implements ITeamValidatorService {
  constructor(
    private rules: FPLRules,
    private statsService: ITeamStatsService
  ) {}

  validate(players: Player[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check team size
    if (players.length !== this.rules.startingXI) {
      errors.push(
        `Team has ${players.length} players (need exactly ${this.rules.startingXI})`
      );
    }

    // Count positions and clubs
    const positions: Record<Position, number> = {} as any;
    const clubs: Record<string, number> = {};

    for (const player of players) {
      positions[player.position] = (positions[player.position] || 0) + 1;
      clubs[player.clubName] = (clubs[player.clubName] || 0) + 1;
    }

    // Check position limits
    for (const [pos, limits] of Object.entries(POSITION_LIMITS)) {
      const count = positions[pos as Position] || 0;
      const posName = POSITION_NAMES[pos as Position].toLowerCase();

      if (count < limits.min || count > limits.max) {
        if (limits.min === limits.max) {
          errors.push(`${count} ${posName}s (need exactly ${limits.min})`);
        } else {
          errors.push(
            `${count} ${posName}s (need ${limits.min}-${limits.max})`
          );
        }
      }
    }

    // Check club limits
    for (const [club, count] of Object.entries(clubs)) {
      if (count > this.rules.maxPlayersPerClub) {
        errors.push(
          `${count} players from ${club} (max ${this.rules.maxPlayersPerClub})`
        );
      }
    }

    // Check budget (warning only)
    const totalValue = players.reduce((sum, p) => sum + p.price, 0);
    if (totalValue > this.rules.budget) {
      warnings.push(
        `Team value £${totalValue.toFixed(1)}m exceeds £${
          this.rules.budget
        }m budget`
      );
    }

    const stats = this.statsService.calculate(players);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        formation: stats.formation,
        totalValue: stats.totalValue,
        clubs,
        positions,
      },
    };
  }

  canAddPlayer(team: Player[], playerIn: Player): boolean {
    const clubCounts: Record<string, number> = {};

    // Count existing clubs
    for (const player of team) {
      clubCounts[player.clubName] = (clubCounts[player.clubName] || 0) + 1;
    }

    // Check if adding new player would exceed limit
    clubCounts[playerIn.clubName] = (clubCounts[playerIn.clubName] || 0) + 1;

    return clubCounts[playerIn.clubName] <= this.rules.maxPlayersPerClub;
  }

  checkClubLimits(team: Player[]): boolean {
    const clubCounts: Record<string, number> = {};

    for (const player of team) {
      clubCounts[player.clubName] = (clubCounts[player.clubName] || 0) + 1;

      if (clubCounts[player.clubName] > this.rules.maxPlayersPerClub) {
        return false;
      }
    }

    return true;
  }
}
