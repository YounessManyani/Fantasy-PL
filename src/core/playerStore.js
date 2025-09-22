// src/core/playerStore.js
import { normalizeClub } from "./normalizer.js";

export class PlayerStore {
  constructor(players) {
    this.players = players;
    this.indexes = {
      byName: new Map(),      // normalized_name -> player
      bySurname: new Map(),   // surname -> player[]
      byClub: new Map(),      // club -> player[]
      byPosition: new Map()   // position -> player[]
    };
    
    this.buildIndexes();
  }
  
  buildIndexes() {
    for (const player of this.players) {
      // Index by normalized name
      this.indexes.byName.set(player.normalized_name, player);
      
      // Index by surname (can have multiple players)
      if (!this.indexes.bySurname.has(player.surname)) {
        this.indexes.bySurname.set(player.surname, []);
      }
      this.indexes.bySurname.get(player.surname).push(player);
      
      // Index by club
      const normalizedClub = normalizeClub(player.club_name);
      if (!this.indexes.byClub.has(normalizedClub)) {
        this.indexes.byClub.set(normalizedClub, []);
      }
      this.indexes.byClub.get(normalizedClub).push(player);
      
      // Index by position
      if (!this.indexes.byPosition.has(player.position)) {
        this.indexes.byPosition.set(player.position, []);
      }
      this.indexes.byPosition.get(player.position).push(player);
    }
  }
  
  // Get player by exact normalized name
  getByName(normalizedName) {
    return this.indexes.byName.get(normalizedName);
  }
  
  // Get players by surname
  getBySurname(surname) {
    return this.indexes.bySurname.get(surname) || [];
  }
  
  // Get players by club
  getByClub(clubName) {
    const normalized = normalizeClub(clubName);
    return this.indexes.byClub.get(normalized) || [];
  }
  
  // Get players by position
  getByPosition(position) {
    return this.indexes.byPosition.get(position) || [];
  }
  
  // Get all normalized names for fuzzy matching
  getAllNormalizedNames() {
    return Array.from(this.indexes.byName.keys());
  }
  
  // Calculate player prominence (for disambiguation)
  getProminence(player) {
    const totalPoints = player.total_points || 0;
    const minutes = player.minutes || 0;
    const ppg = player.points_per_game || 0;
    const price = player.price || 0;
    
    // Weighted score based on importance indicators
    const score = 
      Math.log10(1 + totalPoints) * 0.4 +
      Math.log10(1 + minutes) * 0.3 +
      ppg * 0.2 +
      price * 0.1;
      
    return Math.max(0, Math.min(1, score / 10));
  }
  
  // Get top players by position (for recommendations)
  getTopPlayersByPosition(position, limit = 50) {
    return this.getByPosition(position)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  // Search players with filters
  search(filters = {}) {
    let results = [...this.players];
    
    if (filters.position) {
      results = results.filter(p => p.position === filters.position);
    }
    
    if (filters.club) {
      const normalizedClub = normalizeClub(filters.club);
      results = results.filter(p => 
        normalizeClub(p.club_name) === normalizedClub
      );
    }
    
    if (filters.maxPrice) {
      results = results.filter(p => p.price <= filters.maxPrice);
    }
    
    if (filters.minScore) {
      results = results.filter(p => p.score >= filters.minScore);
    }
    
    return results;
  }
}