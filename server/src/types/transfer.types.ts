import { Player } from './player.types';
import { Fixture } from './fixture.types';

export interface Transfer {
  out: Player;
  in: Player;
  gain: number;
  cost: number;
  meta?: TransferMeta;
}

export interface TransferMeta {
  gameweek?: number;
  outFixture?: Fixture | null;
  inFixture?: Fixture | null;
  outAdjusted?: number;
  inAdjusted?: number;
}

export interface TransferImpact {
  scoreGain: number;
  cost: number;
  transfersUsed: number;
  averageGain: number;
}

export interface TransferRecommendation {
  success: boolean;
  transfers: Transfer[];
  impact: TransferImpact;
  explanation: string;
  newTeam: Player[];
  comparison?: TeamComparison;
  validation?: string[];
  difficultySummary?: DifficultySummary;
  llmExplanation?: string;
}

export interface TeamComparison {
  old: ComparisonStats;
  new: ComparisonStats;
  improvements: {
    totalScore: number;
    averageScore: number;
    valueChange: number;
  };
}

export interface ComparisonStats {
  totalValue: number;
  totalScore: number;
  averageScore: number;
  playerCount: number;
  byPosition: Record<string, number>;
  byClub: Record<string, number>;
}

export interface DifficultySummary {
  before: Record<string, number>;
  after: Record<string, number>;
}

export interface RecommendOptions {
  bank?: number;
  maxTransfers?: number;
  strategy?: 'best_gain' | 'best_value' | 'balanced';
  gameweek?: number;
}