// src/services/transfers/transferValidator.js
import config from "../../config/index.js";
import { normalizePosition, getPositionLimits } from "../../core/positionNormalizer.js";

class TransferValidator {
  constructor() {
    this.maxPlayersPerClub = config.rules.maxPlayersPerClub;
    this.positionLimits = getPositionLimits();
  }
  
  /**
   * Validate a complete team
   */
  validateTeam(team) {
    const errors = [];
    const warnings = [];
    
    // Count positions and clubs
    const positions = {};
    const clubs = {};
    let totalValue = 0;
    
    for (const player of team) {
      // Normalize position in case it comes from external source
      const normalizedPos = normalizePosition(player.position);
      positions[normalizedPos] = (positions[normalizedPos] || 0) + 1;
      clubs[player.club] = (clubs[player.club] || 0) + 1;
      totalValue += player.price;
    }
    
    // Check team size
    if (team.length !== 11) {
      errors.push(`Team has ${team.length} players (need exactly 11)`);
    }
    
    // Check formation requirements using position limits
    for (const [pos, limits] of Object.entries(this.positionLimits)) {
      const count = positions[pos] || 0;
      
      if (count < limits.min || count > limits.max) {
        const posName = {
          GK: "goalkeeper",
          DEF: "defender",
          MID: "midfielder",
          FWD: "forward"
        }[pos];
        
        if (limits.min === limits.max) {
          errors.push(`${count} ${posName}s (need exactly ${limits.min})`);
        } else {
          errors.push(`${count} ${posName}s (need ${limits.min}-${limits.max})`);
        }
      }
    }
    
    // Check club limits
    for (const [club, count] of Object.entries(clubs)) {
      if (count > this.maxPlayersPerClub) {
        errors.push(`${count} players from ${club} (max ${this.maxPlayersPerClub})`);
      }
    }
    
    // Check budget (warning only)
    totalValue = Math.round(totalValue * 10) / 10;
    if (totalValue > 100) {
      warnings.push(`Team value £${totalValue}m exceeds £100m budget`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        formation: this.getFormation(positions),
        totalValue,
        clubs,
        positions
      }
    };
  }
  
  /**
   * Check if a player can be added to a team
   */
  canAddPlayer(team, playerIn) {
    const clubCounts = {};
    
    // Count existing clubs
    for (const player of team) {
      const club = player.club || player.club_name;
      clubCounts[club] = (clubCounts[club] || 0) + 1;
    }
    
    // Check if adding new player would exceed limit
    const playerClub = playerIn.club || playerIn.club_name;
    clubCounts[playerClub] = (clubCounts[playerClub] || 0) + 1;
    
    return clubCounts[playerClub] <= this.maxPlayersPerClub;
  }
  
  /**
   * Check club limits for a team
   */
  checkClubLimits(team) {
    const clubCounts = {};
    
    for (const player of team) {
      const club = player.club || player.club_name;
      clubCounts[club] = (clubCounts[club] || 0) + 1;
      
      if (clubCounts[club] > this.maxPlayersPerClub) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validate a transfer is legal
   */
  validateTransfer(team, transfer) {
    // Check if player out is in team
    const hasPlayerOut = team.some(p => p.name === transfer.out.name);
    if (!hasPlayerOut) {
      return {
        valid: false,
        error: `Player ${transfer.out.name} not in team`
      };
    }
    
    // Check if player in is not already in team
    const hasPlayerIn = team.some(p => p.name === transfer.in.name);
    if (hasPlayerIn) {
      return {
        valid: false,
        error: `Player ${transfer.in.name} already in team`
      };
    }
    
    // Check positions match
    if (transfer.out.position !== transfer.in.position) {
      return {
        valid: false,
        error: `Position mismatch: ${transfer.out.position} → ${transfer.in.position}`
      };
    }
    
    // Check club limits
    const tempTeam = team.filter(p => p.name !== transfer.out.name);
    if (!this.canAddPlayer(tempTeam, transfer.in)) {
      return {
        valid: false,
        error: `Would exceed ${this.maxPlayersPerClub} player limit for ${transfer.in.club}`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Get formation string
   */
  getFormation(positions) {
    const def = positions.DEF || 0;
    const mid = positions.MID || 0;
    const fwd = positions.FWD || 0;
    
    if (positions.GK === 1 && def >= 3 && def <= 5 && 
        mid >= 2 && mid <= 5 && fwd >= 1 && fwd <= 3) {
      return `${def}-${mid}-${fwd}`;
    }
    
    return "Invalid";
  }
}

// Export singleton instance
export const validateTransfer = new TransferValidator();