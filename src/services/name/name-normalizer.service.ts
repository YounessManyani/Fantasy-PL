import { normalizeName, stripAccents } from '../../utils/string.utils';
import { CLUB_SYNONYMS } from '../../models/constants/clubs.constants';
import { PLAYER_ALIASES } from '../../models/constants/player-aliases.constants';

export interface INameNormalizerService {
  normalize(name: string): string;
  normalizeClub(club: string): string;
  resolveAlias(normalizedName: string): string | null;
  stripAccents(str: string): string;
}

export class NameNormalizerService implements INameNormalizerService {
  normalize(name: string): string {
    return normalizeName(name);
  }

  normalizeClub(club: string): string {
    const normalized = normalizeName(club);
    return CLUB_SYNONYMS[normalized] || normalized;
  }

  resolveAlias(normalizedName: string): string | null {
    return PLAYER_ALIASES[normalizedName] || null;
  }

  stripAccents(str: string): string {
    return stripAccents(str);
  }
}

// Export helper function for backward compatibility
export function normalizeClub(club: string): string {
  const normalized = normalizeName(club);
  return CLUB_SYNONYMS[normalized] || normalized;
}