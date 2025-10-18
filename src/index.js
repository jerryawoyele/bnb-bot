import { ethers } from 'ethers';
import { config, validateConfig } from './config.js';
import { logger } from './logger.js';
import { WalletTracker } from './tracker.js';
import { BotAPI } from '../server/api.js';
import { BotDatabase } from './json-database.js';

async function main() {
  try {
    // ASCII Art Banner
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🚀 BNB CHAIN COPY-TRADING BOT 🚀                      ║
║                                                               ║
║        Smart automated trading on Binance Smart Chain        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    // Initialize database
    logger.info('💾 Initializing database...');
    const database = new BotDatabase();
    logger.setDatabase(database);
    logger.info('✅ Database ready');

    // Validate configuration
    logger.info('🔧 Validating configuration...');
    validateConfig();
    logger.info('✅ Configuration valid');
    
    // Check if START_WATCHED is set
    if (!config.startWatched) {
      logger.error('⚠️  START_WATCHED is not configured');
      logger.info('');
      logger.info('This is the OLD auto-start mode.');
      logger.info('For better control, use the NEW controller mode:');
      logger.info('  npm start  (runs main-controller.js)');
      logger.info('');
      logger.info('Or set START_WATCHED in your .env file to use this mode.');
      process.exit(1);
    }

    // Connect to WebSocket provider
    logger.info('🌐 Connecting to BSC WebSocket...');
    logger.info(`   Endpoint: ${config.wsRpc}`);
    
    const provider = new ethers.WebSocketProvider(config.wsRpc);
    
    // Add error handler to prevent crashes
    provider.websocket.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
    
    // Wait for connection with timeout
    try {
      await Promise.race([
        provider.ready,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
        )
      ]);
      logger.info('✅ Connected to BSC network');
    } catch (error) {
      logger.error('❌ Failed to connect to BSC WebSocket');
      logger.error(`   Error: ${error.message}`);
      logger.error('\n💡 Troubleshooting:');
      logger.error('   1. Check your internet connection');
      logger.error('   2. Verify your WS_RPC URL in .env file');
      logger.error('   3. Make sure the RPC endpoint includes your API key');
      logger.error('\n🔧 Alternative RPC Endpoints:');
      logger.error('   • NodeReal: wss://bsc-mainnet.nodereal.io/ws/v1/YOUR_API_KEY');
      logger.error('   • Binance: wss://bsc-ws-node.nariox.org:443');
      logger.error('   • Public: wss://bsc.publicnode.com');
      logger.error('   • Ankr: wss://rpc.ankr.com/bsc/YOUR_API_KEY');
      logger.error('\n📖 Get free API keys at:');
      logger.error('   • https://nodereal.io/ (Recommended)');
      logger.error('   • https://www.ankr.com/');
      throw new Error('WebSocket connection failed');
    }

    // Get network info
    const network = await provider.getNetwork();
    logger.info(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

    // Verify we're on BSC Mainnet (Chain ID: 56)
    if (network.chainId !== 56n) {
      logger.warn(`⚠️  Warning: Not on BSC Mainnet! Current chain ID: ${network.chainId}`);
      logger.warn('   Make sure you are using the correct network.');
    }

    // Initialize bot wallet
    logger.info('🔑 Initializing bot wallet...');
    const wallet = new ethers.Wallet(config.privateKey, provider);
    logger.info(`✅ Bot wallet address: ${wallet.address}`);

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    const balanceBnb = parseFloat(ethers.formatEther(balance));
    logger.info(`💰 Wallet balance: ${balanceBnb.toFixed(4)} BNB`);

    if (balanceBnb < 0.01) {
      logger.warn('⚠️  Warning: Low wallet balance! You may not be able to execute trades.');
    }

    // Initialize wallet tracker
    const tracker = new WalletTracker(provider, wallet);

    // Initialize API server with database
    const api = new BotAPI(tracker, config, database);
    const apiPort = process.env.API_PORT || 3001;
    await api.start(apiPort);

    // Connect logger to API for real-time log broadcasting
    logger.setAPIBroadcast((level, message, data) => {
      api.emitLog(level, message, data);
    });

    // Start the bot
    await tracker.start();

    // Connect bot events to API
    tracker.on('trade', (trade) => api.emitTrade(trade));
    tracker.on('transaction', (tx) => api.emitTransaction(tx));
    tracker.on('takeProfit', (data) => api.emitTakeProfit(data));

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('\n\n🛑 Shutdown signal received');
      api.stop();
      tracker.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('\n\n🛑 Shutdown signal received');
      api.stop();
      tracker.stop();
      process.exit(0);
    });

    // Print stats periodically (every 5 minutes)
    setInterval(() => {
      tracker.printStats();
    }, 5 * 60 * 1000);

  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the bot
main();
