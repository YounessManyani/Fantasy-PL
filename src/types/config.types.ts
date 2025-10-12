import { LLMConfig } from './llm.types';

export interface AppConfig {
  app: {
    port: number;
    title: string;
    version: string;
    environment: string;
  };
  data: {
    csvPath: string;
    fdrPath: string;
    plClubs: string[];
  };
  llm: LLMConfig;
  rules: FPLRules;
  cors: {
    origin: string;
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
}

export interface FPLRules {
  maxPlayersPerClub: number;
  maxTransfers: number;
  squadSize: number;
  squadComposition: {
    goalkeepers: number;
    defenders: number;
    midfielders: number;
    forwards: number;
  };
  startingXI: number;
  budget: number;
  maxTransfersPerWeek: number;
  extraTransferCost: number;
}

/**
 * Environment variable keys
 */
export const ENV_KEYS = {
  // Server
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  APP_TITLE: 'APP_TITLE',
  APP_VERSION: 'APP_VERSION',

  // Data
  CSV_PATH: 'CSV_PATH',
  FDR_PATH: 'FDR_PATH',

  // LLM
  USE_LLM: 'USE_LLM',
  LLM_PROVIDER: 'LLM_PROVIDER',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  LLM_MODEL: 'LLM_MODEL',
  LLM_TIMEOUT: 'LLM_TIMEOUT',
  LLM_MAX_TOKENS: 'LLM_MAX_TOKENS',

  // CORS
  CORS_ORIGIN: 'CORS_ORIGIN',

  // Rate Limiting
  ENABLE_RATE_LIMIT: 'ENABLE_RATE_LIMIT',

  // Database (future)
  DB_HOST: 'DB_HOST',
  DB_PORT: 'DB_PORT',
  DB_NAME: 'DB_NAME',
  DB_USER: 'DB_USER',
  DB_PASSWORD: 'DB_PASSWORD'
} as const;