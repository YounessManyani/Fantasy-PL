// src/api/swaggerPaths/core.js
const corePaths = {
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
                  // gameweek toggles fixture annotations
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
          400: { description: "Invalid request" },
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
                  team_text: { type: "string", description: "Current team as text" },
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
                  strict_mode: { type: "boolean", default: false },
                  use_llm: { type: "boolean", default: false },
                  // gameweek drives fixture-adjusted scoring
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
          400: { description: "Invalid team or request" },
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
            schema: { type: "string", enum: ["GK", "DEF", "MID", "FWD"] },
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
            schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
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
  };
  
  export default corePaths;
  