// src/services/nameResolver.js
import stringSimilarity from "string-similarity";
import { normalizeName, normalizeClub, PLAYER_ALIASES } from "../core/normalizer.js";

export class NameResolver {
  constructor(store, llmConfig = null) {
    this.store = store;
    this.llmConfig = llmConfig;
    this.cache = new Map();
    this.llmClient = null;
  }
  
  async resolve(rawName, options = {}) {
    const { clubHint, strictMode = false } = options;
    
    // Check cache
    const cacheKey = JSON.stringify([
      normalizeName(rawName),
      normalizeClub(clubHint || ""),
      strictMode
    ]);
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`[NameResolver] Cache hit for "${rawName}": ${cached?.player_name || 'not found'}`);
      return cached;
    }
    
    console.log(`[NameResolver] Resolving "${rawName}" (strict: ${strictMode}, LLM: ${this.llmConfig?.enabled})`);
    
    // Try deterministic resolution first
    let player = this.resolveDeterministic(rawName, clubHint, strictMode);
    
    if (player) {
      console.log(`[NameResolver] Deterministic match: ${player.player_name}`);
    } else {
      console.log(`[NameResolver] No deterministic match for "${rawName}"`);
    }
    
    // If failed and LLM is enabled, try LLM resolution
    if (!player && this.llmConfig?.enabled) {
      console.log(`[NameResolver] Attempting LLM resolution for "${rawName}"`);
      player = await this.resolveLLM(rawName, clubHint);
      
      if (player) {
        console.log(`[NameResolver] ✨ LLM resolved "${rawName}" to "${player.player_name}"`);
        player.__llm_resolved = true; // Mark as LLM-resolved
      } else {
        console.log(`[NameResolver] LLM could not resolve "${rawName}"`);
      }
    }
    
    // Cache result
    this.cache.set(cacheKey, player);
    return player;
  }
  
  resolveDeterministic(rawName, clubHint, strictMode) {
    const normalized = normalizeName(rawName);
    const tokens = normalized.split(" ").filter(Boolean);
    
    // In strict mode, require at least 2 tokens
    if (strictMode && tokens.length < 2) {
      return null;
    }
    
    // 1. Check aliases
    const aliasedName = PLAYER_ALIASES[normalized];
    if (aliasedName) {
      const player = this.store.getByName(normalizeName(aliasedName));
      if (player && this.matchesClubHint(player, clubHint)) {
        return player;
      }
    }
    
    // 2. Try exact match
    const exactMatch = this.store.getByName(normalized);
    if (exactMatch && this.matchesClubHint(exactMatch, clubHint)) {
      return exactMatch;
    }
    
    // 3. Try surname match (for single token)
    if (tokens.length === 1) {
      const surname = tokens[0];
      const bySupername = this.store.getBySurname(surname);
      
      if (bySupername.length === 1 && this.matchesClubHint(bySupername[0], clubHint)) {
        return bySupername[0];
      }
      
      // Multiple players with same surname - pick most prominent
      if (bySupername.length > 1) {
        const filtered = clubHint 
          ? bySupername.filter(p => this.matchesClubHint(p, clubHint))
          : bySupername;
          
        if (filtered.length > 0) {
          return filtered.reduce((best, player) => 
            this.store.getProminence(player) > this.store.getProminence(best) 
              ? player : best
          );
        }
      }
    }
    
    // 4. Fuzzy matching
    const candidates = this.findCandidates(normalized, clubHint);
    if (candidates.length > 0) {
      const threshold = strictMode ? 0.8 : 0.6;
      
      const best = candidates[0];
      if (best.similarity >= threshold) {
        return best.player;
      }
    }
    
    return null;
  }
  
  findCandidates(normalized, clubHint, limit = 10) {
    const allNames = this.store.getAllNormalizedNames();
    const matches = stringSimilarity.findBestMatch(normalized, allNames);
    
    return matches.ratings
      .map(match => ({
        player: this.store.getByName(match.target),
        similarity: match.rating
      }))
      .filter(({ player }) => 
        !clubHint || this.matchesClubHint(player, clubHint)
      )
      .sort((a, b) => {
        // Sort by similarity, then by prominence
        if (Math.abs(a.similarity - b.similarity) > 0.05) {
          return b.similarity - a.similarity;
        }
        return this.store.getProminence(b.player) - 
               this.store.getProminence(a.player);
      })
      .slice(0, limit);
  }
  
  async resolveLLM(rawName, clubHint) {
    if (!this.llmConfig?.apiKey) {
      console.log("[NameResolver] LLM enabled but no API key provided");
      return null;
    }
    
    try {
      console.log(`[NameResolver] LLM: Getting candidates for "${rawName}"`);
      
      // Get top candidates for LLM to choose from
      const candidates = this.findCandidates(
        normalizeName(rawName), 
        clubHint, 
        15
      );
      
      if (candidates.length === 0) {
        console.log("[NameResolver] LLM: No candidates found");
        return null;
      }
      
      console.log(`[NameResolver] LLM: Found ${candidates.length} candidates`);
      candidates.slice(0, 3).forEach(c => {
        console.log(`  - ${c.player.player_name} (${c.player.club_name}) - similarity: ${c.similarity.toFixed(2)}`);
      });
      
      // Initialize LLM client if needed
      if (!this.llmClient) {
        console.log("[NameResolver] LLM: Initializing client");
        await this.initLLMClient();
      }
      
      // Ask LLM to pick best match
      console.log("[NameResolver] LLM: Sending query to AI model");
      const chosen = await this.askLLM(rawName, clubHint, candidates);
      
      if (chosen) {
        console.log(`[NameResolver] LLM: Successfully matched to ${chosen.player_name}`);
      } else {
        console.log("[NameResolver] LLM: No match found");
      }
      
      return chosen;
      
    } catch (error) {
      console.error("[NameResolver] LLM Resolution Error:", error.message);
      if (error.response) {
        console.error("[NameResolver] LLM API Response:", error.response.data);
      }
      return null;
    }
  }
  
  async initLLMClient() {
    if (this.llmConfig.provider === "openai") {
      const { default: OpenAI } = await import("openai");
      this.llmClient = new OpenAI({ apiKey: this.llmConfig.apiKey });
    }
    // Add other providers as needed
  }
  
  async askLLM(rawName, clubHint, candidates) {
    const candidateList = candidates
      .map((c, i) => 
        `${i}. ${c.player.player_name} | ${c.player.club_name} | ` +
        `${c.player.position} | Score: ${c.similarity.toFixed(2)}`
      )
      .join("\n");
    
    const prompt = `
Match the input name to the best candidate from the list below.
Input: "${rawName}"${clubHint ? ` (Club hint: ${clubHint})` : ""}

Candidates:
${candidateList}

Return ONLY the index number (0-${candidates.length - 1}) or -1 if no match.`;
    
    const response = await this.llmClient.chat.completions.create({
      model: this.llmConfig.model,
      messages: [
        { role: "system", content: "You are a football player name matcher." },
        { role: "user", content: prompt }
      ],
      temperature: 0,
      max_tokens: 10
    });
    
    const index = parseInt(response.choices[0].message.content.trim());
    
    if (index >= 0 && index < candidates.length) {
      return candidates[index].player;
    }
    
    return null;
  }
  
  matchesClubHint(player, clubHint) {
    if (!clubHint) return true;
    return normalizeClub(player.club_name) === normalizeClub(clubHint);
  }
  
  clearCache() {
    this.cache.clear();
  }
}