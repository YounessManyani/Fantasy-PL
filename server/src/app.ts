import express, { Express } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { AppConfig } from "../src/types/config.types";
import { AppContainer } from "./container";
import { createRoutes } from "../src/routes";
import {
  requestLogger,
  errorHandler,
  notFoundHandler,
  createRateLimiter,
  rateLimitConfig,
} from "../src/middleware";
import {
  createSwaggerConfig,
  swaggerUiOptions,
} from "../src/config/swagger.config";
import { openApiSchemas } from "../src/docs/swagger/schemas";
import { createLogger } from "../src/utils/logger.utils";

const logger = createLogger("App");

export function createApp(config: AppConfig): Express {
  const app = express();

  // ==================== MIDDLEWARE ====================

  // CORS
  app.use(cors(config.cors));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(requestLogger);

  // Rate limiting (optionnel)
  if (process.env.ENABLE_RATE_LIMIT === "1") {
    app.use(createRateLimiter(rateLimitConfig()));
  }

  // ==================== SWAGGER DOCUMENTATION ====================

  logger.info("Initializing Swagger documentation...");

  // Générer spec OpenAPI
  const swaggerSpec = swaggerJsdoc(createSwaggerConfig(config));

  // Injecter les schémas
  if (swaggerSpec.components) {
    swaggerSpec.components.schemas = {
      ...swaggerSpec.components.schemas,
      ...openApiSchemas,
    };
  }

  // Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
  );

  // Raw OpenAPI spec (JSON)
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  logger.info("Swagger documentation available at /api-docs");

  // ==================== DEPENDENCY INJECTION ====================

  logger.info("Creating dependency injection container...");
  const container = new AppContainer(config);
  logger.info("Application container initialized successfully ✓");

  // ==================== ROUTES ====================

  const router = createRoutes(container);
  app.use(router);

  // ==================== ERROR HANDLING ====================

  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info("Express app configured ✓");

  return app;
}
