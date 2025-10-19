import type { Player, Position } from './index';

export type Formation = '3-4-3' | '3-5-2' | '4-3-3' | '4-4-2' | '4-5-1' | '5-3-2' | '5-4-1';

export interface FormationConfig {
  defenders: number;
  midfielders: number;
  forwards: number;
}

export interface Fixture {
  opponent: string;
  home: boolean;
  fdr: number;
}

export interface EnrichedPlayer extends Player {
  nextFixture: Fixture | null;
  adjustedScore: number;
}

export interface TransferRecommendation {
  out: EnrichedPlayer;
  in: EnrichedPlayer;
  gain: number;
  explanation: string;
}

export interface ParsedTeamResult {
  players: EnrichedPlayer[];
  totalValue: number;
  formation: Formation;
  avgScore: number;
  transfers?: TransferRecommendation[];
  totalGain?: number;
}

export interface PlayerSlot {
  position: Position;
  index: number;
}

export const FORMATIONS: Record<Formation, FormationConfig> = {
  '3-4-3': { defenders: 3, midfielders: 4, forwards: 3 },
  '3-5-2': { defenders: 3, midfielders: 5, forwards: 2 },
  '4-3-3': { defenders: 4, midfielders: 3, forwards: 3 },
  '4-4-2': { defenders: 4, midfielders: 4, forwards: 2 },
  '4-5-1': { defenders: 4, midfielders: 5, forwards: 1 },
  '5-3-2': { defenders: 5, midfielders: 3, forwards: 2 },
  '5-4-1': { defenders: 5, midfielders: 4, forwards: 1 },
};