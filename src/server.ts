import { createApp } from './app';
import { loadConfig } from './config/app.config';  // ✅ Import nommé de la fonction
import { createLogger } from './utils/logger.utils';
import { Server } from 'http';

const logger = createLogger('Server');

async function start(): Promise<void> {
  try {
    // Load configuration
    const config = loadConfig();  // ✅ Appeler la fonction
    
    // Create Express app
    const app = createApp(config);

    // Start server
    const server: Server = app.listen(config.app.port, () => {
      console.log(`
         FPL API Server
  Status:     ✅ Running                               
  Port:       ${config.app.port}                       
  Version:    ${config.app.version}                    
  Env:        ${config.app.environment}                 
                                                   
  API:        http://localhost:${config.app.port}/api/v1
  Health:     http://localhost:${config.app.port}/health
  LLM:        ${config.llm.enabled ? '✅ Enabled' : '❌ Disabled'}


🚀 Ready to accept requests!
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled rejection', reason);
      process.exit(1);
    });

  } catch (error: any) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

start();