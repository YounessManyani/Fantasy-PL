// src/config/config.ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppConfig } from '../types/config.types';
import { loadLLMConfig } from './llm.config';
import { PL_CLUBS } from '../models/constants/clubs.constants';
import { FPL_RULES } from '../models/constants/fpl-rules.constants';

// ESM-safe __filename / __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root (where you run `node`/`tsx` from)
const projectRoot = process.cwd();

// Helper to resolve from project root (safer across TS/JS builds)
const fromRoot = (...parts: string[]) => path.resolve(projectRoot, ...parts);

export function createAppConfig(): AppConfig {
  return {
    app: {
      port: Number(process.env.PORT) || 8000,
      title: process.env.APP_TITLE || 'FPL API',
      version: process.env.APP_VERSION || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
    },

    data: {
      // Prefer env, otherwise resolve from project root. Never hardcode backslashes.
      csvPath:
        process.env.CSV_PATH ??
        fromRoot('src', 'models', 'data', 'fpl_player_statistics.csv'),

      fdrPath:
        process.env.FDR_PATH ??
        fromRoot('src', 'models', 'data', 'fdr_2025_26.json'),

      plClubs: PL_CLUBS as any,
    },

    llm: loadLLMConfig(),

    rules: FPL_RULES,

    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
  };
}

/** Validate configuration */
export function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  if (config.app.port < 1 || config.app.port > 65535) {
    errors.push(`Invalid port: ${config.app.port}. Must be between 1 and 65535.`);
  }

  if (!config.data.csvPath) errors.push('CSV_PATH is required');
  if (!config.data.fdrPath) errors.push('FDR_PATH is required');

  if (config.llm.enabled && !config.llm.apiKey) {
    console.warn('[Config] Warning: LLM enabled but OPENAI_API_KEY is missing');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/** Export *the* function your server expects */
export function loadConfig(): AppConfig {
  const cfg = createAppConfig();
  validateConfig(cfg);
  return cfg;
}

// If you prefer default export instead, also do:
// export default { loadConfig, createAppConfig, validateConfig };
