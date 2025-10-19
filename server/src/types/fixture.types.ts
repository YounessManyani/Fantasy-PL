export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Fixture {
  opponent: string;
  home: boolean;
  fdr: number;
  difficulty: Difficulty;
}

export interface FixtureRun {
  club: string;
  gameweeks: string;
  fixtures: FixtureDetail[];
  summary: FixtureSummary;
}

export interface FixtureDetail {
  gw: number;
  opponent: string;
  venue: 'H' | 'A';
  fdr: number;
  difficulty: Difficulty;
}

export interface FixtureSummary {
  averageFdr: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  rating: string;
}

export interface FixtureFactors {
  easy: number;
  medium: number;
  hard: number;
}

export interface FixtureData {
  [club: string]: {
    [gameweek: string]: {
      opponent: string;
      home: boolean;
      fdr: number;
    };
  };
}