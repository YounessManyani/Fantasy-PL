import { Player, Transfer, TransferMeta } from "../../types";
import { IPlayerStoreService } from "../player/player-store.service";
import { IFixtureCalculatorService } from "../fixture/fixture-calculator.service";
import { ITransferValidatorService } from "./transfer-validator.service";
import { createLogger } from "../../utils/logger.utils";
import { round } from "../../utils/math.utils";

const logger = createLogger("TransferFinder");

export interface ITransferFinderService {
  findSingleTransfer(
    team: Player[],
    budget: number,
    gameweek?: number
  ): Transfer | null;
  findDoubleTransfer(
    team: Player[],
    budget: number,
    gameweek?: number
  ): Transfer[];
  findAllSingleTransfers(
    team: Player[],
    budget: number,
    gameweek?: number
  ): Transfer[];
}

export class TransferFinderService implements ITransferFinderService {
  constructor(
    private playerStore: IPlayerStoreService,
    private fixtureCalculator: IFixtureCalculatorService,
    private validator: ITransferValidatorService
  ) {}

  findSingleTransfer(
    team: Player[],
    budget: number,
    gameweek?: number
  ): Transfer | null {
    logger.debug("Finding single transfer", {
      teamSize: team.length,
      budget,
      gameweek,
    });

    let best: Transfer | null = null;

    for (const playerOut of team) {
      const candidates = this.getCandidates(playerOut, team, budget, gameweek);

      for (const playerIn of candidates) {
        const transfer = this.createTransfer(playerOut, playerIn, gameweek);

        // Validate transfer
        const validation = this.validator.validateTransfer(team, transfer);
        if (!validation.valid) continue;

        if (!best || transfer.gain > best.gain) {
          best = transfer;
        }
      }
    }

    if (best) {
      logger.info("Found single transfer", {
        out: best.out.playerName,
        in: best.in.playerName,
        gain: best.gain,
      });
    } else {
      logger.debug("No valid single transfer found");
    }

    return best;
  }

  findDoubleTransfer(
    team: Player[],
    budget: number,
    gameweek?: number
  ): Transfer[] {
    logger.debug("Finding double transfer", {
      teamSize: team.length,
      budget,
      gameweek,
    });

    const singles = this.findAllSingleTransfers(team, budget, gameweek);
    if (singles.length === 0) return [];

    // Sort by gain descending
    const sorted = [...singles].sort((a, b) => b.gain - a.gain);

    // Try to combine the two best non-conflicting singles
    for (let i = 0; i < Math.min(sorted.length, 10); i++) {
      for (let j = i + 1; j < Math.min(sorted.length, 20); j++) {
        const t1 = sorted[i];
        const t2 = sorted[j];

        // Ensure no conflicts
        if (t1.out.playerName === t2.out.playerName) continue;
        if (t1.in.playerName === t2.in.playerName) continue;

        const combined = [t1, t2];

        // Validate combined budget
        if (this.validateDoubleBudget(team, combined, budget)) {
          logger.info("Found double transfer", {
            transfers: combined.length,
            totalGain: combined.reduce((sum, t) => sum + t.gain, 0),
          });
          return combined;
        }
      }
    }

    // Fallback to single best
    return [sorted[0]];
  }

  findAllSingleTransfers(
    team: Player[],
    budget: number,
    gameweek?: number
  ): Transfer[] {
    const transfers: Transfer[] = [];

    for (const playerOut of team) {
      const candidates = this.getCandidates(playerOut, team, budget, gameweek);

      for (const playerIn of candidates) {
        const transfer = this.createTransfer(playerOut, playerIn, gameweek);

        const validation = this.validator.validateTransfer(team, transfer);
        if (!validation.valid) continue;

        transfers.push(transfer);
      }
    }

    logger.debug("Found all single transfers", { count: transfers.length });
    return transfers;
  }

  private getCandidates(
    playerOut: Player,
    team: Player[],
    budget: number,
    gameweek?: number
  ): Player[] {
    const maxPrice = playerOut.price + budget;

    // Get fixture-adjusted score for playerOut
    const outFactor = this.getFactorFor(playerOut.clubName, gameweek);
    const outAdjScore = playerOut.score * outFactor;

    // Get current team names
    const currentNames = new Set(team.map((p) => p.playerName.toLowerCase()));

    return this.playerStore
      .getByPosition(playerOut.position)
      .filter((p) => {
        // Not already in team
        if (currentNames.has(p.playerName.toLowerCase())) return false;

        // Affordable
        if (p.price > maxPrice) return false;

        // Improvement check (fixture-adjusted)
        const inFactor = this.getFactorFor(p.clubName, gameweek);
        const inAdjScore = p.score * inFactor;

        return inAdjScore > outAdjScore;
      })
      .sort((a, b) => {
        const fa = this.getFactorFor(a.clubName, gameweek);
        const fb = this.getFactorFor(b.clubName, gameweek);
        return b.score * fb - a.score * fa;
      })
      .slice(0, 20);
  }

  private createTransfer(
    playerOut: Player,
    playerIn: Player,
    gameweek?: number
  ): Transfer {
    // Get fixtures for both players
    const outFixture = gameweek
      ? this.fixtureCalculator.getFixture(playerOut.clubName, gameweek)
      : null;
    const inFixture = gameweek
      ? this.fixtureCalculator.getFixture(playerIn.clubName, gameweek)
      : null;

    // Calculate adjusted scores
    const outFactor = outFixture
      ? this.fixtureCalculator.getFactor(outFixture.fdr)
      : 1.0;
    const inFactor = inFixture
      ? this.fixtureCalculator.getFactor(inFixture.fdr)
      : 1.0;

    const outAdjusted = round(playerOut.score * outFactor);
    const inAdjusted = round(playerIn.score * inFactor);

    const meta: TransferMeta | undefined = gameweek
      ? {
          gameweek,
          outFixture,
          inFixture,
          outAdjusted,
          inAdjusted,
        }
      : undefined;

    return {
      out: playerOut,
      in: playerIn,
      gain: round(inAdjusted - outAdjusted),
      cost: round(playerIn.price - playerOut.price),
      meta,
    };
  }

  private validateDoubleBudget(
    team: Player[],
    transfers: Transfer[],
    budget: number
  ): boolean {
    const currentValue = team.reduce((sum, p) => sum + p.price, 0);
    const newValue =
      currentValue +
      transfers.reduce((delta, t) => delta + (t.in.price - t.out.price), 0);
    return newValue - currentValue <= budget + 1e-9;
  }

  private getFactorFor(clubName: string, gameweek?: number): number {
    if (!gameweek) return 1.0;
    return this.fixtureCalculator.getFactorForFixture(clubName, gameweek);
  }
}
