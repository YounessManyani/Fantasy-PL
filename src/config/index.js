// src/config/index.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  app: {
    port: Number(process.env.PORT) || 8000,
    title: "FPL API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  },

  data: {
    csvPath:
      process.env.CSV_PATH ||
      path.resolve(__dirname, "..", "data", "fpl_player_statistics.csv"),
    plClubs: [
      "Arsenal",
      "Aston Villa",
      "Bournemouth",
      "Brentford",
      "Brighton and Hove Albion",
      "Burnly",
      "Chelsea",
      "Crystal Palace",
      "Everton",
      "Leeds United",
      "Fulham",
      "Sunderland",
      "Liverpool",
      "Manchester City",
      "Manchester United",
      "Newcastle United",
      "Nottingham Forest",
      "Tottenham Hotspur",
      "West Ham United",
      "Wolverhampton Wanderers",
    ],
  },

  llm: {
    enabled: process.env.USE_LLM === "1",
    provider: process.env.LLM_PROVIDER || "openai",
    apiKey: process.env.OPENAI_API_KEY?.trim(),
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    timeout: Number(process.env.LLM_TIMEOUT) || 120000,
    maxTokens: Number(process.env.LLM_MAX_TOKENS) || 400,
  },

  rules: {
    maxPlayersPerClub: 3,
    maxTransfers: 2,
  },
  // i need to add this coplete rules
  ruless: {
    maxPlayersPerClub: 3, // You can select up to 3 players from a single Premier League club
    squadSize: 15, // Your total squad size must be 15 players
    squadComposition: {
      goalkeepers: 2, // You must have exactly 2 goalkeepers
      defenders: 5, // Exactly 5 defenders
      midfielders: 5, // Exactly 5 midfielders
      forwards: 3, // Exactly 3 forwards
    },
    startingXI: 11, // You must select 11 players to start each gameweek
    budget: 100.0, // Initial budget is £100 million
    maxTransfersPerWeek: 1, // 1 free transfer per gameweek
    extraTransferCost: -4, // Each additional transfer costs 4 points
    wildcardChips: 2, // Two Wildcards per season (unlimited transfers)
    freeHit: 1, // One Free Hit chip per season
    benchBoost: 1, // One Bench Boost chip per season
    tripleCaptain: 1, // One Triple Captain chip per season
    autoSubstitution: true, // Automatic substitution if a starting player doesn't play
    captainDoublePoints: true, // Captain scores double points
    viceCaptainSubstitution: true, // Vice-captain gets double points if captain doesn't play
  },
};

// Validate configuration
if (config.llm.enabled && !config.llm.apiKey) {
  console.warn("[Config] LLM enabled but API key missing");
}

export default config;
