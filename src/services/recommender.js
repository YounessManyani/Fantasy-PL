// src/services/recommender.js
import { TransferFinder } from "./transfers/transferFinder.js";
import { TransferAnalyzer } from "./transfers/transferAnalyzer.js";
import { validateTransfer } from "./transfers/transferValidator.js";

export class Recommender {
  constructor(store) {
    this.store = store;
    this.finder = new TransferFinder(store);
    this.analyzer = new TransferAnalyzer();
  }
  
  /**
   * Main recommendation method
   */
  recommend(team, options = {}) {
    const {
      bank = 0,
      maxTransfers = 1,
      strategy = "best_gain" // Options: best_gain, best_value, balanced
    } = options;
    
    console.log(`\n[Recommender] Starting recommendation:`, {
      team_size: team.length,
      bank: bank,
      maxTransfers: maxTransfers,
      strategy: strategy
    });
    
    // Validate current team
    const validation = validateTransfer.validateTeam(team);
    console.log(`[Recommender] Team validation:`, {
      valid: validation.valid,
      errors: validation.errors?.length || 0,
      warnings: validation.warnings?.length || 0
    });
    
    if (!validation.valid) {
      console.log(`[Recommender] Team validation failed:`, validation.errors);
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
        transfers: [],
        explanation: "Team validation failed. Please fix the errors before requesting transfers."
      };
    }
    
    // Find best transfers based on max allowed
    console.log(`[Recommender] Finding best transfers (max: ${maxTransfers})...`);
    let transfers = [];
    
    if (maxTransfers === 1) {
      const single = this.finder.findSingleTransfer(team, bank);
      transfers = single ? [single] : [];
    } else if (maxTransfers === 2) {
      transfers = this.finder.findDoubleTransfer(team, bank);
    }
    
    console.log(`[Recommender] Found ${transfers.length} transfer(s)`);
    
    // Apply strategy filtering if specified
    if (strategy !== "best_gain" && transfers.length > 0) {
      console.log(`[Recommender] Applying strategy: ${strategy}`);
      transfers = this.applyStrategy(transfers, strategy);
    }
    
    // Generate analysis
    const impact = this.analyzer.calculateImpact(transfers);
    const explanation = this.analyzer.generateExplanation(transfers);
    const { team: newTeam } = this.analyzer.applyTransfers(team, transfers);
    const comparison = this.analyzer.compareTeams(team, newTeam);
    
    console.log(`[Recommender] Recommendation complete:`, {
      transfers: transfers.length,
      total_gain: impact.score_gain,
      total_cost: impact.cost,
      new_team_value: comparison.new?.total_value
    });
    
    return {
      success: true,
      transfers,
      impact,
      explanation,
      new_team: newTeam,
      comparison,
      validation: validation.warnings
    };
  }
  
  /**
   * Get multiple recommendation options
   */
  getOptions(team, bank = 0) {
    const singleTransfer = this.finder.findSingleTransfer(team, bank);
    const doubleTransfers = this.finder.findDoubleTransfer(team, bank);
    
    const options = [];
    
    // Single transfer option
    if (singleTransfer) {
      options.push({
        type: "single",
        transfers: [singleTransfer],
        impact: this.analyzer.calculateImpact([singleTransfer]),
        explanation: this.analyzer.generateExplanation([singleTransfer])
      });
    }
    
    // Double transfer option
    if (doubleTransfers && doubleTransfers.length === 2) {
      options.push({
        type: "double",
        transfers: doubleTransfers,
        impact: this.analyzer.calculateImpact(doubleTransfers),
        explanation: this.analyzer.generateExplanation(doubleTransfers)
      });
    }
    
    // No transfer option (save the transfer)
    options.push({
      type: "save",
      transfers: [],
      impact: { score_gain: 0, cost: 0, transfers_used: 0 },
      explanation: "Save your transfer for next gameweek to have 2 free transfers."
    });
    
    return options;
  }
  
  /**
   * Apply different strategies to filter transfers
   */
  applyStrategy(transfers, strategy) {
    const ranked = this.analyzer.rankTransfers(transfers);
    
    switch (strategy) {
      case "best_value":
        // Prioritize best gain per pound spent
        return ranked.by_value.slice(0, transfers.length);
        
      case "budget":
        // Prioritize cheapest transfers
        return ranked.by_cost.slice(0, transfers.length);
        
      case "balanced":
        // Balance between gain and cost
        return transfers.sort((a, b) => {
          const aScore = a.gain * 0.7 - Math.max(0, a.cost) * 0.3;
          const bScore = b.gain * 0.7 - Math.max(0, b.cost) * 0.3;
          return bScore - aScore;
        });
        
      default:
        return transfers;
    }
  }
  
  /**
   * Get wildcard suggestions (complete team rebuild)
   */
  getWildcardTeam(budget = 100, formation = "3-5-2") {
    // Parse formation
    const [def, mid, fwd] = formation.split("-").map(Number);
    
    if (!def || !mid || !fwd) {
      throw new Error("Invalid formation. Use format like '3-5-2'");
    }
    
    // Build optimal team within budget
    const team = [];
    let remainingBudget = budget;
    
    // Add goalkeeper (1)
    const gks = this.store.getTopPlayersByPosition("GK", 10);
    const affordableGK = gks.find(p => p.price <= remainingBudget * 0.05); // ~5% for GK
    if (affordableGK) {
      team.push(this.formatPlayer(affordableGK));
      remainingBudget -= affordableGK.price;
    }
    
    // Add defenders
    const defs = this.store.getTopPlayersByPosition("DEF", 30);
    const defBudget = remainingBudget * 0.25; // ~25% for defense
    const selectedDefs = this.selectPlayers(defs, def, defBudget);
    team.push(...selectedDefs.players);
    remainingBudget -= selectedDefs.spent;
    
    // Add midfielders
    const mids = this.store.getTopPlayersByPosition("MID", 30);
    const midBudget = remainingBudget * 0.5; // ~50% of remaining for midfield
    const selectedMids = this.selectPlayers(mids, mid, midBudget);
    team.push(...selectedMids.players);
    remainingBudget -= selectedMids.spent;
    
    // Add forwards
    const fwds = this.store.getTopPlayersByPosition("FWD", 20);
    const selectedFwds = this.selectPlayers(fwds, fwd, remainingBudget);
    team.push(...selectedFwds.players);
    remainingBudget -= selectedFwds.spent;
    
    // Validate the team
    const validation = validateTransfer.validateTeam(team);
    
    return {
      team,
      formation,
      remaining_budget: Math.round(remainingBudget * 10) / 10,
      validation,
      stats: this.analyzer.calculateTeamStats(team)
    };
  }
  
  /**
   * Select best players within budget and club constraints
   */
  selectPlayers(candidates, count, budget) {
    const selected = [];
    let spent = 0;
    const clubCounts = {};
    
    for (const player of candidates) {
      if (selected.length >= count) break;
      if (player.price > budget - spent) continue;
      
      // Check club limit
      const club = player.club_name;
      if ((clubCounts[club] || 0) >= 3) continue;
      
      const formatted = this.formatPlayer(player);
      selected.push(formatted);
      spent += player.price;
      clubCounts[club] = (clubCounts[club] || 0) + 1;
    }
    
    return { players: selected, spent };
  }
  
  /**
   * Format player for output
   */
  formatPlayer(player) {
    return {
      name: player.player_name,
      club: player.club_name,
      position: player.position,
      price: player.price,
      score: player.score,
      points_per_game: player.points_per_game || 0
    };
  }
}