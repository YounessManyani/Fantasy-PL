/**
 * Définitions OpenAPI des schémas de données
 */
export const openApiSchemas = {
  // ==================== COMMON ====================
  Position: {
    type: "string",
    enum: ["GK", "DEF", "MID", "FWD"],
    description: "Position du joueur",
  },

  Difficulty: {
    type: "string",
    enum: ["easy", "medium", "hard"],
    description: "Niveau de difficulté du match",
  },

  ApiResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Indique si la requête a réussi",
      },
      data: { type: "object", description: "Données de la réponse" },
      error: { type: "string", description: "Message d'erreur si échec" },
    },
    required: ["success"],
  },

  // ==================== PLAYER ====================
  Player: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Identifiant unique", example: 42 },
      playerName: {
        type: "string",
        description: "Nom complet du joueur",
        example: "Mohamed Salah",
      },
      clubName: {
        type: "string",
        description: "Nom du club",
        example: "Liverpool",
      },
      position: { $ref: "#/components/schemas/Position" },
      price: {
        type: "number",
        format: "float",
        description: "Prix en millions (£)",
        example: 13.0,
      },
      score: {
        type: "number",
        format: "float",
        description: "Score calculé (algorithme interne)",
        example: 2.45,
      },
      pointsPerGame: {
        type: "number",
        format: "float",
        description: "Points par match",
        example: 6.8,
      },
      totalPoints: {
        type: "integer",
        description: "Points totaux de la saison",
        example: 204,
      },
    },
  },

  EnrichedPlayer: {
    allOf: [
      { $ref: "#/components/schemas/Player" },
      {
        type: "object",
        properties: {
          nextFixture: { $ref: "#/components/schemas/Fixture", nullable: true },
          adjustedScore: {
            type: "number",
            format: "float",
            description: "Score ajusté avec multiplicateur de fixture",
            example: 2.695,
          },
        },
      },
    ],
  },

  PlayerFilters: {
    type: "object",
    properties: {
      position: { $ref: "#/components/schemas/Position" },
      club: { type: "string", example: "Arsenal" },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
    },
  },

  PlayerSuggestion: {
    type: "object",
    properties: {
      name: { type: "string", example: "Mohamed Salah" },
      club: { type: "string", example: "Liverpool" },
      similarity: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description: "Similarité en %",
        example: 85,
      },
    },
  },

  // ==================== FIXTURE ====================
  Fixture: {
    type: "object",
    properties: {
      opponent: { type: "string", example: "Arsenal" },
      home: { type: "boolean", description: "Match à domicile", example: true },
      fdr: {
        type: "integer",
        minimum: 1,
        maximum: 5,
        description: "Fixture Difficulty Rating",
        example: 4,
      },
      difficulty: { $ref: "#/components/schemas/Difficulty" },
    },
  },

  // ==================== TEAM ====================

  ParseTeamRequest: {
    type: "object",
    required: ["teamText"],
    properties: {
      teamText: {
        type: "string",
        description:
          "Liste de noms de joueurs (séparés par virgules, sauts de ligne, etc.)",
        example:
          "Salah, Haaland, Son, KDB, Saka, Trent, Van Dijk, Gabriel, Porro, Watkins",
      },
      strictMode: {
        type: "boolean",
        default: false,
        description: "Mode strict (requiert ≥2 tokens par nom)",
      },
      includeSuggestions: {
        type: "boolean",
        default: true,
        description: "Inclure suggestions pour noms non reconnus",
      },
      useLLM: {
        type: "boolean",
        default: false,
        description: "Utiliser LLM pour résoudre ambiguïtés",
      },
      gameweek: {
        type: "integer",
        minimum: 1,
        maximum: 38,
        nullable: true,
        description:
          "Semaine de jeu pour enrichissement avec fixtures. Si omis, aucun enrichissement GW.",
        example: 10,
      },
    },
    // <-- Drives Swagger UI's default payload so GW appears in the text box + cURL
    example: {
      teamText:
        "Raya, Romero, Calafiori, Chalobah, Doku, Enzo, Gakpo, Semenyo, Kudus, Joao Pedro, Haaland",
      strictMode: false,
      includeSuggestions: true,
      useLLM: true,
      gameweek: 10,
    },
  },

  ParsedTeam: {
    type: "object",
    properties: {
      players: {
        type: "array",
        items: { $ref: "#/components/schemas/EnrichedPlayer" },
      },
      unknown: {
        type: "array",
        items: { type: "string" },
        description: "Noms non reconnus",
        example: ["Unknown Player"],
      },
      duplicates: {
        type: "array",
        items: { type: "string" },
        description: "Noms en double",
      },
      suggestions: {
        type: "object",
        additionalProperties: {
          type: "array",
          items: { $ref: "#/components/schemas/PlayerSuggestion" },
        },
      },
      stats: { $ref: "#/components/schemas/TeamStats" },
      validation: { $ref: "#/components/schemas/ValidationResult" },
      llmStats: { $ref: "#/components/schemas/LLMStats" },
    },
  },

  TeamStats: {
    type: "object",
    properties: {
      totalValue: {
        type: "number",
        format: "float",
        description: "Valeur totale de l'équipe (£)",
        example: 83.5,
      },
      byPosition: {
        type: "object",
        properties: {
          GK: { type: "integer", example: 1 },
          DEF: { type: "integer", example: 4 },
          MID: { type: "integer", example: 4 },
          FWD: { type: "integer", example: 2 },
        },
      },
      byClub: {
        type: "object",
        additionalProperties: { type: "integer" },
        example: { Liverpool: 2, Arsenal: 3, "Manchester City": 1 },
      },
      averageScore: { type: "number", format: "float", example: 2.15 },
      formation: { type: "string", example: "4-4-2" },
    },
  },

  ValidationResult: {
    type: "object",
    properties: {
      valid: { type: "boolean", example: true },
      errors: { type: "array", items: { type: "string" }, example: [] },
      warnings: {
        type: "array",
        items: { type: "string" },
        example: ["Team value £101.5m exceeds £100m budget"],
      },
    },
  },

  LLMStats: {
    type: "object",
    properties: {
      attempted: {
        type: "integer",
        description: "Nombre de tentatives LLM",
        example: 1,
      },
      resolved: {
        type: "integer",
        description: "Nombre de résolutions réussies",
        example: 1,
      },
      names: {
        type: "array",
        items: {
          type: "object",
          properties: {
            input: { type: "string", example: "KDB" },
            matched: { type: "string", example: "Kevin De Bruyne" },
          },
        },
      },
    },
  },

  // ==================== TRANSFER ====================
  RecommendRequest: {
    allOf: [
      { $ref: "#/components/schemas/ParseTeamRequest" },
      {
        type: "object",
        properties: {
          bank: {
            type: "number",
            format: "float",
            minimum: 0,
            maximum: 100,
            default: 0,
            description: "Budget disponible (£)",
            example: 2.5,
          },
          maxTransfers: {
            type: "integer",
            minimum: 1,
            maximum: 2,
            default: 1,
            description: "Nombre max de transferts",
          },
          strategy: {
            type: "string",
            enum: ["best_gain", "best_value", "balanced"],
            default: "best_gain",
            description: "Stratégie de recommandation",
          },
        },
      },
    ],
  },

  Transfer: {
    type: "object",
    properties: {
      out: {
        $ref: "#/components/schemas/Player",
        description: "Joueur sortant",
      },
      in: {
        $ref: "#/components/schemas/Player",
        description: "Joueur entrant",
      },
      gain: {
        type: "number",
        format: "float",
        description: "Gain de score attendu",
        example: 0.85,
      },
      cost: {
        type: "number",
        format: "float",
        description: "Différence de prix (£)",
        example: -1.5,
      },
      meta: {
        type: "object",
        properties: {
          gameweek: { type: "integer", example: 10 },
          outFixture: { $ref: "#/components/schemas/Fixture" },
          inFixture: { $ref: "#/components/schemas/Fixture" },
          outAdjusted: { type: "number", example: 2.25 },
          inAdjusted: { type: "number", example: 3.1 },
        },
      },
    },
  },

  TransferRecommendation: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      transfers: {
        type: "array",
        items: { $ref: "#/components/schemas/Transfer" },
      },
      impact: {
        type: "object",
        properties: {
          scoreGain: { type: "number", example: 1.25 },
          cost: { type: "number", example: -2.0 },
          transfersUsed: { type: "integer", example: 1 },
          averageGain: { type: "number", example: 1.25 },
        },
      },
      explanation: {
        type: "string",
        description: "Explication textuelle des transferts",
      },
      newTeam: {
        type: "array",
        items: { $ref: "#/components/schemas/Player" },
      },
      comparison: { type: "object", description: "Comparaison avant/après" },
    },
  },

  // ==================== HEALTH ====================
  HealthResponse: {
    type: "object",
    properties: {
      status: { type: "string", example: "healthy" },
      version: { type: "string", example: "2.0.0" },
      environment: { type: "string", example: "development" },
      playersLoaded: { type: "integer", example: 741 },
      llm: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
          provider: { type: "string", example: "openai" },
          model: { type: "string", example: "gpt-4o-mini" },
          hasKey: { type: "boolean" },
        },
      },
    },
  },
};
