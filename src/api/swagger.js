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
          "Fantasy Premier League team parser and transfer recommender API",
      },
      servers: [
        {
          url: `http://localhost:${config.app.port}`,
          description: "Local development server",
        },
      ],
      components: {
        schemas: {
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
            },
          },

          Transfer: {
            type: "object",
            properties: {
              out: { $ref: "#/components/schemas/Player" },
              in: { $ref: "#/components/schemas/Player" },
              gain: { type: "number", example: 1.5 },
              cost: { type: "number", example: 2.0 },
            },
          },

          Recommendation: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              transfers: {
                type: "array",
                items: { $ref: "#/components/schemas/Transfer" },
              },
              explanation: { type: "string" },
              new_team: {
                type: "array",
                items: { $ref: "#/components/schemas/Player" },
              },
              impact: {
                type: "object",
                properties: {
                  score_gain: { type: "number" },
                  cost: { type: "number" },
                  transfers_used: { type: "number" },
                },
              },
              parsed_team: { $ref: "#/components/schemas/ParsedTeam" },
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
                        llm_enabled: { type: "boolean" },
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
