export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: number;
  playerName: string;
  clubName: string;
  position: Position;
  price: number;
  score: number;
  pointsPerGame: number;
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
  formation: string;
  avgScore: number;
  transfers?: TransferRecommendation[];
  totalGain?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}