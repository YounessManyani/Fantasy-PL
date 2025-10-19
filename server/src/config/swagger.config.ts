import { Options } from 'swagger-jsdoc';
import { AppConfig } from '../types/config.types';

export function createSwaggerConfig(config: AppConfig): Options {
  return {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'FPL API - Fantasy Premier League Assistant',
        version: config.app.version,
        description: `
# 🎯 FPL API Documentation

API intelligente pour l'analyse d'équipes Fantasy Premier League avec support LLM.

## ✨ Fonctionnalités Principales

- 🧠 **Parsing Intelligent** : Résolution multi-stratégie avec support LLM
- 🔄 **Recommandations de Transferts** : Algorithmes optimisés pour trouver les meilleurs swaps
- 📊 **Analyse de Fixtures** : FDR et multiplicateurs de difficulté
- ⚽ **Base de Données** : 741 joueurs avec statistiques complètes

## 🚀 Quick Start

\`\`\`bash
# Health check
GET /health

# Parse une équipe
POST /api/v1/teams/parse
{
  "teamText": "Salah, Haaland, Son",
  "useLLM": true
}

# Recommandations de transferts
POST /api/v1/transfers/recommend
{
  "teamText": "...",
  "bank": 2.5,
  "maxTransfers": 1,
  "gameweek": 10
}
\`\`\`

## 🔑 Modes de Résolution

1. **Cache Lookup** - O(1)
2. **Alias Resolution** - Surnoms communs
3. **Exact Match** - Nom complet
4. **Surname Match** - Nom de famille unique
5. **Fuzzy Matching** - Tolérance typos (Levenshtein)
6. **LLM Resolution** - IA pour ambiguïtés (GPT-4o-mini)

## 📈 Performance

- 🚄 Temps de réponse moyen : < 100ms
- 💾 In-memory indexing : O(1) lookups
- 🧠 LLM latency : ~500ms
- 🔄 Cache hit rate : 60-80%

## 🎓 Resources

- [GitHub Repository](https://github.com/your-repo/fpl-api)
- [Postman Collection](https://postman.com/collections/xxx)
- [Webhook Guide](https://docs.example.com/webhooks)
        `,
        contact: {
          name: 'API Support',
          email: 'support@fplapi.com',
          url: 'https://github.com/your-repo/fpl-api/issues',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      externalDocs: {
        description: 'Find out more about FPL rules',
        url: 'https://fantasy.premierleague.com/help/rules',
      },
      servers: [
        {
          url: `http://localhost:${config.app.port}`,
          description: 'Development server',
        },
        {
          url: 'https://api-staging.fplgoat.com',
          description: 'Staging server',
        },
        {
          url: 'https://api.fplgoat.com',
          description: 'Production server',
        },
      ],
      tags: [
        {
          name: 'Health',
          description: 'Health check and system status',
          externalDocs: {
            description: 'Health check best practices',
            url: 'https://docs.example.com/health-checks',
          },
        },
        {
          name: 'Teams',
          description: 'Team parsing and validation operations',
        },
        {
          name: 'Transfers',
          description: 'Transfer recommendations and analysis',
        },
        {
          name: 'Players',
          description: 'Player data, search, and filtering',
        },
        {
          name: 'Fixtures',
          description: 'Fixture difficulty and scheduling',
        },
      ],
      components: {
        schemas: {},
        responses: {
          BadRequest: {
            description: 'Bad request - validation error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    message: { type: 'string' },
                    details: { type: 'object' },
                  },
                },
              },
            },
          },
          NotFound: {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          InternalError: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Internal server error' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT authentication (future feature)',
          },
        },
      },
    },
    apis: [
      './src/controllers/**/*.ts',
      './src/routes/**/*.ts',
      './src/docs/swagger/**/*.yaml',
    ],
  };
}

export const swaggerUiOptions = {
  explorer: true,
  customCss: `
    /* Hide Swagger UI branding */
    .swagger-ui .topbar { 
      display: none; 
    }
    
    /* Custom colors (Premier League theme) */
    .swagger-ui .info .title {
      color: #38003c;
      font-size: 2.5em;
      font-weight: bold;
    }
    
    .swagger-ui .info .description {
      font-size: 1.1em;
      line-height: 1.6;
    }
    
    /* Tags styling */
    .swagger-ui .opblock-tag {
      font-size: 1.5em;
      color: #38003c;
      border-bottom: 3px solid #00ff87;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    
    /* HTTP methods colors */
    .swagger-ui .opblock.opblock-post {
      border-color: #00ff87;
      background: rgba(0, 255, 135, 0.1);
    }
    
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #00ff87;
      color: #38003c;
    }
    
    .swagger-ui .opblock.opblock-get {
      border-color: #38003c;
      background: rgba(56, 0, 60, 0.05);
    }
    
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #38003c;
    }
    
    /* Execute button */
    .swagger-ui .btn.execute {
      background-color: #38003c;
      border-color: #38003c;
      color: white;
    }
    
    .swagger-ui .btn.execute:hover {
      background-color: #00ff87;
      border-color: #00ff87;
      color: #38003c;
    }
    
    /* Response styling */
    .swagger-ui .responses-inner h4,
    .swagger-ui .responses-inner h5 {
      color: #38003c;
    }
    
    /* Schema model */
    .swagger-ui .model-title {
      color: #38003c;
    }
    
    /* Links */
    .swagger-ui a {
      color: #38003c;
    }
    
    .swagger-ui a:hover {
      color: #00ff87;
    }
    
    /* Try it out button */
    .swagger-ui .btn.try-out__btn {
      background-color: #38003c;
      border-color: #38003c;
      color: white;
    }
  `,
  customSiteTitle: 'FPL API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    docExpansion: 'list',
    operationsSorter: 'alpha',
    tagsSorter: 'alpha',
  },
};