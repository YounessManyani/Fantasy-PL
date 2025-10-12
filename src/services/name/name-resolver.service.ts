import { Player, ResolveOptions } from '../../types';
import { IPlayerStoreService } from '../player/player-store.service';
import { INameNormalizerService } from './name-normalizer.service';
import { INameCacheService } from './name-cache.service';
import { IPlayerSearchService } from '../player/player-search.service';
import { ILLMManagerService } from '../llm/llm-manager.service';
import { createLogger } from '../../utils/logger.utils';

const logger = createLogger('NameResolver');

export interface INameResolverService {
  resolve(rawName: string, options?: ResolveOptions): Promise<Player | null>;
  clearCache(): void;
}

export class NameResolverService implements INameResolverService {
  constructor(
    private playerStore: IPlayerStoreService,
    private normalizer: INameNormalizerService,
    private cache: INameCacheService,
    private searchService: IPlayerSearchService,
    private llmService?: ILLMManagerService
  ) {}

  async resolve(rawName: string, options: ResolveOptions = {}): Promise<Player | null> {
    const { clubHint, strictMode = false, useLLM = false } = options;

    // Check cache
    const cacheKey = this.getCacheKey(rawName, clubHint, strictMode);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      logger.debug(`Cache hit for "${rawName}"`, { found: !!cached });
      return cached || null;
    }

    logger.debug(`Resolving "${rawName}"`, { strictMode, useLLM });

    // Try deterministic resolution
    let player = this.resolveDeterministic(rawName, clubHint, strictMode);

    if (player) {
      logger.debug(`Deterministic match: ${player.playerName}`);
    }

    // Try LLM if enabled and no match
    if (!player && useLLM && this.llmService) {
      logger.debug(`Attempting LLM resolution for "${rawName}"`);
      player = await this.resolveLLM(rawName, clubHint);

      if (player) {
        logger.info(`✨ LLM resolved "${rawName}" to "${player.playerName}"`);
        (player as any).__llm_resolved = true;
      }
    }

    // Cache result
    this.cache.set(cacheKey, player);
    return player;
  }

  private resolveDeterministic(
    rawName: string,
    clubHint?: string,
    strictMode?: boolean
  ): Player | null {
    const normalized = this.normalizer.normalize(rawName);
    const tokens = normalized.split(' ').filter(Boolean);

    // Strict mode requires at least 2 tokens
    if (strictMode && tokens.length < 2) {
      return null;
    }

    // 1. Check aliases
    const aliased = this.normalizer.resolveAlias(normalized);
    if (aliased) {
      const player = this.playerStore.getByName(this.normalizer.normalize(aliased));
      if (player && this.matchesClub(player, clubHint)) {
        return player;
      }
    }

    // 2. Exact match
    const exact = this.playerStore.getByName(normalized);
    if (exact && this.matchesClub(exact, clubHint)) {
      return exact;
    }

    // 3. Surname match (for single token)
    if (tokens.length === 1) {
      const surname = tokens[0];
      const bySurname = this.playerStore.getBySurname(surname);

      if (bySurname.length === 1 && this.matchesClub(bySurname[0], clubHint)) {
        return bySurname[0];
      }

      // Multiple with same surname - pick most prominent
      if (bySurname.length > 1) {
        const filtered = clubHint
          ? bySurname.filter(p => this.matchesClub(p, clubHint))
          : bySurname;

        if (filtered.length > 0) {
          return filtered.reduce((best, player) =>
            this.playerStore.getProminence(player) > this.playerStore.getProminence(best)
              ? player
              : best
          );
        }
      }
    }

    // 4. Fuzzy matching
    const candidates = this.searchService.findBestMatches(normalized, clubHint, 10);
    if (candidates.length > 0) {
      const threshold = strictMode ? 0.8 : 0.6;
      const best = candidates[0];

      if (best.similarity >= threshold) {
        return best.player;
      }
    }

    return null;
  }

  private async resolveLLM(rawName: string, clubHint?: string): Promise<Player | null> {
    if (!this.llmService) {
      return null;
    }

    try {
      const candidates = this.searchService.findBestMatches(
        this.normalizer.normalize(rawName),
        clubHint,
        15
      );

      if (candidates.length === 0) {
        return null;
      }

      logger.debug(`LLM: Found ${candidates.length} candidates`);

      const result = await this.llmService.resolvePlayerName(
        rawName,
        candidates.map(c => c.player),
        clubHint
      );

      return result;
    } catch (error: any) {
      logger.error('LLM resolution failed', error);
      return null;
    }
  }

  private matchesClub(player: Player, clubHint?: string): boolean {
    if (!clubHint) return true;
    return (
      this.normalizer.normalizeClub(player.clubName) ===
      this.normalizer.normalizeClub(clubHint)
    );
  }

  private getCacheKey(name: string, club?: string, strict?: boolean): string {
    return JSON.stringify([name, club || '', strict || false]);
  }

  clearCache(): void {
    this.cache.clear();
  }
}