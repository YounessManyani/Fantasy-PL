import { Player, TeamStats, Position } from '../../types';
import { POSITION_LIMITS } from '../../models/constants/positions.constants';

export interface ITeamStatsService {
  calculate(players: Player[]): TeamStats;
  getFormation(byPosition: Record<Position, number>): string;
}

export class TeamStatsService implements ITeamStatsService {
  calculate(players: Player[]): TeamStats {
    const stats: TeamStats = {
      totalValue: 0,
      byPosition: {} as Record<Position, number>,
      byClub: {},
      averageScore: 0,
      formation: 'Invalid'
    };

    if (players.length === 0) return stats;

    let totalScore = 0;

    for (const player of players) {
      stats.totalValue += player.price;
      totalScore += player.score;

      // Count by position
      stats.byPosition[player.position] = (stats.byPosition[player.position] || 0) + 1;

      // Count by club
      stats.byClub[player.clubName] = (stats.byClub[player.clubName] || 0) + 1;
    }

    stats.totalValue = Math.round(stats.totalValue * 10) / 10;
    stats.averageScore = Math.round((totalScore / players.length) * 100) / 100;
    stats.formation = this.getFormation(stats.byPosition);

    return stats;
  }

  getFormation(byPosition: Record<Position, number>): string {
    const gk = byPosition.GK || 0;
    const def = byPosition.DEF || 0;
    const mid = byPosition.MID || 0;
    const fwd = byPosition.FWD || 0;

    const limits = POSITION_LIMITS;

    if (
      gk === limits.GK.min &&
      def >= limits.DEF.min &&
      def <= limits.DEF.max &&
      mid >= limits.MID.min &&
      mid <= limits.MID.max &&
      fwd >= limits.FWD.min &&
      fwd <= limits.FWD.max
    ) {
      return `${def}-${mid}-${fwd}`;
    }

    return 'Invalid';
  }
}