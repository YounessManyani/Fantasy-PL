// src/services/transfers/transferFinder.js
import { validateTransfer } from "./transferValidator.js";

export class TransferFinder {
  constructor(store) {
    this.store = store;
  }
  
  /**
   * Find the best single transfer for a team
   */
  findSingleTransfer(team, budget) {
    console.log(`[TransferFinder] Finding single transfer with budget: £${budget}m`);
    
    let bestTransfer = null;
    let bestGain = 0;
    let candidatesEvaluated = 0;
    
    // Sort team by score to prioritize replacing weakest players
    const sortedTeam = [...team].sort((a, b) => a.score - b.score);
    console.log(`[TransferFinder] Evaluating replacements for ${sortedTeam.length} players`);
    console.log(`[TransferFinder] Weakest players:`, sortedTeam.slice(0, 3).map(p => 
      `${p.name} (${p.position}, ${p.score.toFixed(2)} score)`
    ));
    
    for (const playerOut of sortedTeam) {
      const candidates = this.getCandidates(playerOut, team, budget);
      candidatesEvaluated += candidates.length;
      
      if (candidates.length > 0) {
        console.log(`[TransferFinder] ${candidates.length} candidates for ${playerOut.name}`);
      }
      
      for (const playerIn of candidates) {
        const transfer = this.createTransfer(playerOut, playerIn);
        
        if (transfer.gain > bestGain) {
          bestGain = transfer.gain;
          bestTransfer = transfer;
          console.log(`[TransferFinder] New best: ${playerOut.name} → ${playerIn.player_name} (+${transfer.gain.toFixed(2)})`);
        }
      }
    }
    
    console.log(`[TransferFinder] Evaluated ${candidatesEvaluated} total candidates`);
    if (bestTransfer) {
      console.log(`[TransferFinder] Best transfer: ${bestTransfer.out.name} → ${bestTransfer.in.name}`);
      console.log(`[TransferFinder] Gain: +${bestTransfer.gain.toFixed(2)}, Cost: £${bestTransfer.cost}m`);
    } else {
      console.log(`[TransferFinder] No beneficial transfers found`);
    }
    
    return bestTransfer;
  }
  
  /**
   * Find the best double transfer for a team
   */
  findDoubleTransfer(team, budget) {
    // First, find all possible single transfers
    const allSingleTransfers = this.findAllSingleTransfers(team, budget);
    
    // Try to combine them
    const bestPair = this.findBestTransferPair(allSingleTransfers, team, budget);
    
    // If no valid pair found, return best single
    if (!bestPair) {
      const single = this.findSingleTransfer(team, budget);
      return single ? [single] : [];
    }
    
    return bestPair;
  }
  
  /**
   * Get all valid single transfers
   */
  findAllSingleTransfers(team, budget) {
    const transfers = [];
    
    for (const playerOut of team) {
      const candidates = this.getCandidates(playerOut, team, budget);
      
      for (const playerIn of candidates) {
        const transfer = this.createTransfer(playerOut, playerIn);
        transfers.push(transfer);
      }
    }
    
    // Sort by gain descending
    return transfers.sort((a, b) => b.gain - a.gain);
  }
  
  /**
   * Find the best pair of transfers
   */
  findBestTransferPair(transfers, team, budget) {
    let bestPair = null;
    let bestTotalGain = 0;
    
    for (let i = 0; i < Math.min(transfers.length, 50); i++) {
      for (let j = i + 1; j < Math.min(transfers.length, 50); j++) {
        const t1 = transfers[i];
        const t2 = transfers[j];
        
        // Check if pair is valid
        if (!this.isValidPair(t1, t2, team, budget)) {
          continue;
        }
        
        const totalGain = t1.gain + t2.gain;
        if (totalGain > bestTotalGain) {
          bestTotalGain = totalGain;
          bestPair = [t1, t2];
        }
      }
    }
    
    return bestPair;
  }
  
  /**
   * Check if two transfers can be combined
   */
  isValidPair(t1, t2, team, budget) {
    // Can't transfer out the same player
    if (t1.out.name === t2.out.name) return false;
    
    // Can't transfer in the same player
    if (t1.in.name === t2.in.name) return false;
    
    // Check combined cost
    const totalCost = Math.max(0, t1.cost) + Math.max(0, t2.cost);
    if (totalCost > budget) return false;
    
    // Check club limits after both transfers
    const tempTeam = team.filter(p => 
      p.name !== t1.out.name && p.name !== t2.out.name
    );
    tempTeam.push(t1.in, t2.in);
    
    return validateTransfer.checkClubLimits(tempTeam);
  }
  
  /**
   * Get replacement candidates for a player
   */
  getCandidates(playerOut, team, budget) {
    const maxPrice = playerOut.price + budget;
    
    return this.store
      .getByPosition(playerOut.position)
      .filter(p => {
        // Must be affordable
        if (p.price > maxPrice) return false;
        
        // Must not be same player
        if (p.player_name === playerOut.name) return false;
        
        // Must be an improvement
        if (p.score <= playerOut.score) return false;
        
        // Must respect club limits
        const tempTeam = team.filter(t => t.name !== playerOut.name);
        if (!validateTransfer.canAddPlayer(tempTeam, {
          name: p.player_name,
          club: p.club_name,
          position: p.position,
          price: p.price,
          score: p.score
        })) return false;
        
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Consider top 20 candidates
  }
  
  /**
   * Create a transfer object
   */
  createTransfer(playerOut, playerIn) {
    return {
      out: playerOut,
      in: {
        name: playerIn.player_name || playerIn.name,
        club: playerIn.club_name || playerIn.club,
        position: playerIn.position,
        price: playerIn.price,
        score: playerIn.score,
        points_per_game: playerIn.points_per_game
      },
      gain: Math.round((playerIn.score - playerOut.score) * 100) / 100,
      cost: Math.round((playerIn.price - playerOut.price) * 10) / 10
    };
  }
}