// src/api/routes.js
import { Router } from "express";
import { validateRequest } from "./middleware.js";
import { z } from "zod";
import { createLLMTestRoute } from "./llmTest.js";

// Request schemas
const parseTeamSchema = z.object({
  team_text: z.string().min(1, "Team text is required"),
  strict_mode: z.boolean().optional().default(false),
  include_suggestions: z.boolean().optional().default(true),
  use_llm: z.boolean().optional().default(false)
});

const recommendSchema = z.object({
  team_text: z.string().min(1, "Team text is required"),
  bank: z.number().min(0).max(100).optional().default(0),
  max_transfers: z.number().int().min(1).max(2).optional().default(1),
  strict_mode: z.boolean().optional().default(false),
  use_llm: z.boolean().optional().default(false)
});

export function createRoutes(teamParser, recommender, config) {
  const router = Router();
  
  // Health check
  router.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      version: config.app.version,
      environment: config.app.environment,
      players_loaded: teamParser.store.players.length,
      llm: {
        enabled: config.llm.enabled,
        provider: config.llm.provider,
        model: config.llm.model,
        has_key: !!config.llm.apiKey
      }
    });
  });
  
  // LLM test endpoint
  router.post("/test-llm", createLLMTestRoute());
  
  // Parse team endpoint
  router.post(
    "/parse-team",
    validateRequest(parseTeamSchema),
    async (req, res, next) => {
      try {
        console.log(`\n[API] /parse-team request:`, {
          use_llm: req.body.use_llm,
          llm_enabled: config.llm.enabled,
          will_use_llm: req.body.use_llm && config.llm.enabled
        });
        
        const result = await teamParser.parse(req.body.team_text, {
          strictMode: req.body.strict_mode,
          includeSuggestions: req.body.include_suggestions,
          useLLM: req.body.use_llm && config.llm.enabled
        });
        
        // Add validation info
        const validation = teamParser.validateTeam(result.players);
        result.validation = validation;
        
        // Add debug info about LLM usage
        result.debug = {
          llm_requested: req.body.use_llm,
          llm_available: config.llm.enabled,
          llm_used: req.body.use_llm && config.llm.enabled,
          unknown_count: result.unknown.length
        };
        
        console.log(`[API] /parse-team response:`, {
          players_found: result.players.length,
          unknown: result.unknown.length,
          llm_used: result.debug.llm_used
        });
        
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Recommend transfers endpoint
  router.post(
    "/recommend",
    validateRequest(recommendSchema),
    async (req, res, next) => {
      try {
        console.log(`\n[API] /recommend request:`, {
          use_llm: req.body.use_llm,
          llm_enabled: config.llm.enabled,
          will_use_llm: req.body.use_llm && config.llm.enabled,
          bank: req.body.bank,
          max_transfers: req.body.max_transfers
        });
        
        // First parse the team
        const teamResult = await teamParser.parse(req.body.team_text, {
          strictMode: req.body.strict_mode,
          useLLM: req.body.use_llm && config.llm.enabled
        });
        
        console.log(`[API] /recommend team parsing:`, {
          players_found: teamResult.players.length,
          unknown: teamResult.unknown.length,
          llm_resolved: teamResult.llm_stats?.resolved || 0
        });
        
        if (teamResult.players.length === 0) {
          return res.status(400).json({
            success: false,
            error: "No players recognized",
            unknown: teamResult.unknown,
            suggestions: teamResult.suggestions,
            llm_stats: teamResult.llm_stats
          });
        }
        
        // Get recommendations
        console.log(`[API] /recommend finding transfers for ${teamResult.players.length} players...`);
        const recommendations = recommender.recommend(teamResult.players, {
          bank: req.body.bank,
          maxTransfers: req.body.max_transfers
        });
        
        console.log(`[API] /recommend results:`, {
          transfers_found: recommendations.transfers?.length || 0,
          total_gain: recommendations.impact?.score_gain || 0,
          success: recommendations.success
        });
        
        // Log transfer details
        if (recommendations.transfers?.length > 0) {
          recommendations.transfers.forEach((t, i) => {
            console.log(`  Transfer ${i+1}: ${t.out.name} → ${t.in.name} (+${t.gain.toFixed(2)} score, £${t.cost}m)`);
          });
        }
        
        // Combine results with debug info
        res.json({
          ...recommendations,
          parsed_team: teamResult,
          debug: {
            llm_requested: req.body.use_llm,
            llm_available: config.llm.enabled,
            llm_used: req.body.use_llm && config.llm.enabled,
            players_parsed: teamResult.players.length,
            unknown_players: teamResult.unknown.length,
            llm_resolved_count: teamResult.llm_stats?.resolved || 0,
            transfers_found: recommendations.transfers?.length || 0
          }
        });
      } catch (error) {
        console.error(`[API] /recommend error:`, error.message);
        next(error);
      }
    }
  );
  
  // Get all players (useful for debugging/testing)
  router.get("/players", (req, res) => {
    const { position, club, limit = 50 } = req.query;
    
    let players = teamParser.store.search({
      position,
      club
    });
    
    players = players
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit));
    
    res.json({
      count: players.length,
      players: players.map(p => ({
        name: p.player_name,
        club: p.club_name,
        position: p.position,
        price: p.price,
        score: p.score
      }))
    });
  });
  
  return router;
}