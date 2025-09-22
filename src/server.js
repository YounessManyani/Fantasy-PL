// src/server.js
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Core modules
import config from "./config/index.js";
import { loadPlayers } from "./core/dataLoader.js";
import { PlayerStore } from "./core/playerStore.js";

// Services
import { NameResolver } from "./services/nameResolver.js";
import { TeamParser } from "./services/teamParser.js";
import { Recommender } from "./services/recommender.js";

// API modules
import { createRoutes } from "./api/routes.js";
import { createSwaggerSpec } from "./api/swagger.js";
import {
  errorHandler,
  requestLogger,
  corsConfig,
  noCache
} from "./api/middleware.js";

// Initialize application
async function createApp() {
  try {
    const app = express();
    
    // Load player data with error handling
    console.log("[Server] Loading player data...");
    console.log("[Server] CSV Path:", config.data.csvPath);
    
    let players;
    try {
      players = loadPlayers(config.data.csvPath);
      console.log(`[Server] Successfully loaded ${players.length} players`);
    } catch (error) {
      console.error("[Server] Failed to load player data:", error.message);
      console.error("[Server] Make sure your CSV file exists at:", config.data.csvPath);
      throw error;
    }
    
    // Create services
    const store = new PlayerStore(players);
    const resolver = new NameResolver(store, config.llm);
    const parser = new TeamParser(resolver, store);
    const recommender = new Recommender(store);
    
    // Middleware
    app.use(cors(corsConfig()));
    app.use(express.json({ limit: "1mb" }));
    app.use(requestLogger);
    app.use(noCache);
    
    // API Documentation
    try {
      const swaggerSpec = createSwaggerSpec(config);
      app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
      app.get("/openapi.json", (req, res) => {
        res.type("application/json").send(swaggerSpec);
      });
    } catch (error) {
      console.warn("[Server] Failed to setup Swagger docs:", error.message);
    }
    
    // API Routes
    const routes = createRoutes(parser, recommender, config);
    app.use("/", routes);
    
    // Error handling (must be last)
    app.use(errorHandler);
    
    return app;
  } catch (error) {
    console.error("[Server] Failed to create app:", error);
    throw error;
  }
}

// Start server
async function start() {
  try {
    console.log("[Server] Starting FPL API Server...");
    const app = await createApp();
    
    const server = app.listen(config.app.port, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║           FPL API Server                      ║
║                                                ║
╟────────────────────────────────────────────────╢
║  Status:     ✅ Running                        ║
║  Port:       ${config.app.port}                              ║
║  Docs:       http://localhost:${config.app.port}/docs       ║
║  Health:     http://localhost:${config.app.port}/health     ║
║  LLM:        ${config.llm.enabled ? '✅ Enabled' : '❌ Disabled'}                      ║
║                                                ║
╚════════════════════════════════════════════════╝

To test the API, try these commands in a new terminal:

Using curl:
  curl http://localhost:${config.app.port}/health

Using PowerShell:
  Invoke-WebRequest -Uri "http://localhost:${config.app.port}/health" | Select-Object -ExpandProperty Content

Or visit in browser:
  http://localhost:${config.app.port}/docs
      `);
    });
    
    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("[Server] SIGTERM received, shutting down gracefully...");
      server.close(() => {
        console.log("[Server] Server closed");
        process.exit(0);
      });
    });
    
    process.on("SIGINT", () => {
      console.log("[Server] SIGINT received, shutting down gracefully...");
      server.close(() => {
        console.log("[Server] Server closed");
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error("[Server] Failed to start:", error.message);
    console.error("[Server] Full error:", error);
    process.exit(1);
  }
}

// Run if this is the main module
start().catch(error => {
  console.error("[Server] Unhandled error:", error);
  process.exit(1);
});

export { createApp };