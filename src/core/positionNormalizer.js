// src/core/positionNormalizer.js

/**
 * Normalize position names from various formats
 * Handles different CSV formats and ensures consistency
 */
export function normalizePosition(position) {
    if (!position) return "UNK"; // Unknown
    
    const pos = position.toUpperCase().trim();
    
    // Map variations to standard positions
    const positionMap = {
      // Goalkeeper variations
      "GKP": "GK",
      "GK": "GK",
      "GOALKEEPER": "GK",
      "G": "GK",
      
      // Defender variations
      "DEF": "DEF",
      "DEFENDER": "DEF",
      "D": "DEF",
      "DF": "DEF",
      "DEFENCE": "DEF",
      
      // Midfielder variations
      "MID": "MID",
      "MIDFIELDER": "MID",
      "M": "MID",
      "MF": "MID",
      "MIDFIELD": "MID",
      
      // Forward variations
      "FWD": "FWD",
      "FORWARD": "FWD",
      "F": "FWD",
      "FW": "FWD",
      "STRIKER": "FWD",
      "ST": "FWD",
      "ATT": "FWD",
      "ATTACKER": "FWD"
    };
    
    return positionMap[pos] || pos;
  }
  
  /**
   * Validate if a position is one of the standard FPL positions
   */
  export function isValidPosition(position) {
    const valid = ["GK", "DEF", "MID", "FWD"];
    return valid.includes(normalizePosition(position));
  }
  
  /**
   * Get position limits for FPL
   */
  export function getPositionLimits() {
    return {
      GK: { min: 1, max: 1 },
      DEF: { min: 3, max: 5 },
      MID: { min: 2, max: 5 },
      FWD: { min: 1, max: 3 }
    };
  }
  
  /**
   * Get full position name
   */
  export function getFullPositionName(position) {
    const names = {
      GK: "Goalkeeper",
      DEF: "Defender",
      MID: "Midfielder",
      FWD: "Forward"
    };
    
    const normalized = normalizePosition(position);
    return names[normalized] || position;
  }