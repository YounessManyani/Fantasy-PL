export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: number;
  playerName: string;
  normalizedName: string;
  surname: string;
  webName: string;
  clubName: string;
  position: Position;
  rawPosition: string;
  price: number;
  score: number;
  pointsPerGame: number;
  totalPoints: number;
  minutes: number;
}

export interface EnrichedPlayer extends Player {
  nextFixture: import('./fixture.types').Fixture | null;
  adjustedScore: number;
}

export interface PlayerFilters {
  position?: Position;
  club?: string;
  maxPrice?: number;
  minScore?: number;
}

export interface PlayerStats {
  pointsPerGame: number;
  goalsScored: number;
  assists: number;
  cleanSheets: number;
  saves: number;
  goalsConceded: number;
  bonus: number;
  yellowCards: number;
  redCards: number;
  expectedGoalInvolvements: number;
}

export interface PlayerSuggestion {
  name: string;
  club: string;
  similarity: number;
}