import { config, validateConfig } from './config.js';
import { logger } from './logger.js';
import { BotController } from './bot-controller.js';
import { MongoDatabase } from './mongodb.js';
import { ControllerAPI } from '../server/controller-api.js';

async function main() {
  try {
    // ASCII Art Banner
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🚀 BNB CHAIN COPY-TRADING BOT 🚀                      ║
║                     CONTROLLER MODE                           ║
║        Smart automated trading on Binance Smart Chain        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    // Validate configuration
    logger.info('🔧 Validating configuration...');
    validateConfig();
    logger.info('✅ Configuration valid');

    // Initialize MongoDB
    logger.info('💾 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bnb-copy-bot';
    const database = new MongoDatabase(mongoUri);
    
    const dbConnected = await database.connect();
    if (!dbConnected) {
      logger.error('Failed to connect to MongoDB. Please ensure MongoDB is running.');
      logger.info('You can install MongoDB from: https://www.mongodb.com/try/download/community');
      process.exit(1);
    }

    // Connect logger to database
    logger.setDatabase(database);

    // Initialize Bot Controller
    logger.info('🤖 Initializing bot controller...');
    const botController = new BotController(database);
    logger.info('✅ Bot controller ready');

    // Initialize API server
    logger.info('🌐 Starting API server...');
    const api = new ControllerAPI(botController, database);
    const apiPort = process.env.API_PORT || 3001;
    await api.start(apiPort);

    // Connect logger to API for real-time broadcasting
    logger.setAPIBroadcast((level, message, data) => {
      api.emitLog(level, message, data);
    });

    logger.info('');
    logger.info('╔═══════════════════════════════════════════════════════════════╗');
    logger.info('║                                                               ║');
    logger.info('║  ✅ BOT READY - Waiting for commands from dashboard           ║');
    logger.info('║                                                               ║');
    logger.info(`║  📱 Dashboard: http://localhost:${process.env.FRONTEND_PORT || 3000}                      ║`);
    logger.info(`║  🔌 API: http://localhost:${apiPort}                          ║`);
    logger.info('║  💾 MongoDB: Connected                                        ║');
    logger.info('║                                                               ║');
    logger.info('║  🎮 Use the dashboard to:                                     ║');
    logger.info('║     • Start bot with smart wallet detection                  ║');
    logger.info('║     • Start bot with specific wallet                         ║');
    logger.info('║     • View previous sessions                                 ║');
    logger.info('║     • Stop bot at any time                                   ║');
    logger.info('║                                                               ║');
    logger.info('╚═══════════════════════════════════════════════════════════════╝');
    logger.info('');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('\n🛑 Shutting down gracefully...');
      
      await botController.cleanup();
      await api.stop();
      await database.close();
      
      logger.info('✅ Shutdown complete');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('\n🛑 Shutting down gracefully...');
      
      await botController.cleanup();
      await api.stop();
      await database.close();
      
      logger.info('✅ Shutdown complete');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
