// src/services/transfers/transferAnalyzer.js

export class TransferAnalyzer {
  /**
   * Calculate the impact of transfers
   */
  calculateImpact(transfers) {
    if (!transfers || transfers.length === 0) {
      return {
        score_gain: 0,
        cost: 0,
        transfers_used: 0,
        average_gain: 0,
      };
    }

    const totalGain = transfers.reduce((sum, t) => sum + t.gain, 0);
    const totalCost = transfers.reduce(
      (sum, t) => sum + Math.max(0, t.cost),
      0
    );

    return {
      score_gain: Math.round(totalGain * 100) / 100,
      cost: Math.round(totalCost * 10) / 10,
      transfers_used: transfers.length,
      average_gain: Math.round((totalGain / transfers.length) * 100) / 100,
    };
  }

  /**
   * Generate explanation for transfers
   */
  generateExplanation(transfers) {
    if (!transfers || transfers.length === 0) {
      return "No beneficial transfers found within your constraints.";
    }

    const lines = [];

    // Add each transfer
    for (const transfer of transfers) {
      lines.push(this.formatTransfer(transfer));
    }

    // Add summary
    lines.push("");
    lines.push(this.generateSummary(transfers));

    return lines.join("\n");
  }

  /**
   * Format a single transfer
   */
  formatTransfer(transfer) {
    const out = transfer.out;
    const inc = transfer.in;

    const mainLine =
      `• Replace ${out.name} (${out.position}, ${out.club}, £${out.price}m) ` +
      `with ${inc.name} (${inc.position}, ${inc.club}, £${inc.price}m)`;

    const impactLine =
      `  → Score: +${transfer.gain.toFixed(2)} | ` +
      `Cost: ${transfer.cost >= 0 ? "+" : ""}£${transfer.cost.toFixed(1)}m`;

    const lines = [`${mainLine}`, `${impactLine}`];
    if (transfer.meta?.gameweek) {
      const gw = transfer.meta.gameweek;
      const ofx = transfer.meta.out_fixture;
      const ifx = transfer.meta.in_fixture;
      const toText = (fx) =>
        fx
          ? `${fx.opponent} (${fx.home ? "H" : "A"}), FDR ${fx.fdr} – ${
              fx.difficulty
            }`
          : `no fixture data`;
      lines.push(
        `  GW${gw} fixtures → OUT: ${out.club}: ${toText(ofx)} | IN: ${
          inc.club
        }: ${toText(ifx)}`
      );
      if (
        transfer.meta?.in_adjusted != null &&
        transfer.meta?.out_adjusted != null
      ) {
        lines.push(
          `  Adjusted: IN ${transfer.meta.in_adjusted.toFixed(
            2
          )} vs OUT ${transfer.meta.out_adjusted.toFixed(
            2
          )} (uses FDR multipliers)`
        );
      }
    }
    return lines.join("\n");
  }

  /**
   * Generate summary of all transfers
   */
  generateSummary(transfers) {
    const impact = this.calculateImpact(transfers);

    if (transfers.length === 1) {
      return `Total impact: +${
        impact.score_gain
      } expected score for £${Math.abs(impact.cost)}m`;
    }

    return `Total impact: +${impact.score_gain} expected score across ${
      transfers.length
    } transfers for £${Math.abs(impact.cost)}m`;
  }

  /**
   * Apply transfers to a team
   */
  applyTransfers(team, transfers) {
    if (!transfers || transfers.length === 0) {
      return {
        team: [...team],
        changed: false,
      };
    }

    // Get names of players being transferred out
    const outNames = new Set(transfers.map((t) => t.out.name));

    // Filter out old players and add new ones
    const newTeam = team.filter((p) => !outNames.has(p.name));

    for (const transfer of transfers) {
      newTeam.push(transfer.in);
    }

    return {
      team: newTeam,
      changed: true,
    };
  }

  /**
   * Compare two teams
   */
  compareTeams(oldTeam, newTeam) {
    const oldStats = this.calculateTeamStats(oldTeam);
    const newStats = this.calculateTeamStats(newTeam);

    return {
      old: oldStats,
      new: newStats,
      improvements: {
        total_score:
          Math.round((newStats.total_score - oldStats.total_score) * 100) / 100,
        average_score:
          Math.round((newStats.average_score - oldStats.average_score) * 100) /
          100,
        value_change:
          Math.round((newStats.total_value - oldStats.total_value) * 10) / 10,
      },
    };
  }

  /**
   * Calculate team statistics
   */
  calculateTeamStats(team) {
    let totalValue = 0;
    let totalScore = 0;
    const positions = {};
    const clubs = {};

    for (const player of team) {
      totalValue += player.price;
      totalScore += player.score;

      positions[player.position] = (positions[player.position] || 0) + 1;
      clubs[player.club] = (clubs[player.club] || 0) + 1;
    }

    return {
      total_value: Math.round(totalValue * 10) / 10,
      total_score: Math.round(totalScore * 100) / 100,
      average_score: Math.round((totalScore / team.length) * 100) / 100,
      player_count: team.length,
      by_position: positions,
      by_club: clubs,
    };
  }

  /**
   * Rank transfers by different criteria
   */
  rankTransfers(transfers) {
    return {
      by_gain: [...transfers].sort((a, b) => b.gain - a.gain),
      by_value: [...transfers].sort((a, b) => {
        // Best value = highest gain per pound spent
        const aValue = a.cost > 0 ? a.gain / a.cost : a.gain * 10;
        const bValue = b.cost > 0 ? b.gain / b.cost : b.gain * 10;
        return bValue - aValue;
      }),
      by_cost: [...transfers].sort((a, b) => a.cost - b.cost),
    };
  }
}
