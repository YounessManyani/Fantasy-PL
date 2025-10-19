import {
  Transfer,
  TransferImpact,
  TeamComparison,
  ComparisonStats,
  Player,
} from "../../types";
import { ITeamStatsService } from "../team/team-stats.service";
import { round } from "../../utils/math.utils";

export interface ITransferAnalyzerService {
  calculateImpact(transfers: Transfer[]): TransferImpact;
  generateExplanation(transfers: Transfer[]): string;
  applyTransfers(
    team: Player[],
    transfers: Transfer[]
  ): { team: Player[]; changed: boolean };
  compareTeams(oldTeam: Player[], newTeam: Player[]): TeamComparison;
  rankTransfers(transfers: Transfer[]): {
    byGain: Transfer[];
    byValue: Transfer[];
    byCost: Transfer[];
  };
}

export class TransferAnalyzerService implements ITransferAnalyzerService {
  constructor(private statsService: ITeamStatsService) {}

  calculateImpact(transfers: Transfer[]): TransferImpact {
    if (!transfers || transfers.length === 0) {
      return {
        scoreGain: 0,
        cost: 0,
        transfersUsed: 0,
        averageGain: 0,
      };
    }

    const totalGain = transfers.reduce((sum, t) => sum + t.gain, 0);
    const totalCost = transfers.reduce(
      (sum, t) => sum + Math.max(0, t.cost),
      0
    );

    return {
      scoreGain: round(totalGain),
      cost: round(totalCost),
      transfersUsed: transfers.length,
      averageGain: round(totalGain / transfers.length),
    };
  }

  generateExplanation(transfers: Transfer[]): string {
    if (!transfers || transfers.length === 0) {
      return "No beneficial transfers found within your constraints.";
    }

    const lines: string[] = [];

    // Add each transfer
    for (const transfer of transfers) {
      lines.push(this.formatTransfer(transfer));
    }

    // Add summary
    lines.push("");
    lines.push(this.generateSummary(transfers));

    return lines.join("\n");
  }

  private formatTransfer(transfer: Transfer): string {
    const out = transfer.out;
    const inc = transfer.in;

    const mainLine =
      `• Replace ${out.playerName} (${out.position}, ${out.clubName}, £${out.price}m) ` +
      `with ${inc.playerName} (${inc.position}, ${inc.clubName}, £${inc.price}m)`;

    const impactLine =
      `  → Score: +${transfer.gain.toFixed(2)} | ` +
      `Cost: ${transfer.cost >= 0 ? "+" : ""}£${transfer.cost.toFixed(1)}m`;

    const lines = [mainLine, impactLine];

    if (transfer.meta?.gameweek) {
      const gw = transfer.meta.gameweek;
      const ofx = transfer.meta.outFixture;
      const ifx = transfer.meta.inFixture;

      const toText = (fx: any) =>
        fx
          ? `${fx.opponent} (${fx.home ? "H" : "A"}), FDR ${fx.fdr} — ${
              fx.difficulty
            }`
          : "no fixture data";

      lines.push(
        `  GW${gw} fixtures → OUT: ${out.clubName}: ${toText(ofx)} | IN: ${
          inc.clubName
        }: ${toText(ifx)}`
      );

      if (
        transfer.meta.inAdjusted != null &&
        transfer.meta.outAdjusted != null
      ) {
        lines.push(
          `  Adjusted: IN ${transfer.meta.inAdjusted.toFixed(
            2
          )} vs OUT ${transfer.meta.outAdjusted.toFixed(
            2
          )} (uses FDR multipliers)`
        );
      }
    }

    return lines.join("\n");
  }

  private generateSummary(transfers: Transfer[]): string {
    const impact = this.calculateImpact(transfers);

    if (transfers.length === 1) {
      return `Total impact: +${impact.scoreGain} expected score for £${Math.abs(
        impact.cost
      )}m`;
    }

    return `Total impact: +${impact.scoreGain} expected score across ${
      transfers.length
    } transfers for £${Math.abs(impact.cost)}m`;
  }

  applyTransfers(
    team: Player[],
    transfers: Transfer[]
  ): { team: Player[]; changed: boolean } {
    if (!transfers || transfers.length === 0) {
      return {
        team: [...team],
        changed: false,
      };
    }

    // Get names of players being transferred out
    const outNames = new Set(transfers.map((t) => t.out.playerName));

    // Filter out old players and add new ones
    const newTeam = team.filter((p) => !outNames.has(p.playerName));

    for (const transfer of transfers) {
      newTeam.push(transfer.in);
    }

    return {
      team: newTeam,
      changed: true,
    };
  }

  compareTeams(oldTeam: Player[], newTeam: Player[]): TeamComparison {
    const oldStats = this.calculateComparisonStats(oldTeam);
    const newStats = this.calculateComparisonStats(newTeam);

    return {
      old: oldStats,
      new: newStats,
      improvements: {
        totalScore: round(newStats.totalScore - oldStats.totalScore),
        averageScore: round(newStats.averageScore - oldStats.averageScore),
        valueChange: round(newStats.totalValue - oldStats.totalValue),
      },
    };
  }

  private calculateComparisonStats(team: Player[]): ComparisonStats {
    let totalValue = 0;
    let totalScore = 0;
    const positions: Record<string, number> = {};
    const clubs: Record<string, number> = {};

    for (const player of team) {
      totalValue += player.price;
      totalScore += player.score;

      positions[player.position] = (positions[player.position] || 0) + 1;
      clubs[player.clubName] = (clubs[player.clubName] || 0) + 1;
    }

    return {
      totalValue: round(totalValue),
      totalScore: round(totalScore),
      averageScore: round(totalScore / team.length),
      playerCount: team.length,
      byPosition: positions,
      byClub: clubs,
    };
  }

  rankTransfers(transfers: Transfer[]) {
    return {
      byGain: [...transfers].sort((a, b) => b.gain - a.gain),
      byValue: [...transfers].sort((a, b) => {
        const aValue = a.cost > 0 ? a.gain / a.cost : a.gain * 10;
        const bValue = b.cost > 0 ? b.gain / b.cost : b.gain * 10;
        return bValue - aValue;
      }),
      byCost: [...transfers].sort((a, b) => a.cost - b.cost),
    };
  }
}
