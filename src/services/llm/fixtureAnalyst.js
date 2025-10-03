// src/services/llm/fixtureAnalyst.js
import OpenAI from "openai";

export class FixtureAnalyst {
  constructor(fixtureService, playerStore, llmConfig) {
    this.fixtureService = fixtureService;
    this.playerStore = playerStore;
    this.llmConfig = llmConfig;
    this.openai = null;

    if (llmConfig?.enabled && llmConfig?.apiKey) {
      this.openai = new OpenAI({ apiKey: llmConfig.apiKey });
    }
  }

  /**
   * Main method to analyze fixtures and provide insights
   */
  async analyzeFixtures(query, context = {}) {
    if (!this.openai) {
      return {
        success: false,
        error: "LLM not configured",
        fallback: this.getFallbackAnalysis(query, context),
      };
    }

    try {
      const { team, gameweek, transfers } = context;

      // Define available functions for the LLM
      const functions = [
        {
          name: "get_fixture",
          description:
            "Get fixture information for a team in a specific gameweek",
          parameters: {
            type: "object",
            properties: {
              club_name: {
                type: "string",
                description: "Name of the club",
              },
              gameweek: {
                type: "integer",
                description: "Gameweek number (1-38)",
              },
            },
            required: ["club_name", "gameweek"],
          },
        },
        {
          name: "get_fixture_run",
          description:
            "Get upcoming fixtures for a team over multiple gameweeks",
          parameters: {
            type: "object",
            properties: {
              club_name: {
                type: "string",
                description: "Name of the club",
              },
              start_gw: {
                type: "integer",
                description: "Starting gameweek",
              },
              num_gameweeks: {
                type: "integer",
                description: "Number of gameweeks to analyze",
                default: 5,
              },
            },
            required: ["club_name", "start_gw"],
          },
        },
        {
          name: "compare_fixtures",
          description: "Compare fixture difficulty between two clubs",
          parameters: {
            type: "object",
            properties: {
              club1: {
                type: "string",
                description: "First club name",
              },
              club2: {
                type: "string",
                description: "Second club name",
              },
              gameweek: {
                type: "integer",
                description: "Gameweek to compare",
              },
            },
            required: ["club1", "club2", "gameweek"],
          },
        },
        {
          name: "analyze_player_fixtures",
          description: "Analyze fixtures for a specific player",
          parameters: {
            type: "object",
            properties: {
              player_name: {
                type: "string",
                description: "Name of the player",
              },
              gameweeks: {
                type: "integer",
                description: "Number of upcoming gameweeks to analyze",
                default: 3,
              },
            },
            required: ["player_name"],
          },
        },
      ];

      // Create the context-aware prompt
      const systemPrompt = this.createSystemPrompt(context);
      const userPrompt = this.createUserPrompt(query, context);

      // Initial LLM call with function definitions
      const response = await this.openai.chat.completions.create({
        model: this.llmConfig.model || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        functions: functions,
        function_call: "auto",
        temperature: 0.3,
        max_tokens: 800,
      });

      // Process function calls if any
      let finalResponse = response;
      if (response.choices[0].message.function_call) {
        const functionCallResults = await this.executeFunctionCalls(
          response.choices[0].message
        );

        // Send results back to LLM for final analysis
        finalResponse = await this.openai.chat.completions.create({
          model: this.llmConfig.model || "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
            response.choices[0].message,
            {
              role: "function",
              name: response.choices[0].message.function_call.name,
              content: JSON.stringify(functionCallResults),
            },
          ],
          temperature: 0.3,
          max_tokens: 800,
        });
      }

      return {
        success: true,
        analysis: finalResponse.choices[0].message.content,
        function_calls: response.choices[0].message.function_call
          ? [response.choices[0].message.function_call]
          : [],
        usage: finalResponse.usage,
      };
    } catch (error) {
      console.error("[FixtureAnalyst] Error:", error);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackAnalysis(query, context),
      };
    }
  }

  /**
   * Execute function calls requested by the LLM
   */
  async executeFunctionCalls(message) {
    const { function_call } = message;
    const args = JSON.parse(function_call.arguments);

    console.log(
      `[FixtureAnalyst] Executing function: ${function_call.name}`,
      args
    );

    switch (function_call.name) {
      case "get_fixture":
        return this.getFixtureData(args.club_name, args.gameweek);

      case "get_fixture_run":
        return this.getFixtureRun(
          args.club_name,
          args.start_gw,
          args.num_gameweeks || 5
        );

      case "compare_fixtures":
        return this.compareFixtures(args.club1, args.club2, args.gameweek);

      case "analyze_player_fixtures":
        return this.analyzePlayerFixtures(
          args.player_name,
          args.gameweeks || 3
        );

      default:
        return { error: `Unknown function: ${function_call.name}` };
    }
  }

  /**
   * Get fixture data for a club
   */
  getFixtureData(clubName, gameweek) {
    const fixture = this.fixtureService.getFixture(clubName, gameweek);

    if (!fixture) {
      return {
        club: clubName,
        gameweek: gameweek,
        error: "No fixture data available",
      };
    }

    const factor = this.fixtureService.getFactor(fixture.fdr);

    return {
      club: clubName,
      gameweek: gameweek,
      opponent: fixture.opponent,
      venue: fixture.home ? "Home" : "Away",
      fdr: fixture.fdr,
      difficulty: fixture.difficulty,
      multiplier: factor,
      impact: this.describeImpact(factor),
    };
  }

  /**
   * Get upcoming fixtures for a club
   */
  getFixtureRun(clubName, startGw, numGameweeks) {
    const fixtures = [];
    let totalFdr = 0;
    let easyCount = 0,
      mediumCount = 0,
      hardCount = 0;

    for (let gw = startGw; gw < startGw + numGameweeks; gw++) {
      const fixture = this.fixtureService.getFixture(clubName, gw);
      if (fixture) {
        fixtures.push({
          gw: gw,
          opponent: fixture.opponent,
          venue: fixture.home ? "H" : "A",
          fdr: fixture.fdr,
          difficulty: fixture.difficulty,
        });

        totalFdr += fixture.fdr;
        if (fixture.difficulty === "easy") easyCount++;
        else if (fixture.difficulty === "medium") mediumCount++;
        else hardCount++;
      }
    }

    return {
      club: clubName,
      gameweeks: `${startGw}-${startGw + numGameweeks - 1}`,
      fixtures: fixtures,
      summary: {
        average_fdr:
          fixtures.length > 0 ? (totalFdr / fixtures.length).toFixed(2) : 0,
        difficulty_breakdown: {
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount,
        },
        rating: this.rateFixtureRun(totalFdr / fixtures.length),
      },
    };
  }

  /**
   * Compare fixtures between two clubs
   */
  compareFixtures(club1, club2, gameweek) {
    const fixture1 = this.getFixtureData(club1, gameweek);
    const fixture2 = this.getFixtureData(club2, gameweek);

    const comparison = {
      gameweek: gameweek,
      club1: fixture1,
      club2: fixture2,
      recommendation: "neutral",
    };

    if (fixture1.fdr && fixture2.fdr) {
      if (fixture1.fdr < fixture2.fdr) {
        comparison.recommendation = `${club1} has easier fixture`;
        comparison.fdr_difference = fixture2.fdr - fixture1.fdr;
      } else if (fixture2.fdr < fixture1.fdr) {
        comparison.recommendation = `${club2} has easier fixture`;
        comparison.fdr_difference = fixture1.fdr - fixture2.fdr;
      } else {
        comparison.recommendation = "Similar difficulty";
      }
    }

    return comparison;
  }

  /**
   * Analyze fixtures for a specific player
   */
  analyzePlayerFixtures(playerName, numGameweeks) {
    // Find the player in the store
    const normalizedName = playerName.toLowerCase();
    const allPlayers = this.playerStore.players;

    const player = allPlayers.find(
      (p) =>
        p.player_name.toLowerCase().includes(normalizedName) ||
        p.normalized_name.includes(normalizedName)
    );

    if (!player) {
      return {
        error: `Player "${playerName}" not found`,
        suggestion: "Please check the player name",
      };
    }

    // Get fixture run for player's club
    const currentGw = 1; // You might want to pass this as context
    const fixtureRun = this.getFixtureRun(
      player.club_name,
      currentGw,
      numGameweeks
    );

    // Calculate expected performance
    let totalAdjustedScore = 0;
    for (const fx of fixtureRun.fixtures) {
      const factor = this.fixtureService.getFactor(fx.fdr);
      totalAdjustedScore += player.score * factor;
    }

    return {
      player: {
        name: player.player_name,
        club: player.club_name,
        position: player.position,
        base_score: player.score,
        price: player.price,
      },
      fixtures: fixtureRun,
      expected_performance: {
        total_adjusted_score: totalAdjustedScore.toFixed(2),
        average_adjusted_score: (totalAdjustedScore / numGameweeks).toFixed(2),
        recommendation: this.getPlayerRecommendation(
          fixtureRun.summary.average_fdr,
          player.score,
          player.price
        ),
      },
    };
  }

  /**
   * Create system prompt for LLM
   */
  createSystemPrompt(context) {
    return `You are an expert FPL (Fantasy Premier League) analyst specializing in fixture analysis.
    
Your role is to:
1. Analyze fixture difficulty ratings (FDR) where 1-2 is easy, 3 is medium, and 4-5 is hard
2. Explain how fixtures impact player performance (easy: +10%, medium: 0%, hard: -10%)
3. Provide strategic insights for transfers and team selection
4. Consider both individual fixtures and fixture runs

When analyzing, consider:
- Home vs Away advantage
- Recent team form (if available)
- Player consistency across different fixture difficulties
- Budget constraints for transfers
- Both short-term (next 1-3 GWs) and medium-term (4-6 GWs) perspectives

Be concise but insightful. Focus on actionable recommendations.`;
  }

  /**
   * Create user prompt with context
   */
  createUserPrompt(query, context) {
    let prompt = query;

    if (context.team && context.team.length > 0) {
      prompt += `\n\nCurrent team (${context.team.length} players):`;
      context.team.slice(0, 5).forEach((p) => {
        prompt += `\n- ${p.name} (${p.club}, ${p.position}, £${p.price}m)`;
      });
      if (context.team.length > 5) {
        prompt += `\n... and ${context.team.length - 5} more players`;
      }
    }

    if (context.gameweek) {
      prompt += `\n\nCurrent gameweek: ${context.gameweek}`;
    }

    if (context.transfers && context.transfers.length > 0) {
      prompt += `\n\nProposed transfers:`;
      context.transfers.forEach((t) => {
        prompt += `\n- OUT: ${t.out.name} → IN: ${t.in.name} (gain: ${t.gain})`;
      });
    }

    if (context.bank !== undefined) {
      prompt += `\n\nAvailable budget: £${context.bank}m`;
    }

    return prompt;
  }

  /**
   * Helper methods
   */
  describeImpact(factor) {
    if (factor > 1.05)
      return "Positive impact - easier fixture boosts expected returns";
    if (factor < 0.95)
      return "Negative impact - difficult fixture reduces expected returns";
    return "Neutral impact - standard difficulty fixture";
  }

  rateFixtureRun(avgFdr) {
    if (avgFdr <= 2.0) return "Excellent - very favorable fixtures";
    if (avgFdr <= 2.5) return "Good - mostly favorable fixtures";
    if (avgFdr <= 3.0) return "Average - mixed fixtures";
    if (avgFdr <= 3.5) return "Challenging - mostly difficult fixtures";
    return "Very Difficult - extremely tough fixtures";
  }

  getPlayerRecommendation(avgFdr, score, price) {
    const value = score / price;

    if (avgFdr <= 2.5 && value > 0.6) {
      return "Strong Buy - Great fixtures and good value";
    } else if (avgFdr <= 2.5) {
      return "Consider - Good fixtures ahead";
    } else if (avgFdr >= 3.5 && value < 0.5) {
      return "Avoid/Sell - Difficult fixtures and poor value";
    } else if (avgFdr >= 3.5) {
      return "Monitor - Tough fixtures ahead";
    }
    return "Hold - Reasonable fixtures";
  }

  /**
   * Fallback analysis when LLM is not available
   */
  getFallbackAnalysis(query, context) {
    const analysis = [];

    if (context.team && context.gameweek) {
      analysis.push("Fixture Analysis (Non-LLM):");

      // Analyze team fixtures
      const teamFixtures = context.team.map((player) => {
        const fx = this.fixtureService.getFixture(
          player.club,
          context.gameweek
        );
        return { player, fixture: fx };
      });

      const easy = teamFixtures.filter(
        (tf) => tf.fixture?.difficulty === "easy"
      ).length;
      const hard = teamFixtures.filter(
        (tf) => tf.fixture?.difficulty === "hard"
      ).length;

      analysis.push(`- ${easy} players with easy fixtures`);
      analysis.push(`- ${hard} players with difficult fixtures`);
    }

    if (context.transfers) {
      analysis.push("\nTransfer fixture impact:");
      context.transfers.forEach((t) => {
        if (t.meta?.in_fixture && t.meta?.out_fixture) {
          analysis.push(
            `- ${t.in.name} (${t.meta.in_fixture.difficulty}) ` +
              `replacing ${t.out.name} (${t.meta.out_fixture.difficulty})`
          );
        }
      });
    }

    return analysis.join("\n");
  }
}
