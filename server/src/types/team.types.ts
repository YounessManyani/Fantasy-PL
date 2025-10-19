import { Player, EnrichedPlayer, Position, PlayerSuggestion } from './player.types';

export interface TeamStats {
  totalValue: number;
  byPosition: Record<Position, number>;
  byClub: Record<string, number>;
  averageScore: number;
  formation: string;
}

export interface ParsedTeam {
  players: EnrichedPlayer[];
  unknown: string[];
  duplicates: string[];
  suggestions: Record<string, PlayerSuggestion[]>;
  stats: TeamStats;
  validation?: ValidationResult;
  llmStats?: LLMStats;
  debug?: DebugInfo;
}

export interface LLMStats {
  attempted: number;
  resolved: number;
  names: Array<{
    input: string;
    matched: string;
  }>;
}

export interface DebugInfo {
  llmRequested: boolean;
  llmAvailable: boolean;
  llmUsed: boolean;
  unknownCount: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats?: {
    formation: string;
    totalValue: number;
    clubs: Record<string, number>;
    positions: Record<Position, number>;
  };
}

export interface ParseOptions {
  strictMode?: boolean;
  includeSuggestions?: boolean;
  useLLM?: boolean;
  gameweek?: number;
}

export interface ResolveOptions {
  clubHint?: string;
  strictMode?: boolean;
  useLLM?: boolean;
}