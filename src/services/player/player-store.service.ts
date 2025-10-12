import { Player, PlayerFilters, Position } from '../../types';
import { normalizeClub } from '../name/name-normalizer.service';
import { createLogger } from '../../utils/logger.utils';

const logger = createLogger('PlayerStore');

export interface IPlayerStoreService {
  getAll(): Player[];
  getById(id: number): Player | undefined;
  getByName(normalizedName: string): Player | undefined;
  getBySurname(surname: string): Player[];
  getByClub(clubName: string): Player[];
  getByPosition(position: Position): Player[];
  search(filters: PlayerFilters): Player[];
  getAllNormalizedNames(): string[];
  getProminence(player: Player): number;
  getTopPlayersByPosition(position: Position, limit?: number): Player[];
}

export class PlayerStoreService implements IPlayerStoreService {
  private players: Player[];
  private indexes: {
    byName: Map<string, Player>;
    bySurname: Map<string, Player[]>;
    byClub: Map<string, Player[]>;
    byPosition: Map<Position, Player[]>;
  };

  constructor(players: Player[]) {
    this.players = players;
    this.indexes = this.buildIndexes();
    logger.info('Player store initialized', { count: players.length });
  }

  private buildIndexes() {
    const indexes = {
      byName: new Map<string, Player>(),
      bySurname: new Map<string, Player[]>(),
      byClub: new Map<string, Player[]>(),
      byPosition: new Map<Position, Player[]>()
    };

    for (const player of this.players) {
      // Index by normalized name
      indexes.byName.set(player.normalizedName, player);

      // Index by surname
      if (!indexes.bySurname.has(player.surname)) {
        indexes.bySurname.set(player.surname, []);
      }
      indexes.bySurname.get(player.surname)!.push(player);

      // Index by club
      const normalizedClub = normalizeClub(player.clubName);
      if (!indexes.byClub.has(normalizedClub)) {
        indexes.byClub.set(normalizedClub, []);
      }
      indexes.byClub.get(normalizedClub)!.push(player);

      // Index by position
      if (!indexes.byPosition.has(player.position)) {
        indexes.byPosition.set(player.position, []);
      }
      indexes.byPosition.get(player.position)!.push(player);
    }

    return indexes;
  }

  getAll(): Player[] {
    return this.players;
  }

  getById(id: number): Player | undefined {
    return this.players.find(p => p.id === id);
  }

  getByName(normalizedName: string): Player | undefined {
    return this.indexes.byName.get(normalizedName);
  }

  getBySurname(surname: string): Player[] {
    return this.indexes.bySurname.get(surname) || [];
  }

  getByClub(clubName: string): Player[] {
    const normalized = normalizeClub(clubName);
    return this.indexes.byClub.get(normalized) || [];
  }

  getByPosition(position: Position): Player[] {
    return this.indexes.byPosition.get(position) || [];
  }

  getAllNormalizedNames(): string[] {
    return Array.from(this.indexes.byName.keys());
  }

  getProminence(player: Player): number {
    const totalPoints = player.totalPoints || 0;
    const minutes = player.minutes || 0;
    const ppg = player.pointsPerGame || 0;
    const price = player.price || 0;

    const score =
      Math.log10(1 + totalPoints) * 0.4 +
      Math.log10(1 + minutes) * 0.3 +
      ppg * 0.2 +
      price * 0.1;

    return Math.max(0, Math.min(1, score / 10));
  }

  getTopPlayersByPosition(position: Position, limit: number = 50): Player[] {
    return this.getByPosition(position)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  search(filters: PlayerFilters): Player[] {
    let results = [...this.players];

    if (filters.position) {
      results = results.filter(p => p.position === filters.position);
    }

    if (filters.club) {
      const normalizedClub = normalizeClub(filters.club);
      results = results.filter(p => normalizeClub(p.clubName) === normalizedClub);
    }

    if (filters.maxPrice !== undefined) {
      results = results.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters.minScore !== undefined) {
      results = results.filter(p => p.score >= filters.minScore!);
    }

    return results;
  }
}