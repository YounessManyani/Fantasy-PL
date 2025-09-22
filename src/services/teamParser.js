// src/services/teamParser.js
import stringSimilarity from "string-similarity";
import { normalizeName } from "../core/normalizer.js";

export class TeamParser {
  constructor(resolver, store) {
    this.resolver = resolver;
    this.store = store;
  }
  
  async parse(teamText, options = {}) {
    const {
      strictMode = false,
      includeSuggestions = true,
      useLLM = false
    } = options;
    
    console.log(`[TeamParser] Parsing with options:`, { strictMode, includeSuggestions, useLLM });
    
    // Extract player names from text
    const playerNames = this.extractPlayerNames(teamText);
    console.log(`[TeamParser] Found ${playerNames.length} player names to resolve`);
    
    // Resolve each name
    const results = {
      players: [],
      unknown: [],
      duplicates: [],
      suggestions: {},
      stats: {},
      llm_stats: {
        attempted: 0,
        resolved: 0,
        names: []
      }
    };
    
    const seen = new Set();
    
    for (const name of playerNames) {
      console.log(`[TeamParser] Processing: "${name}"`);
      
      const player = await this.resolver.resolve(name, {
        strictMode,
        useLLM
      });
      
      if (player) {
        if (player.__llm_resolved) {
          results.llm_stats.resolved++;
          results.llm_stats.names.push({
            input: name,
            matched: player.player_name
          });
        }
        
        if (seen.has(player.id)) {
          results.duplicates.push(name);
        } else {
          seen.add(player.id);
          results.players.push(this.formatPlayer(player));
        }
      } else {
        results.unknown.push(name);
        
        if (useLLM) {
          results.llm_stats.attempted++;
        }
        
        if (includeSuggestions) {
          results.suggestions[name] = this.getSuggestions(name);
        }
      }
    }
    
    // Calculate team statistics
    results.stats = this.calculateStats(results.players);
    
    console.log(`[TeamParser] Results: ${results.players.length} found, ${results.unknown.length} unknown`);
    if (useLLM) {
      console.log(`[TeamParser] LLM stats: ${results.llm_stats.resolved} resolved via LLM`);
    }
    
    return results;
  }
  
  extractPlayerNames(text) {
    // Remove content in parentheses and split by delimiters
    const cleaned = text.replace(/\([^)]*\)/g, "");
    
    return cleaned
      .split(/[,;\n]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
  }
  
  formatPlayer(player) {
    return {
      name: player.player_name,
      club: player.club_name,
      position: player.position,
      price: player.price,
      score: player.score,
      points_per_game: player.points_per_game
    };
  }
  
  getSuggestions(name, limit = 3) {
    const normalized = normalizeName(name);
    const allNames = this.store.getAllNormalizedNames();
    
    if (allNames.length === 0) return [];
    
    const matches = stringSimilarity.findBestMatch(normalized, allNames);
    
    return matches.ratings
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
      .map(match => {
        const player = this.store.getByName(match.target);
        return {
          name: player.player_name,
          club: player.club_name,
          similarity: Math.round(match.rating * 100)
        };
      });
  }
  
  calculateStats(players) {
    const stats = {
      total_value: 0,
      by_position: {},
      by_club: {},
      average_score: 0,
      formation: null
    };
    
    if (players.length === 0) return stats;
    
    let totalScore = 0;
    
    for (const player of players) {
      // Total value
      stats.total_value += player.price;
      
      // Total score for average
      totalScore += player.score;
      
      // Count by position - ensure position is normalized
      const normalizedPos = player.position.replace("GKP", "GK").toUpperCase();
      if (!stats.by_position[normalizedPos]) {
        stats.by_position[normalizedPos] = 0;
      }
      stats.by_position[normalizedPos]++;
      
      // Count by club
      if (!stats.by_club[player.club]) {
        stats.by_club[player.club] = 0;
      }
      stats.by_club[player.club]++;
    }
    
    // Round total value
    stats.total_value = Math.round(stats.total_value * 10) / 10;
    
    // Calculate average score
    stats.average_score = Math.round((totalScore / players.length) * 100) / 100;
    
    // Determine formation
    stats.formation = this.determineFormation(stats.by_position);
    
    return stats;
  }
  
  determineFormation(byPosition) {
    const gk = byPosition.GK || byPosition.GKP || 0;
    const def = byPosition.DEF || 0;
    const mid = byPosition.MID || 0;
    const fwd = byPosition.FWD || 0;
    
    if (gk === 1 && def >= 3 && def <= 5 && mid >= 2 && mid <= 5 && fwd >= 1 && fwd <= 3) {
      return `${def}-${mid}-${fwd}`;
    }
    
    return "Invalid";
  }
  
  validateTeam(players) {
    const errors = [];
    const warnings = [];
    
    // Check team size
    if (players.length !== 11) {
      errors.push(`Team has ${players.length} players (need exactly 11)`);
    }
    
    // Check positions
    const positions = this.calculateStats(players).by_position;
    
    if (positions.GK !== 1) {
      errors.push(`${positions.GK || 0} goalkeepers (need exactly 1)`);
    }
    
    if (positions.DEF < 3 || positions.DEF > 5) {
      errors.push(`${positions.DEF || 0} defenders (need 3-5)`);
    }
    
    if (positions.MID < 2 || positions.MID > 5) {
      errors.push(`${positions.MID || 0} midfielders (need 2-5)`);
    }
    
    if (positions.FWD < 1 || positions.FWD > 3) {
      errors.push(`${positions.FWD || 0} forwards (need 1-3)`);
    }
    
    // Check club limits
    const clubs = this.calculateStats(players).by_club;
    for (const [club, count] of Object.entries(clubs)) {
      if (count > 3) {
        errors.push(`${count} players from ${club} (maximum 3 per club)`);
      }
    }
    
    // Check budget
    const totalValue = this.calculateStats(players).total_value;
    if (totalValue > 100) {
      warnings.push(`Team value £${totalValue}m exceeds £100m budget`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}