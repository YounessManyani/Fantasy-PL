// src/services/transfers/transferFinder.js
import { validateTransfer as transferValidator } from "./transferValidator.js"; 
// ^ transferValidator is an INSTANCE that exposes .validateTransfer(team, transfer)

/**
 * Assumptions:
 * - `store` exposes:
 *    - getByPosition(position) → Player[]
 *    - club and name fields: player.player_name, player.club_name, player.position, player.price, player.score
 * - A "team" is an array of player objects (same shape as from store).
 * - This class returns transfer suggestions with `gain` based on **fixture-adjusted** scores when a gameweek is provided.
 */
export class TransferFinder {
  // [FDR-RAG] accept fixtureService for fixture-aware scoring
  constructor(store, fixtureService /* [FDR-RAG] */) {
    this.store = store;
    this.fixtureService = fixtureService; // [FDR-RAG]
  }

  /**
   * Find the best single transfer (one out, one in) within budget.
   * @param {Array} team - current team players
   * @param {number} budget - bank in millions
   * @param {number|undefined} gameweek - optional GW to apply fixture factors
   */
  findSingleTransfer(team, budget, gameweek /* [FDR-RAG] */) {
    let best = null;

    for (const playerOut of team) {
      const candidates = this.getCandidates(playerOut, team, budget, gameweek); // [FDR-RAG]
      for (const playerIn of candidates) {
        const transfer = this.createTransfer(playerOut, playerIn, gameweek); // [FDR-RAG]

        // [VALIDATOR] call the method on the validator instance
        const verdict = transferValidator.validateTransfer(team, transfer);
        if (!verdict?.valid) continue;

        if (!best || transfer.gain > best.gain) {
          best = transfer;
        }
      }
    }

    return best;
  }

  /**
   * Find two-step (double) transfer by combining the best singles.
   * Simple heuristic: take top singles and combine when valid.
   */
  findDoubleTransfer(team, budget, gameweek /* [FDR-RAG] */) {
    const singles = this.findAllSingleTransfers(team, budget, gameweek); // [FDR-RAG]
    if (singles.length === 0) return [];

    // Sort singles by adjusted gain desc
    const sorted = [...singles].sort((a, b) => b.gain - a.gain);

    // Try to combine the two best non-conflicting singles
    for (let i = 0; i < Math.min(sorted.length, 10); i++) {
      for (let j = i + 1; j < Math.min(sorted.length, 20); j++) {
        const t1 = sorted[i];
        const t2 = sorted[j];

        // Ensure they don't try to sell the same player twice, or buy the same player
        if (t1.out.name === t2.out.name) continue;
        if (t1.in.name === t2.in.name) continue;

        const combined = [t1, t2];

        // Validate combined against squad rules & budget
        const combinedValid = this.validateDouble(team, combined, budget);
        if (!combinedValid) continue;

        return combined;
      }
    }

    // Fallback: return the single best
    return [sorted[0]];
  }

  /**
   * Enumerate all valid singles (used by double transfer search).
   */
  findAllSingleTransfers(team, budget, gameweek /* [FDR-RAG] */) {
    const transfers = [];

    for (const playerOut of team) {
      const candidates = this.getCandidates(playerOut, team, budget, gameweek); // [FDR-RAG]
      for (const playerIn of candidates) {
        const transfer = this.createTransfer(playerOut, playerIn, gameweek); // [FDR-RAG]

        // [VALIDATOR] call the method on the validator instance
        const verdict = transferValidator.validateTransfer(team, transfer);
        if (!verdict?.valid) continue;

        transfers.push(transfer);
      }
    }

    return transfers;
  }

  /**
   * Candidate pool for replacing playerOut:
   * - Same position
   * - Affordable (<= playerOut.price + budget)
   * - Improves **fixture-adjusted** score vs the playerOut (if GW provided)
   */
  getCandidates(playerOut, team, budget, gameweek /* [FDR-RAG] */) {
    const maxPrice = (playerOut.price ?? 0) + (budget ?? 0);

    // [FDR-RAG] compute adjusted score for the playerOut
    const outFactor = this.getFactorFor(playerOut?.club || playerOut?.club_name, gameweek); // [FDR-RAG]
    const outAdjScore = (playerOut.score || 0) * outFactor; // [FDR-RAG]

    const currentNames = new Set(
      team.map((p) => (p.player_name || p.name || "").toLowerCase())
    );

    return this.store
      .getByPosition(playerOut.position)
      .filter((p) => {
        // Not already in team
        const nm = (p.player_name || p.name || "").toLowerCase();
        if (currentNames.has(nm)) return false;

        // Affordable
        if ((p.price ?? Infinity) > maxPrice) return false;

        // [FDR-RAG] improvement check uses adjusted score (if GW given)
        const inFactor = this.getFactorFor(p.club_name || p.club, gameweek); // [FDR-RAG]
        const inAdjScore = (p.score || 0) * inFactor; // [FDR-RAG]
        if (inAdjScore <= outAdjScore) return false; // [FDR-RAG]

        return true;
      })
      .sort((a, b) => {
        // [FDR-RAG] sort by adjusted score desc when GW given; otherwise raw score
        const fa = this.getFactorFor(a.club_name || a.club, gameweek); // [FDR-RAG]
        const fb = this.getFactorFor(b.club_name || b.club, gameweek); // [FDR-RAG]
        return (b.score * fb) - (a.score * fa); // [FDR-RAG]
      })
      .slice(0, 20);
  }

  /**
   * Build a transfer object that includes fixture context and adjusted scoring.
   */
  createTransfer(playerOut, playerIn, gameweek /* [FDR-RAG] */) {
    // [FDR-RAG] Fixture lookups for both players for this GW
    const outClub = playerOut.club || playerOut.club_name;
    const inClub  = playerIn.club_name || playerIn.club;

    const outFx = this.getFixture(outClub, gameweek); // [FDR-RAG]
    const inFx  = this.getFixture(inClub, gameweek);  // [FDR-RAG]

    const outFactor = outFx ? this.fixtureService.getFactor(outFx.fdr) : 1.0; // [FDR-RAG]
    const inFactor  = inFx  ? this.fixtureService.getFactor(inFx.fdr)  : 1.0; // [FDR-RAG]

    const outAdj = Math.round(((playerOut.score || 0) * outFactor) * 100) / 100; // [FDR-RAG]
    const inAdj  = Math.round(((playerIn.score  || 0) * inFactor)  * 100) / 100; // [FDR-RAG]

    return {
      out: {
        name: playerOut.player_name || playerOut.name,
        club: outClub,
        position: playerOut.position,
        price: playerOut.price,
        score: playerOut.score,
      },
      in: {
        name: playerIn.player_name || playerIn.name,
        club: inClub,
        position: playerIn.position,
        price: playerIn.price,
        score: playerIn.score,
        points_per_game: playerIn.points_per_game,
      },
      gain: Math.round((inAdj - outAdj) * 100) / 100, // [FDR-RAG] adjusted gain
      cost:
        Math.round(((playerIn.price || 0) - (playerOut.price || 0)) * 10) / 10,
      meta: {
        gameweek, // [FDR-RAG]
        out_fixture: outFx || null, // [FDR-RAG]
        in_fixture: inFx || null, // [FDR-RAG]
        out_adjusted: outAdj, // [FDR-RAG]
        in_adjusted: inAdj, // [FDR-RAG]
      },
    };
  }

  /**
   * Validate two transfers together against budget and simple constraints.
   * NOTE: This is a lightweight check. Your existing `validateTransfer` already
   * enforces FPL rules per transfer; here we check combined budget impact.
   */
  validateDouble(team, transfers, budget) {
    const curValue = team.reduce((s, p) => s + (p.price || 0), 0);
    // Apply both transfers' price deltas
    const newValue =
      curValue +
      transfers.reduce(
        (d, t) => d + ((t.in.price || 0) - (t.out.price || 0)),
        0
      );
    return newValue - curValue <= budget + 1e-9;
  }

  // -----------------------------
  // Internal helpers (FDR-aware)
  // -----------------------------

  /**
   * [FDR-RAG] Safe fixture lookup for a club/GW.
   */
  getFixture(club, gameweek) {
    if (!this.fixtureService || !gameweek) return null;
    if (!club) return null;
    return this.fixtureService.getFixture(club, gameweek);
  }

  /**
   * [FDR-RAG] Get fixture multiplier (defaults to 1.0 if no service/GW/fixture).
   */
  getFactorFor(club, gameweek) {
    if (!this.fixtureService || !gameweek) return 1.0;
    const fx = this.fixtureService.getFixture(club, gameweek);
    return fx ? this.fixtureService.getFactor(fx.fdr) : 1.0;
  }
}
