import stringSimilarity from 'string-similarity';
import { Player, PlayerSuggestion } from '../../types';
import { IPlayerStoreService } from './player-store.service';
import { normalizeName } from '../../utils/string.utils';

export interface IPlayerSearchService {
  findSuggestions(name: string, limit?: number): PlayerSuggestion[];
  findBestMatches(name: string, clubHint?: string, limit?: number): Array<{ player: Player; similarity: number }>;
}

export class PlayerSearchService implements IPlayerSearchService {
  constructor(private playerStore: IPlayerStoreService) {}

  findSuggestions(name: string, limit: number = 3): PlayerSuggestion[] {
    const normalized = normalizeName(name);
    const allNames = this.playerStore.getAllNormalizedNames();

    if (allNames.length === 0) return [];

    const matches = stringSimilarity.findBestMatch(normalized, allNames);

    return matches.ratings
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
      .map(match => {
        const player = this.playerStore.getByName(match.target)!;
        return {
          name: player.playerName,
          club: player.clubName,
          similarity: Math.round(match.rating * 100)
        };
      });
  }

  findBestMatches(
    name: string,
    clubHint?: string,
    limit: number = 10
  ): Array<{ player: Player; similarity: number }> {
    const normalized = normalizeName(name);
    const allNames = this.playerStore.getAllNormalizedNames();

    const matches = stringSimilarity.findBestMatch(normalized, allNames);

    return matches.ratings
      .map(match => ({
        player: this.playerStore.getByName(match.target)!,
        similarity: match.rating
      }))
      .filter(({ player }) => {
        if (!clubHint) return true;
        return normalizeName(player.clubName).includes(normalizeName(clubHint));
      })
      .sort((a, b) => {
        // Sort by similarity, then by prominence
        if (Math.abs(a.similarity - b.similarity) > 0.05) {
          return b.similarity - a.similarity;
        }
        return (
          this.playerStore.getProminence(b.player) -
          this.playerStore.getProminence(a.player)
        );
      })
      .slice(0, limit);
  }
}