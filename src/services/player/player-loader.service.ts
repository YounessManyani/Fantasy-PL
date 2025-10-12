import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { Player, PlayerStats, Position } from '../../types';
import { normalizeName, extractSurname } from '../../utils/string.utils';
import { zScore } from '../../utils/math.utils';
import { createLogger } from '../../utils/logger.utils';
import { POSITIONS } from '../../models/constants/positions.constants';

const logger = createLogger('PlayerLoader');

// Z-score statistics from dataset
const Z_MEANS = {
  pointsPerGame: 1.4328147100424329,
  goalsScored: 0.07213578500707214,
  assists: 0.06647807637906648,
  cleanSheets: 0.2347949080622348,
  saves: 0.12871287128712872,
  goalsConceded: 0.809052333804809,
  bonus: 0.17256011315417255,
  yellowCards: 0.09476661951909476,
  redCards: 0.004243281471004243,
  expectedGoalInvolvements: 0.11891089108910892
};

const Z_STDDEVS = {
  pointsPerGame: 2.202627561252349,
  goalsScored: 0.2992708606605565,
  assists: 0.28112607069430867,
  cleanSheets: 0.4742656726290995,
  saves: 0.8199140334356423,
  goalsConceded: 1.461056013564097,
  bonus: 0.6458962679568987,
  yellowCards: 0.3116108544322986,
  redCards: 0.06500212329887455,
  expectedGoalInvolvements: 0.27477562245602194
};

export interface IPlayerLoaderService {
  load(): Player[];
}

export class PlayerLoaderService implements IPlayerLoaderService {
  constructor(private csvPath: string) {}

  load(): Player[] {
    logger.info('Loading players from CSV', { path: this.csvPath });

    const text = readFileSync(this.csvPath, 'utf8');
    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true
    });

    if (!rows.length) {
      throw new Error('No data found in CSV');
    }

    const required = [
      'player_name',
      'club_name',
      'position_name',
      'now_cost',
      'points_per_game'
    ];

    const columns = Object.keys(rows[0]);
    const missing = required.filter(col => !columns.includes(col));

    if (missing.length) {
      throw new Error(`Missing required columns: ${missing.join(', ')}`);
    }

    const players = rows.map((row: any, index: number) => 
      this.parsePlayer(row, index)
    );

    logger.info('Players loaded successfully', { count: players.length });
    return players;
  }

  private parsePlayer(row: any, index: number): Player {
    const rawPosition = row.position_name;
    const position = this.normalizePosition(rawPosition);
    const normalizedName = normalizeName(row.player_name);

    const stats: PlayerStats = {
      pointsPerGame: parseFloat(row.points_per_game) || 0,
      goalsScored: parseFloat(row.goals_scored) || 0,
      assists: parseFloat(row.assists) || 0,
      cleanSheets: parseFloat(row.clean_sheets) || 0,
      saves: parseFloat(row.saves) || 0,
      goalsConceded: parseFloat(row.goals_conceded) || 0,
      bonus: parseFloat(row.bonus) || 0,
      yellowCards: parseFloat(row.yellow_cards) || 0,
      redCards: parseFloat(row.red_cards) || 0,
      expectedGoalInvolvements: parseFloat(row.expected_goal_involvements) || 0
    };

    const score = this.calculateScore(position, stats);

    return {
      id: index,
      playerName: row.player_name,
      normalizedName,
      surname: extractSurname(normalizedName),
      webName: row.web_name || '',
      clubName: row.club_name,
      position,
      rawPosition,
      price: parseFloat(row.now_cost) || 0,
      score,
      pointsPerGame: stats.pointsPerGame,
      totalPoints: parseFloat(row.total_points) || 0,
      minutes: parseFloat(row.minutes) || 0
    };
  }

  private normalizePosition(position: string): Position {
    const pos = position.toUpperCase().trim();
    return (POSITIONS[pos] as Position) || (pos as Position);
  }

  private calculateScore(position: Position, stats: PlayerStats): number {
    const ppgZ = zScore(stats.pointsPerGame, Z_MEANS.pointsPerGame, Z_STDDEVS.pointsPerGame);
    const goalsZ = zScore(stats.goalsScored, Z_MEANS.goalsScored, Z_STDDEVS.goalsScored);
    const assistsZ = zScore(stats.assists, Z_MEANS.assists, Z_STDDEVS.assists);
    const csZ = zScore(stats.cleanSheets, Z_MEANS.cleanSheets, Z_STDDEVS.cleanSheets);
    const savesZ = zScore(stats.saves, Z_MEANS.saves, Z_STDDEVS.saves);
    const gcZ = zScore(stats.goalsConceded, Z_MEANS.goalsConceded, Z_STDDEVS.goalsConceded);
    const bonusZ = zScore(stats.bonus, Z_MEANS.bonus, Z_STDDEVS.bonus);
    const yellowZ = zScore(stats.yellowCards, Z_MEANS.yellowCards, Z_STDDEVS.yellowCards);
    const redZ = zScore(stats.redCards, Z_MEANS.redCards, Z_STDDEVS.redCards);
    const xgiZ = zScore(stats.expectedGoalInvolvements, Z_MEANS.expectedGoalInvolvements, Z_STDDEVS.expectedGoalInvolvements);

    switch (position) {
      case 'GK':
        return 0.4 * ppgZ + 0.3 * csZ + 0.2 * savesZ - 0.2 * gcZ + 0.1 * bonusZ - 0.3 * yellowZ - 0.5 * redZ;

      case 'DEF':
        return 0.3 * ppgZ + 0.25 * csZ + 0.15 * goalsZ + 0.15 * assistsZ - 0.2 * gcZ + 0.1 * bonusZ - 0.3 * yellowZ - 0.5 * redZ;

      case 'MID':
        return 0.35 * ppgZ + 0.25 * xgiZ + 0.2 * goalsZ + 0.15 * assistsZ + 0.05 * bonusZ - 0.25 * yellowZ - 0.4 * redZ;

      case 'FWD':
        return 0.45 * ppgZ + 0.35 * xgiZ + 0.15 * goalsZ + 0.05 * assistsZ - 0.3 * yellowZ - 0.4 * redZ;

      default:
        return 0.35 * ppgZ + 0.25 * xgiZ + 0.2 * goalsZ + 0.15 * assistsZ + 0.05 * bonusZ - 0.25 * yellowZ - 0.4 * redZ;
    }
  }
}