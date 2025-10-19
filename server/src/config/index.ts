import dotenv from "dotenv";
import path from "path";
import { AppConfig } from "../types/config.types";
import { PL_CLUBS } from "../models/constants/clubs.constants";
import { FPL_RULES } from "../models/constants/fpl-rules.constants";

// Load environment variables
dotenv.config();

const config: AppConfig = {
  app: {
    port: Number(process.env.PORT) || 8000,
    title: "FPL API",
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
  },

  data: {
    // Utiliser des chemins relatifs au process.cwd() (racine du projet)
    csvPath:
      process.env.CSV_PATH ||
      path.resolve(process.cwd(), "src/models/data/fpl_player_statistics.csv"),
    fdrPath:
      process.env.FDR_PATH ||
      path.resolve(process.cwd(), "src/models/data/fdr_2025_26.json"),
    plClubs: PL_CLUBS as any,
  },

  llm: {
    enabled: process.env.USE_LLM === "1",
    provider: process.env.LLM_PROVIDER || "openai",
    apiKey: process.env.OPENAI_API_KEY?.trim(),
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    timeout: Number(process.env.LLM_TIMEOUT) || 120000,
    maxTokens: Number(process.env.LLM_MAX_TOKENS) || 400,
  },

  rules: FPL_RULES,

  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
};

// Validate LLM config
if (config.llm.enabled && !config.llm.apiKey) {
  console.warn("[Config] LLM enabled but API key missing");
}

export default config;
