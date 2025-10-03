// src/api/swaggerPaths/ai.js
const aiPaths = {
    "/analyze-fixtures": {
      post: {
        summary: "Analyze fixtures using AI with function calling",
        tags: ["AI Analysis"],
        description:
          "Uses LLM with function calling to analyze fixtures and provide strategic insights",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["query"],
                properties: {
                  query: {
                    type: "string",
                    description: "Natural language question about fixtures",
                    example:
                      "Which teams have the easiest fixtures in the next 3 gameweeks?",
                  },
                  team_text: {
                    type: "string",
                    description: "Optional team to analyze",
                    example:
                      "Ramsdale, TAA, Saliba, Gabriel, Trippier, Rice, Palmer, Saka, Haaland, Jesus, Watkins",
                  },
                  gameweek: {
                    type: "integer",
                    minimum: 1,
                    maximum: 38,
                    description: "Current gameweek for analysis",
                    example: 7,
                  },
                  bank: {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    default: 0,
                    description: "Available budget for transfers",
                  },
                  include_transfers: {
                    type: "boolean",
                    default: false,
                    description: "Include transfer suggestions in analysis",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "AI analysis of fixtures",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    analysis: {
                      type: "string",
                      description: "AI-generated analysis",
                      example:
                        "Based on fixture analysis, Manchester City and Arsenal have the most favorable fixtures over the next 3 gameweeks...",
                    },
                    function_calls: {
                      type: "array",
                      description: "Functions called by the AI",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          arguments: { type: "object" },
                        },
                      },
                    },
                    fallback: {
                      type: "string",
                      nullable: true,
                      description: "Fallback analysis if LLM fails",
                    },
                    usage: {
                      type: "object",
                      properties: {
                        prompt_tokens: { type: "integer" },
                        completion_tokens: { type: "integer" },
                        total_tokens: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid request" },
        },
      },
    },
  
    "/compare-players-fixtures": {
      post: {
        summary: "Compare fixtures for multiple players",
        tags: ["AI Analysis"],
        description: "AI-powered comparison of fixture difficulty for 2-5 players",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["players"],
                properties: {
                  players: {
                    type: "array",
                    minItems: 2,
                    maxItems: 5,
                    items: { type: "string" },
                    description: "Player names to compare",
                    example: ["Haaland", "Salah", "Palmer"],
                  },
                  gameweeks_ahead: {
                    type: "integer",
                    minimum: 1,
                    maximum: 10,
                    default: 5,
                    description: "Number of gameweeks to analyze",
                  },
                  current_gameweek: {
                    type: "integer",
                    minimum: 1,
                    maximum: 38,
                    description: "Starting gameweek for analysis",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Player fixture comparison",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    individual_analyses: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          player: { type: "string" },
                          analysis: { type: "string" },
                        },
                      },
                    },
                    overall_comparison: {
                      type: "string",
                      description: "AI comparison of all players",
                    },
                    gameweeks_analyzed: { type: "integer" },
                    starting_gameweek: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
  
    "/fixture-insights/{gameweek}": {
      get: {
        summary: "Get AI insights for a specific gameweek",
        tags: ["AI Analysis"],
        parameters: [
          {
            name: "gameweek",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1, maximum: 38 },
            description: "Gameweek number",
          },
        ],
        responses: {
          200: {
            description: "Gameweek fixture insights",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    gameweek: { type: "integer" },
                    llm_analysis: {
                      type: "string",
                      description: "AI analysis of the gameweek",
                    },
                    easy_fixtures: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          team: { type: "string" },
                          opponent: { type: "string" },
                          venue: { type: "string", enum: ["H", "A"] },
                          fdr: { type: "integer" },
                        },
                      },
                    },
                    hard_fixtures: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          team: { type: "string" },
                          opponent: { type: "string" },
                          venue: { type: "string", enum: ["H", "A"] },
                          fdr: { type: "integer" },
                        },
                      },
                    },
                    player_recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          team: { type: "string" },
                          fixture: { type: "string" },
                          fdr: { type: "integer" },
                          top_players: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                name: { type: "string" },
                                position: { type: "string" },
                                price: { type: "number" },
                                score: { type: "number" },
                                adjusted_score: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid gameweek" },
        },
      },
    },
  
    "/fixture-query": {
      post: {
        summary: "Ask any fixture-related question",
        tags: ["AI Analysis"],
        description:
          "Natural language interface for fixture queries using AI function calling",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["question"],
                properties: {
                  question: {
                    type: "string",
                    description: "Your fixture-related question",
                    example:
                      "Should I captain Haaland against Liverpool or Salah against Fulham?",
                  },
                  context: {
                    type: "object",
                    description: "Optional context for the question",
                    properties: {
                      gameweek: { type: "integer" },
                      team: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Player" },
                      },
                      bank: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "AI answer to fixture question",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string", description: "AI-generated answer" },
                    function_calls_used: {
                      type: "integer",
                      description: "Number of function calls made",
                    },
                    success: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  
  export default aiPaths;
  