// src/api/routes.js
import { Router } from "express";
import { validateRequest } from "./middleware.js";
import { z } from "zod";
import { createLLMTestRoute } from "./llmTest.js";
import { FixtureAnalyst } from "../services/llm/fixtureAnalyst.js";

// Request schemas
const parseTeamSchema = z.object({
  team_text: z.string().min(1, "Team text is required"),
  strict_mode: z.boolean().optional().default(false),
  include_suggestions: z.boolean().optional().default(true),
  use_llm: z.boolean().optional().default(false),
  gameweek: z.number().int().min(1).max(38).optional(),
});

const recommendSchema = z.object({
  team_text: z.string().min(1, "Team text is required"),
  bank: z.number().min(0).max(100).optional().default(0),
  max_transfers: z.number().int().min(1).max(2).optional().default(1),
  strict_mode: z.boolean().optional().default(false),
  use_llm: z.boolean().optional().default(false),
  gameweek: z.number().int().min(1).max(38).optional(),
});
const analyzeFixturesSchema = z.object({
  query: z.string().min(1, "Query is required"),
  team_text: z.string().optional(),
  gameweek: z.number().int().min(1).max(38).optional(),
  bank: z.number().min(0).max(100).optional().default(0),
  include_transfers: z.boolean().optional().default(false),
});
const comparePlayersSchema = z.object({
  players: z.array(z.string()).min(2).max(5),
  gameweeks_ahead: z.number().int().min(1).max(10).optional().default(5),
  current_gameweek: z.number().int().min(1).max(38).optional(),
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
        has_key: !!config.llm.apiKey,
      },
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
          will_use_llm: req.body.use_llm && config.llm.enabled,
          gameweek: req.body.gameweek,
        });

        const result = await teamParser.parse(req.body.team_text, {
          strictMode: req.body.strict_mode,
          includeSuggestions: req.body.include_suggestions,
          useLLM: req.body.use_llm && config.llm.enabled,
          gameweek: req.body.gameweek,
        });

        // Add validation info
        const validation = teamParser.validateTeam(result.players);
        result.validation = validation;

        // Add debug info about LLM usage
        result.debug = {
          llm_requested: req.body.use_llm,
          llm_available: config.llm.enabled,
          llm_used: req.body.use_llm && config.llm.enabled,
          unknown_count: result.unknown.length,
        };

        console.log(`[API] /parse-team response:`, {
          players_found: result.players.length,
          unknown: result.unknown.length,
          llm_used: result.debug.llm_used,
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
          max_transfers: req.body.max_transfers,
          gameweek: req.body.gameweek,
        });

        // First parse the team
        const teamResult = await teamParser.parse(req.body.team_text, {
          strictMode: req.body.strict_mode,
          useLLM: req.body.use_llm && config.llm.enabled,
          gameweek: req.body.gameweek,
        });

        console.log(`[API] /recommend team parsing:`, {
          players_found: teamResult.players.length,
          unknown: teamResult.unknown.length,
          llm_resolved: teamResult.llm_stats?.resolved || 0,
        });

        if (teamResult.players.length === 0) {
          return res.status(400).json({
            success: false,
            error: "No players recognized",
            unknown: teamResult.unknown,
            suggestions: teamResult.suggestions,
            llm_stats: teamResult.llm_stats,
          });
        }

        // Get recommendations
        console.log(
          `[API] /recommend finding transfers for ${teamResult.players.length} players...`
        );
        const recommendations = recommender.recommend(teamResult.players, {
          bank: req.body.bank,
          maxTransfers: req.body.max_transfers,
          gameweek: req.body.gameweek,
        });

        console.log(`[API] /recommend results:`, {
          transfers_found: recommendations.transfers?.length || 0,
          total_gain: recommendations.impact?.score_gain || 0,
          success: recommendations.success,
        });

        // Log transfer details
        if (recommendations.transfers?.length > 0) {
          recommendations.transfers.forEach((t, i) => {
            console.log(
              `  Transfer ${i + 1}: ${t.out.name} → ${
                t.in.name
              } (+${t.gain.toFixed(2)} score, £${t.cost}m)`
            );
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
            transfers_found: recommendations.transfers?.length || 0,
          },
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
      club,
    });

    players = players
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit));

    res.json({
      count: players.length,
      players: players.map((p) => ({
        name: p.player_name,
        club: p.club_name,
        position: p.position,
        price: p.price,
        score: p.score,
      })),
    });
  });
  const fixtureAnalyst = new FixtureAnalyst(
    teamParser.fixtureService,
    teamParser.store,
    config.llm
  );
  router.post(
    "/analyze-fixtures",
    validateRequest(analyzeFixturesSchema),
    async (req, res, next) => {
      try {
        console.log(`[API] /analyze-fixtures request:`, {
          query_length: req.body.query.length,
          has_team: !!req.body.team_text,
          gameweek: req.body.gameweek,
        });

        // Parse team if provided
        let team = null;
        let transfers = null;

        if (req.body.team_text) {
          const teamResult = await teamParser.parse(req.body.team_text, {
            useLLM: config.llm.enabled,
            gameweek: req.body.gameweek,
          });
          team = teamResult.players;

          // Get transfer suggestions if requested
          if (req.body.include_transfers && team.length > 0) {
            const recommendations = recommender.recommend(team, {
              bank: req.body.bank,
              maxTransfers: 1,
              gameweek: req.body.gameweek,
            });
            transfers = recommendations.transfers;
          }
        }

        // Analyze with LLM
        const analysis = await fixtureAnalyst.analyzeFixtures(req.body.query, {
          team,
          gameweek: req.body.gameweek,
          transfers,
          bank: req.body.bank,
        });

        console.log(`[API] /analyze-fixtures response:`, {
          success: analysis.success,
          function_calls: analysis.function_calls?.length || 0,
          has_fallback: !!analysis.fallback,
        });

        res.json(analysis);
      } catch (error) {
        console.error(`[API] /analyze-fixtures error:`, error.message);
        next(error);
      }
    }
  );

  // NEW: Compare multiple players' fixtures
  router.post(
    "/compare-players-fixtures",
    validateRequest(comparePlayersSchema),
    async (req, res, next) => {
      try {
        console.log(`[API] /compare-players-fixtures request:`, {
          players: req.body.players,
          gameweeks_ahead: req.body.gameweeks_ahead,
        });

        const currentGw = req.body.current_gameweek || 1;
        const comparisons = [];

        // Get fixture data for each player
        for (const playerName of req.body.players) {
          const query = `Analyze fixtures for ${playerName} over the next ${req.body.gameweeks_ahead} gameweeks`;

          const analysis = await fixtureAnalyst.analyzeFixtures(query, {
            gameweek: currentGw,
          });

          comparisons.push({
            player: playerName,
            analysis: analysis.analysis || analysis.fallback,
          });
        }

        // Get overall comparison
        const comparisonQuery = `Compare the fixtures of these players: ${req.body.players.join(
          ", "
        )}. Which player has the best upcoming fixtures for FPL?`;

        const overallAnalysis = await fixtureAnalyst.analyzeFixtures(
          comparisonQuery,
          { gameweek: currentGw }
        );

        res.json({
          individual_analyses: comparisons,
          overall_comparison:
            overallAnalysis.analysis || overallAnalysis.fallback,
          gameweeks_analyzed: req.body.gameweeks_ahead,
          starting_gameweek: currentGw,
        });
      } catch (error) {
        console.error(`[API] /compare-players-fixtures error:`, error.message);
        next(error);
      }
    }
  );

  // NEW: Get fixture insights for specific gameweek
  router.get("/fixture-insights/:gameweek", async (req, res, next) => {
    try {
      const gameweek = parseInt(req.params.gameweek);

      if (isNaN(gameweek) || gameweek < 1 || gameweek > 38) {
        return res.status(400).json({
          error: "Invalid gameweek. Must be between 1 and 38.",
        });
      }

      console.log(`[API] /fixture-insights/${gameweek} request`);

      // Get best and worst fixtures for the gameweek
      const query = `What are the best and worst fixtures in gameweek ${gameweek}? Which teams should FPL managers target or avoid?`;

      const analysis = await fixtureAnalyst.analyzeFixtures(query, {
        gameweek,
      });

      // Get top players from easy fixture teams
      const easyFixtureTeams = [];
      const hardFixtureTeams = [];

      // Check all teams
      const teams = config.data.plClubs;
      for (const team of teams) {
        const fixture = teamParser.fixtureService.getFixture(team, gameweek);
        if (fixture) {
          if (fixture.difficulty === "easy") {
            easyFixtureTeams.push({
              team,
              opponent: fixture.opponent,
              venue: fixture.home ? "H" : "A",
              fdr: fixture.fdr,
            });
          } else if (fixture.difficulty === "hard") {
            hardFixtureTeams.push({
              team,
              opponent: fixture.opponent,
              venue: fixture.home ? "H" : "A",
              fdr: fixture.fdr,
            });
          }
        }
      }

      // Get top players from easy fixture teams
      const recommendations = [];
      for (const teamInfo of easyFixtureTeams.slice(0, 3)) {
        const players = teamParser.store
          .getByClub(teamInfo.team)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2)
          .map((p) => ({
            name: p.player_name,
            position: p.position,
            price: p.price,
            score: p.score,
            adjusted_score: (p.score * 1.1).toFixed(2),
          }));

        if (players.length > 0) {
          recommendations.push({
            team: teamInfo.team,
            fixture: `${teamInfo.opponent} (${teamInfo.venue})`,
            fdr: teamInfo.fdr,
            top_players: players,
          });
        }
      }

      res.json({
        gameweek,
        llm_analysis: analysis.analysis || analysis.fallback,
        easy_fixtures: easyFixtureTeams,
        hard_fixtures: hardFixtureTeams,
        player_recommendations: recommendations,
      });
    } catch (error) {
      console.error(`[API] /fixture-insights error:`, error.message);
      next(error);
    }
  });

  // NEW: Natural language fixture questions
  router.post("/fixture-query", async (req, res, next) => {
    try {
      const { question, context } = req.body;

      if (!question) {
        return res.status(400).json({
          error: "Question is required",
        });
      }

      console.log(`[API] /fixture-query request:`, {
        question_length: question.length,
        has_context: !!context,
      });

      const analysis = await fixtureAnalyst.analyzeFixtures(
        question,
        context || {}
      );

      res.json({
        question,
        answer: analysis.analysis || analysis.fallback,
        function_calls_used: analysis.function_calls?.length || 0,
        success: analysis.success,
      });
    } catch (error) {
      console.error(`[API] /fixture-query error:`, error.message);
      next(error);
    }
  });
  return router;
}
