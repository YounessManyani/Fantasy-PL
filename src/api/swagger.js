// src/api/swagger.js
import swaggerJsdoc from "swagger-jsdoc";

export function createSwaggerSpec(config) {
  const options = {
    definition: {
      openapi: "3.0.3",
      info: {
        title: config.app.title,
        version: config.app.version,
        description:
          "Fantasy Premier League team parser and transfer recommender API (fixture-aware with FDR/RAG).",
      },
      servers: [
        {
          url: `http://localhost:${config.app.port}`,
          description: "Local development server",
        },
      ],
      components: {
        schemas: {
          // ---------- NEW: Fixture schema (used by Player.next_fixture and Transfer.meta) ----------
          Fixture: {
            type: "object",
            properties: {
              opponent: { type: "string", example: "West Ham United" },
              home: { type: "boolean", example: true },
              fdr: { type: "integer", minimum: 1, maximum: 5, example: 2 },
              difficulty: {
                type: "string",
                enum: ["easy", "medium", "hard"],
                example: "easy",
              },
            },
            required: ["opponent", "home", "fdr", "difficulty"],
          },

          // ---------- UPDATED: Player now optionally includes next_fixture + adjusted_score ----------
          Player: {
            type: "object",
            properties: {
              name: { type: "string", example: "Erling Haaland" },
              club: { type: "string", example: "Manchester City" },
              position: {
                type: "string",
                enum: ["GK", "DEF", "MID", "FWD"],
                example: "FWD",
              },
              price: { type: "number", example: 14.0 },
              score: { type: "number", example: 8.5 },
              points_per_game: { type: "number", example: 7.2 },

              // ---- FDR/RAG additions ----
              next_fixture: {
                $ref: "#/components/schemas/Fixture",
                nullable: true,
                description:
                  "Annotated when a gameweek is provided on /parse-team or /recommend.",
              },
              adjusted_score: {
                type: "number",
                nullable: true,
                example: 9.35,
                description:
                  "Fixture-adjusted score (easy ×1.10, medium ×1.00, hard ×0.90).",
              },
            },
            required: ["name", "club", "position", "price", "score"],
          },

          TeamStats: {
            type: "object",
            properties: {
              total_value: { type: "number", example: 98.5 },
              by_position: {
                type: "object",
                example: { GK: 1, DEF: 4, MID: 4, FWD: 2 },
              },
              by_club: {
                type: "object",
                example: { "Manchester City": 3, Arsenal: 2 },
              },
              average_score: { type: "number", example: 5.4 },
              formation: { type: "string", example: "4-4-2" },
            },
          },

          ParsedTeam: {
            type: "object",
            properties: {
              players: {
                type: "array",
                items: { $ref: "#/components/schemas/Player" },
              },
              unknown: {
                type: "array",
                items: { type: "string" },
                example: ["Unknown Player"],
              },
              duplicates: {
                type: "array",
                items: { type: "string" },
              },
              suggestions: {
                type: "object",
                example: {
                  Halland: [
                    {
                      name: "Erling Haaland",
                      club: "Manchester City",
                      similarity: 85,
                    },
                  ],
                },
              },
              stats: { $ref: "#/components/schemas/TeamStats" },
              validation: {
                type: "object",
                properties: {
                  valid: { type: "boolean" },
                  errors: {
                    type: "array",
                    items: { type: "string" },
                  },
                  warnings: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
              debug: {
                type: "object",
                nullable: true,
                properties: {
                  llm_requested: { type: "boolean" },
                  llm_available: { type: "boolean" },
                  llm_used: { type: "boolean" },
                  unknown_count: { type: "number" },
                },
              },
            },
          },

          // ---------- UPDATED: Transfer with FDR meta ----------
          Transfer: {
            type: "object",
            properties: {
              out: { $ref: "#/components/schemas/Player" },
              in: { $ref: "#/components/schemas/Player" },
              gain: { type: "number", example: 1.5 },
              cost: { type: "number", example: 2.0 },
              meta: {
                type: "object",
                nullable: true,
                properties: {
                  gameweek: { type: "integer", example: 7 },
                  out_fixture: { $ref: "#/components/schemas/Fixture" },
                  in_fixture: { $ref: "#/components/schemas/Fixture" },
                  out_adjusted: { type: "number", example: 5.49 },
                  in_adjusted: { type: "number", example: 7.04 },
                },
              },
            },
          },

          // ---------- UPDATED: Recommendation shows explanation + parsed team + optional difficulty summary ----------
          Recommendation: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              transfers: {
                type: "array",
                items: { $ref: "#/components/schemas/Transfer" },
              },
              explanation: {
                type: "string",
                example:
                  "GW7 fixtures → OUT: West Ham: Arsenal (A), FDR 4 – hard | IN: Arsenal: West Ham (H), FDR 2 – easy\nAdjusted: IN 7.04 vs OUT 5.49 (uses FDR multipliers)",
              },
              new_team: {
                type: "array",
                items: { $ref: "#/components/schemas/Player" },
              },
              impact: {
                type: "object",
                properties: {
                  score_gain: { type: "number", example: 1.55 },
                  cost: { type: "number", example: 0.5 },
                  transfers_used: { type: "number", example: 1 },
                },
              },
              parsed_team: { $ref: "#/components/schemas/ParsedTeam" },
              difficulty_summary: {
                type: "object",
                nullable: true,
                properties: {
                  before: {
                    type: "object",
                    example: { easy: 2, medium: 6, hard: 3 },
                  },
                  after: {
                    type: "object",
                    example: { easy: 3, medium: 6, hard: 2 },
                  },
                },
              },
            },
          },
        },
      },
      paths: {
        "/health": {
          get: {
            summary: "Health check",
            tags: ["System"],
            responses: {
              200: {
                description: "Service is healthy",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        status: { type: "string", example: "healthy" },
                        version: { type: "string" },
                        environment: { type: "string" },
                        players_loaded: { type: "number" },
                        llm: {
                          type: "object",
                          properties: {
                            enabled: { type: "boolean", example: true },
                            provider: { type: "string", example: "openai" },
                            model: { type: "string", example: "gpt-4o" },
                            has_key: { type: "boolean", example: true },
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

        "/parse-team": {
          post: {
            summary: "Parse team from text",
            tags: ["Team"],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["team_text"],
                    properties: {
                      team_text: {
                        type: "string",
                        example:
                          "Ramsdale, Walker, Saliba, Gabriel, Trippier, Rice, Odegaard, Saka, Haaland, Jesus, Watkins",
                      },
                      strict_mode: {
                        type: "boolean",
                        default: false,
                        description: "Require full player names",
                      },
                      include_suggestions: {
                        type: "boolean",
                        default: true,
                        description: "Include suggestions for unknown players",
                      },
                      use_llm: {
                        type: "boolean",
                        default: false,
                        description: "Use LLM for name resolution",
                      },
                      // ---------- NEW: gameweek toggles fixture annotations ----------
                      gameweek: {
                        type: "integer",
                        minimum: 1,
                        maximum: 38,
                        description:
                          "Optional gameweek. When provided, players include next_fixture and adjusted_score.",
                        example: 7,
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description: "Team successfully parsed",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/ParsedTeam" },
                  },
                },
              },
              400: {
                description: "Invalid request",
              },
            },
          },
        },

        "/recommend": {
          post: {
            summary: "Get transfer recommendations",
            tags: ["Transfers"],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["team_text"],
                    properties: {
                      team_text: {
                        type: "string",
                        description: "Current team as text",
                      },
                      bank: {
                        type: "number",
                        minimum: 0,
                        maximum: 100,
                        default: 0,
                        description: "Available budget",
                      },
                      max_transfers: {
                        type: "integer",
                        minimum: 1,
                        maximum: 2,
                        default: 1,
                        description: "Maximum number of transfers",
                      },
                      strict_mode: {
                        type: "boolean",
                        default: false,
                      },
                      use_llm: {
                        type: "boolean",
                        default: false,
                      },
                      // ---------- NEW: gameweek drives fixture-adjusted scoring ----------
                      gameweek: {
                        type: "integer",
                        minimum: 1,
                        maximum: 38,
                        description:
                          "Optional gameweek. When provided, recommendations use fixture-adjusted scores and include fixture context.",
                        example: 7,
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description: "Recommendations generated",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Recommendation" },
                  },
                },
              },
              400: {
                description: "Invalid team or request",
              },
            },
          },
        },

        "/players": {
          get: {
            summary: "Get players list",
            tags: ["Players"],
            parameters: [
              {
                name: "position",
                in: "query",
                schema: {
                  type: "string",
                  enum: ["GK", "DEF", "MID", "FWD"],
                },
                description: "Filter by position",
              },
              {
                name: "club",
                in: "query",
                schema: { type: "string" },
                description: "Filter by club",
              },
              {
                name: "limit",
                in: "query",
                schema: {
                  type: "integer",
                  minimum: 1,
                  maximum: 100,
                  default: 50,
                },
                description: "Maximum number of results",
              },
            ],
            responses: {
              200: {
                description: "Players list",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        count: { type: "number" },
                        players: {
                          type: "array",
                          items: { $ref: "#/components/schemas/Player" },
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
    apis: [],
  };

  return swaggerJsdoc(options);
}
