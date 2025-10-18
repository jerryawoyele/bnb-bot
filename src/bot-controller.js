import { ethers } from 'ethers';
import { WalletTracker } from './tracker.js';
import { SmartWalletDetector } from './smart-wallet-detector.js';
import { logger } from './logger.js';
import { config } from './config.js';

/**
 * Bot Controller
 * Manages bot lifecycle: start, stop, smart wallet detection
 */
export class BotController {
  constructor(database, api) {
    this.database = database;
    this.api = api;
    this.provider = null;
    this.wallet = null;
    this.tracker = null;
    this.smartDetector = null;
    this.isRunning = false;
    this.isPaused = false;
    this.watchedWallet = null;
    
    // Trigger wallet for smart detection
    this.triggerWallet = '0xe2d60cfe3cf8b2079c7df0144c5b28c03469775c';
  }

  async initialize() {
    try {
      // Connect to WebSocket provider
      logger.info('🌐 Connecting to BSC WebSocket...');
      this.provider = new ethers.WebSocketProvider(config.wsRpc);
      
      await this.provider.getNetwork();
      logger.info('✅ Connected to BSC network');

      // Initialize wallet
      this.wallet = new ethers.Wallet(config.privateKey, this.provider);
      logger.info(`🔑 Bot wallet: ${this.wallet.address}`);

      // Check balance
      const balance = await this.provider.getBalance(this.wallet.address);
      const balanceBnb = parseFloat(ethers.formatEther(balance));
      logger.info(`💰 Wallet balance: ${balanceBnb.toFixed(4)} BNB`);

      if (balanceBnb < 0.01) {
        logger.warn('⚠️  Warning: Low wallet balance!');
      }

      return true;
    } catch (error) {
      logger.error('Failed to initialize bot:', error);
      return false;
    }
  }

  async startWithSmartDetection() {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return { success: false, message: 'Bot is already running' };
    }

    try {
      logger.info('🚀 Starting bot with smart wallet detection...');

      // Initialize if not already done
      if (!this.provider || !this.wallet) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { success: false, message: 'Failed to initialize bot' };
        }
      }

      // Start smart wallet detector
      this.smartDetector = new SmartWalletDetector(this.provider, this.triggerWallet);
      
      this.smartDetector.start(
        // On wallet detected
        async (detectedWallet) => {
          logger.info(`🎯 Wallet detected: ${detectedWallet}`);
          await this.startTracking(detectedWallet);
        },
        // On no match
        async () => {
          logger.error('No matching wallet found - stopping bot');
          await this.stop();
        },
        // On multiple matches
        async () => {
          logger.error('Multiple matches found - stopping bot');
          await this.stop();
        }
      );

      this.isRunning = true;
      
      // Notify via API
      if (this.api) {
        this.api.io.emit('botStatus', {
          running: true,
          mode: 'detecting',
          message: 'Waiting for wallet detection...'
        });
      }

      return { 
        success: true, 
        message: 'Smart wallet detection started',
        triggerWallet: this.triggerWallet
      };

    } catch (error) {
      logger.error('Failed to start bot:', error);
      return { success: false, message: error.message };
    }
  }

  async startWithWallet(walletAddress) {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return { success: false, message: 'Bot is already running' };
    }

    try {
      logger.info(`🚀 Starting bot with specified wallet: ${walletAddress}`);

      // Initialize if not already done
      if (!this.provider || !this.wallet) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { success: false, message: 'Failed to initialize bot' };
        }
      }

      await this.startTracking(walletAddress);

      return { 
        success: true, 
        message: 'Bot started successfully',
        watchedWallet: walletAddress
      };

    } catch (error) {
      logger.error('Failed to start bot:', error);
      return { success: false, message: error.message };
    }
  }

  async startTracking(walletAddress) {
    try {
      this.watchedWallet = walletAddress.toLowerCase();

      // Create MongoDB session
      if (this.database) {
        await this.database.createSession(
          this.watchedWallet,
          this.wallet.address,
          config
        );
      }

      // Initialize wallet tracker
      this.tracker = new WalletTracker(this.provider, this.wallet, this.database);
      this.tracker.watchedWallet = this.watchedWallet;

      // Connect bot events to API
      if (this.api) {
        this.tracker.on('trade', (trade) => this.api.emitTrade(trade));
        this.tracker.on('transaction', (tx) => this.api.emitTransaction(tx));
        this.tracker.on('takeProfit', (data) => this.api.emitTakeProfit(data));
      }

      // Start the tracker
      await this.tracker.start();

      this.isRunning = true;

      logger.info('✅ Bot started and tracking wallet');
      
      // Notify via API
      if (this.api) {
        this.api.io.emit('botStatus', {
          running: true,
          mode: 'tracking',
          watchedWallet: this.watchedWallet,
          botWallet: this.wallet.address
        });
      }

    } catch (error) {
      logger.error('Failed to start tracking:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      logger.warn('Bot is not running');
      return { success: false, message: 'Bot is not running' };
    }

    try {
      logger.info('🛑 Stopping bot...');

      // Stop smart detector if running
      if (this.smartDetector) {
        this.smartDetector.stop();
        this.smartDetector = null;
      }

      // Stop tracker if running
      if (this.tracker) {
        await this.tracker.stop();
        this.tracker = null;
      }

      // End MongoDB session
      if (this.database) {
        await this.database.endSession();
      }

      this.isRunning = false;
      this.watchedWallet = null;

      logger.info('✅ Bot stopped successfully');

      // Notify via API
      if (this.api) {
        this.api.io.emit('botStatus', {
          running: false,
          mode: 'stopped',
          message: 'Bot stopped'
        });
      }

      return { success: true, message: 'Bot stopped successfully' };

    } catch (error) {
      logger.error('Failed to stop bot:', error);
      return { success: false, message: error.message };
    }
  }

  async pause() {
    if (!this.isRunning) {
      return { success: false, message: 'Bot is not running' };
    }

    if (this.isPaused) {
      return { success: false, message: 'Bot is already paused' };
    }

    try {
      logger.info('⏸️  Pausing bot...');

      // Pause tracker
      if (this.tracker) {
        await this.tracker.pause();
      }

      this.isPaused = true;
      logger.info('✅ Bot paused successfully');

      // Notify via API
      if (this.api) {
        this.api.io.emit('botStatus', {
          running: this.isRunning,
          paused: this.isPaused,
          mode: 'paused',
          watchedWallet: this.watchedWallet,
          botWallet: this.wallet.address
        });
      }

      return { success: true, message: 'Bot paused successfully' };
    } catch (error) {
      logger.error('Failed to pause bot:', error);
      return { success: false, message: error.message };
    }
  }

  async resume() {
    if (!this.isRunning) {
      return { success: false, message: 'Bot is not running' };
    }

    if (!this.isPaused) {
      return { success: false, message: 'Bot is not paused' };
    }

    try {
      logger.info('▶️  Resuming bot...');

      // Resume tracker
      if (this.tracker) {
        await this.tracker.resume();
      }

      this.isPaused = false;
      logger.info('✅ Bot resumed successfully');

      // Notify via API
      if (this.api) {
        this.api.io.emit('botStatus', {
          running: this.isRunning,
          paused: this.isPaused,
          mode: 'tracking',
          watchedWallet: this.watchedWallet,
          botWallet: this.wallet.address
        });
      }

      return { success: true, message: 'Bot resumed successfully' };
    } catch (error) {
      logger.error('Failed to resume bot:', error);
      return { success: false, message: error.message };
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      watchedWallet: this.watchedWallet,
      botWallet: this.wallet?.address || null,
      mode: this.isPaused ? 'paused' : (this.smartDetector ? 'detecting' : (this.tracker ? 'tracking' : 'stopped')),
      triggerWallet: this.triggerWallet
    };
  }

  async cleanup() {
    await this.stop();
    
    if (this.provider) {
      await this.provider.destroy();
      this.provider = null;
    }

    if (this.database) {
      await this.database.close();
    }
  }
}
