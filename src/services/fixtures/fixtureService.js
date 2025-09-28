// src/services/fixtures/fixtureService.js
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeClub } from "../../core/normalizer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const raw = readFileSync(
  join(__dirname, "../../data/fdr_2025_26.json"),
  "utf8"
);
const fdrMap = JSON.parse(raw);
/**
 * FDR → label → multiplier
 * easy (1–2): +10%, medium (3): +0%, hard (4–5): -10%
 */

const DEFAULT_WEIGHTS = { easy: 1.1, medium: 1.0, hard: 0.9 };

export class FixtureService {
  constructor(weights = DEFAULT_WEIGHTS) {
    this.fdrMap = fdrMap || {};
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  /** Return {opponent, home, fdr, difficulty} or null if no GW data */
  getFixture(clubName, gw) {
    if (!clubName || !gw) return null;
    const clubKey = this.#resolveClubKey(clubName);
    const raw = clubKey ? this.fdrMap[clubKey]?.[String(gw)] : null;

    if (!raw || typeof raw.fdr !== "number") return null;
    return {
      opponent: raw.opponent,
      home: !!raw.home,
      fdr: raw.fdr,
      difficulty: this.getDifficultyLabel(raw.fdr),
    };
  }

  getDifficultyLabel(fdr) {
    if (fdr <= 2) return "easy";
    if (fdr === 3) return "medium";
    return "hard";
  }

  /** Return numeric multiplier for an FDR value */
  getFactor(fdr) {
    const label = this.getDifficultyLabel(fdr ?? 3);
    return this.weights[label] ?? 1.0;
  }

  /** Convenience: returns factor for a given club/gw (falls back to 1.0) */
  getFactorForFixture(clubName, gw) {
    const fx = this.getFixture(clubName, gw);
    return fx ? this.getFactor(fx.fdr) : 1.0;
  }

  #resolveClubKey(clubName) {
    const n = normalizeClub(clubName);
    return Object.keys(this.fdrMap).find((k) => normalizeClub(k) === n);
  }
}

// Export singleton if you prefer:
// export const fixtureService = new FixtureService();
