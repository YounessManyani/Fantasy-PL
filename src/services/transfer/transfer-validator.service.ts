import { Player, Transfer, Position, ValidationResult } from '../../types';
import { FPLRules } from '../../types/config.types';
import { createLogger } from '../../utils/logger.utils';

const logger = createLogger('TransferValidator');

export interface ITransferValidatorService {
  validateTransfer(team: Player[], transfer: Transfer): ValidationResult;
  canAddPlayer(team: Player[], playerIn: Player): boolean;
  checkClubLimits(team: Player[]): boolean;
}

export class TransferValidatorService implements ITransferValidatorService {
  constructor(private rules: FPLRules) {}

  validateTransfer(team: Player[], transfer: Transfer): ValidationResult {
    const errors: string[] = [];

    // Check if player out is in team
    const hasPlayerOut = team.some(p => p.playerName === transfer.out.playerName);
    if (!hasPlayerOut) {
      errors.push(`Player ${transfer.out.playerName} not in team`);
    }

    // Check if player in is not already in team
    const hasPlayerIn = team.some(p => p.playerName === transfer.in.playerName);
    if (hasPlayerIn) {
      errors.push(`Player ${transfer.in.playerName} already in team`);
    }

    // Check positions match
    if (transfer.out.position !== transfer.in.position) {
      errors.push(
        `Position mismatch: ${transfer.out.position} → ${transfer.in.position}`
      );
    }

    // Check club limits
    const tempTeam = team.filter(p => p.playerName !== transfer.out.playerName);
    if (!this.canAddPlayer(tempTeam, transfer.in)) {
      errors.push(
        `Would exceed ${this.rules.maxPlayersPerClub} player limit for ${transfer.in.clubName}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: []
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