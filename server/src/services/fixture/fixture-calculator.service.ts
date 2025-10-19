import { Fixture, FixtureData, FixtureFactors, Difficulty } from "../../types";
import { normalizeClub } from "../name/name-normalizer.service";
import { createLogger } from "../../utils/logger.utils";

const logger = createLogger("FixtureCalculator");

const DEFAULT_FACTORS: FixtureFactors = {
  easy: 1.1,
  medium: 1.0,
  hard: 0.9,
};

export interface IFixtureCalculatorService {
  getFixture(clubName: string, gameweek: number): Fixture | null;
  getFactor(fdr: number): number;
  getFactorForFixture(clubName: string, gameweek: number): number;
  getDifficultyLabel(fdr: number): Difficulty;
}

export class FixtureCalculatorService implements IFixtureCalculatorService {
  private fixtures: FixtureData;
  private factors: FixtureFactors;

  constructor(
    fixtures: FixtureData,
    factors: FixtureFactors = DEFAULT_FACTORS
  ) {
    this.fixtures = fixtures;
    this.factors = factors;
  }

  getFixture(clubName: string, gameweek: number): Fixture | null {
    if (!clubName || !gameweek) return null;

    const clubKey = this.resolveClubKey(clubName);
    const raw = clubKey ? this.fixtures[clubKey]?.[String(gameweek)] : null;

    if (!raw || typeof raw.fdr !== "number") return null;

    return {
      opponent: raw.opponent,
      home: !!raw.home,
      fdr: raw.fdr,
      difficulty: this.getDifficultyLabel(raw.fdr),
    };
  }

  getDifficultyLabel(fdr: number): Difficulty {
    if (fdr <= 2) return "easy";
    if (fdr === 3) return "medium";
    return "hard";
  }

  getFactor(fdr: number): number {
    const label = this.getDifficultyLabel(fdr ?? 3);
    return this.factors[label] ?? 1.0;
  }

  getFactorForFixture(clubName: string, gameweek: number): number {
    const fixture = this.getFixture(clubName, gameweek);
    return fixture ? this.getFactor(fixture.fdr) : 1.0;
  }

  private resolveClubKey(clubName: string): string | undefined {
    const normalized = normalizeClub(clubName);
    return Object.keys(this.fixtures).find(
      (key) => normalizeClub(key) === normalized
    );
  }
}
