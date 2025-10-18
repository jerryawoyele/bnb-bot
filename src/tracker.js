import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { config } from './config.js';
import { logger } from './logger.js';
import { TransactionDecoder } from './decoder.js';
import { TradeFilter } from './filters.js';
import { TradeExecutor } from './executor.js';
import { ProfitTracker } from './profit-tracker.js';
import { NotificationService } from './notifications.js';

export class WalletTracker extends EventEmitter {
  constructor(provider, wallet, database = null) {
    super();
    this.provider = provider;
    this.wallet = wallet;
    this.database = database;
    this.watchedWallet = config.startWatched ? config.startWatched.toLowerCase() : null;
    this.decoder = new TransactionDecoder();
    this.filter = new TradeFilter(provider, database);
    this.executor = new TradeExecutor(wallet, provider);
    this.profitTracker = new ProfitTracker(provider, wallet);
    this.notificationService = new NotificationService();
    
    // State
    this.isPaused = false;
    
    // Track tokens we've already bought (for one-time buy per token)
    this.boughtTokens = new Set();
    
    // Stats
    this.stats = {
      totalTransactions: 0,
      tradesDetected: 0,
      tradesExecuted: 0,
      tradesFailed: 0,
      tradesFiltered: 0,
      walletSwitches: 0,
      takeProfitExecuted: 0,
      skippedDuplicateBuys: 0,
    };
  }

  /**
   * Start monitoring the blockchain for transactions
   */
  async start() {
    if (!this.watchedWallet) {
      logger.error('Cannot start tracker: No watched wallet configured');
      logger.info('Please set START_WATCHED in .env or use controller mode');
      throw new Error('No watched wallet configured');
    }
    
    logger.info('🚀 Starting BNB Copy-Trading Bot');
    logger.info(`👀 Watching wallet: ${this.watchedWallet}`);
    logger.info(`🤖 Bot wallet: ${this.wallet.address}`);
    const balance = await this.executor.getBnbBalance();
    logger.info(`💰 Bot balance: ${balance.toFixed(4)} BNB`);
    
    await this.printConfig();

    // Send startup notification - use MongoDB config
    const activeConfig = await this.filter.getConfig();
    const mode = activeConfig.copyBuyOnly ? 'BUY ONLY' : 'BUY & SELL';
    await this.notificationService.notifyBotStartup(
      this.wallet.address,
      this.watchedWallet,
      balance,
      mode
    );

    // Listen for new blocks
    this.provider.on('block', async (blockNumber) => {
      await this.onNewBlock(blockNumber);
    });

    // Start take-profit monitoring (check every 30 seconds)
    if (config.autoTakeProfitEnabled) {
      setInterval(async () => {
        await this.checkTakeProfitOpportunities();
      }, 30000);
      logger.info(`🎯 Take-profit monitoring enabled (${config.takeProfitPercent}%)`);
    }

    logger.info('✅ Bot is running and monitoring blocks...\n');
  }

  /**
   * Check all positions for take-profit opportunities
   */
  async checkTakeProfitOpportunities() {
    try {
      const opportunities = await this.profitTracker.checkAllPositions(this.notificationService);
      
      for (const opportunity of opportunities) {
        const result = await this.profitTracker.executeTakeProfit(
          opportunity,
          this.executor,
          this.notificationService
        );
        
        if (result.success) {
          this.stats.takeProfitExecuted++;
        }
      }
    } catch (error) {
      logger.error('Error checking take profit:', error);
    }
  }

  /**
   * Handle new block (optimized to reduce RPC calls)
   */
  async onNewBlock(blockNumber) {
    try {
      logger.debug(`New block: ${blockNumber}`);
      
      // Get block with prefetched transaction objects (not just hashes)
      const block = await this.provider.getBlock(blockNumber, true);
      
      if (!block || !block.prefetchedTransactions) {
        return;
      }

      // Filter transactions from watched wallet BEFORE processing
      // This dramatically reduces RPC calls
      const relevantTxs = block.prefetchedTransactions.filter(
        tx => tx && tx.from && tx.from.toLowerCase() === this.watchedWallet
      );

      // Only process transactions from watched wallet
      for (const tx of relevantTxs) {
        await this.processTransaction(tx);
      }
    } catch (error) {
      logger.error('Error processing block:', error);
    }
  }

  /**
   * Process a single transaction (now receives tx object directly)
   */
  async processTransaction(tx) {
    try {
      if (!tx || !tx.hash) {
        return;
      }

      // Skip processing if paused
      if (this.isPaused) {
        logger.debug('Bot is paused, skipping transaction processing');
        return;
      }

      this.stats.totalTransactions++;

      // Analyze transaction
      const analysis = this.decoder.analyzeTransaction(tx);
      
      // FILTER OUT UNWANTED TRANSACTIONS EARLY
      // Only care about: SWAPS (buys/sells) and BNB_TRANSFER (for wallet switching)
      // Skip: token transfers, approvals, creates, etc.
      if (analysis.type === 'TOKEN_TRANSFER' || 
          analysis.type === 'UNKNOWN' || 
          analysis.type === 'ERROR' ||
          analysis.type === 'APPROVE') {
        logger.debug(`⏭️  Skipping ${analysis.type} transaction`);
        return;
      }

      // Log relevant transactions only
      logger.info(`\n📡 Detected ${analysis.type} from watched wallet: ${tx.hash}`);
      logger.debug('Transaction analysis:', analysis);

      // Send watch alert for important transactions
      if (analysis.type === 'SWAP' || analysis.type === 'BNB_TRANSFER') {
        const value = analysis.valueInBnb || 0;
        await this.notificationService.notifyWatchAlert(
          tx.hash,
          tx.from,
          tx.to,
          value,
          analysis.type,
          analysis
        );
      }

      // Handle transaction types
      if (this.decoder.isSwapTransaction(analysis)) {
        await this.handleSwapTransaction(analysis, tx);
      } else if (analysis.type === 'BNB_TRANSFER') {
        // Only handle BNB transfers for wallet switching
        await this.handleBnbTransfer(analysis, tx);
      }
    } catch (error) {
      logger.error('Error processing transaction:', error);
    }
  }

  /**
   * Handle swap transaction (potential copy trade)
   */
  async handleSwapTransaction(analysis, tx) {
    try {
      this.stats.tradesDetected++;
      
      logger.info(`💱 Swap detected: ${analysis.swapType}`);
      logger.info(`   Router: ${analysis.router}`);
      logger.info(`   Token In: ${analysis.tokenIn}`);
      logger.info(`   Token Out: ${analysis.tokenOut}`);
      
      if (analysis.swapType === 'BUY') {
        logger.info(`   Amount: ${analysis.amountInBnb} BNB`);
      }

      // Get active config
      const activeConfig = await this.filter.getConfig();

      // BUY ONLY MODE: Skip sell trades
      if (activeConfig.copyBuyOnly && analysis.swapType === 'SELL') {
        logger.info('⏭️  Skipping SELL trade (BUY ONLY mode enabled)');
        return;
      }

      // If sell copying is disabled, skip
      if (!activeConfig.copySell && analysis.swapType === 'SELL') {
        logger.info('⏭️  Skipping SELL trade (COPY_SELL disabled)');
        return;
      }

      // ONE-TIME BUY PER TOKEN: Check BEFORE filters for maximum speed
      // Skip if we've already bought this token (first buy only rule)
      if (analysis.swapType === 'BUY') {
        const tokenAddress = (analysis.tokenOut || '').toLowerCase();
        
        if (this.boughtTokens.has(tokenAddress)) {
          logger.info(`⏭️  Already bought ${tokenAddress} once, skipping duplicate buy`);
          logger.info('   ℹ️  Bot only buys each token on FIRST watched wallet purchase');
          this.stats.skippedDuplicateBuys++;
          return;
        }
        
        // Mark token as being bought (before execution to prevent race conditions)
        this.boughtTokens.add(tokenAddress);
        logger.info(`✅ First time buying ${tokenAddress} - proceeding with copy trade!`);
      }

      // Apply filters
      logger.info('🔍 Applying filters...');
      const filterResults = await this.filter.applyFilters(analysis);

      if (!filterResults.passed) {
        this.stats.tradesFiltered++;
        logger.warn('❌ Trade filtered out:');
        
        // Log which filter failed
        let failedReason = '';
        for (const [filterName, result] of Object.entries(filterResults.filters)) {
          if (!result.passed) {
            logger.warn(`   ⚠️  ${filterName}: ${result.reason}`);
            failedReason = result.reason;
          }
        }
        
        // Send filtered notification
        await this.notificationService.notifyTradeFiltered(
          analysis.tokenOut || analysis.tokenIn,
          failedReason
        );
        return;
      }

      // Calculate adjusted amount if needed
      let adjustedAmount = null;
      if (analysis.swapType === 'BUY') {
        adjustedAmount = await this.filter.calculateAdjustedAmount(analysis.amountInBnb);
        if (adjustedAmount !== analysis.amountInBnb) {
          logger.info(`📊 Adjusted buy amount: ${analysis.amountInBnb} -> ${adjustedAmount} BNB`);
        }
      }

      // Execute the copy trade
      logger.info('🎯 Executing copy trade...');
      const result = await this.executor.executeTrade(analysis, adjustedAmount);

      if (result.success) {
        this.stats.tradesExecuted++;
        logger.info('✅ Copy trade executed successfully!');
        
        // Record buy for profit tracking
        if (analysis.swapType === 'BUY' && result.tokenAddress) {
          this.profitTracker.recordBuy(
            result.tokenAddress,
            result.amountBnb,
            result.amountOutMin,
            result.txHash
          );
        }
        
        // Emit trade event for API
        this.emit('trade', {
          type: analysis.swapType,
          token: result.tokenAddress || analysis.tokenOut || analysis.tokenIn,
          amount: result.amountBnb || adjustedAmount,
          txHash: result.txHash,
          timestamp: Date.now(),
          success: true
        });
        
        // Send success notification
        await this.notificationService.notifyTradeSuccess(
          analysis.swapType,
          result.tokenAddress || analysis.tokenOut || analysis.tokenIn,
          `${result.amountBnb || adjustedAmount} BNB`,
          result.txHash,
          config.autoTakeProfitEnabled ? config.takeProfitPercent : null
        );
      } else {
        this.stats.tradesFailed++;
        logger.error(`❌ Copy trade failed: ${result.reason || result.error}`);
        
        // Emit failed trade event
        this.emit('trade', {
          type: analysis.swapType,
          token: analysis.tokenOut || analysis.tokenIn,
          amount: adjustedAmount || analysis.amountInBnb,
          timestamp: Date.now(),
          success: false,
          error: result.reason || result.error
        });
        
        // Send failure notification
        await this.notificationService.notifyTradeFailed(
          analysis.swapType,
          analysis.tokenOut || analysis.tokenIn,
          result.reason || result.error
        );
      }
    } catch (error) {
      this.stats.tradesFailed++;
      logger.error('Error handling swap transaction:', error);
    }
  }

  /**
   * Handle BNB transfer (for wallet switching only)
   * ONLY BNB transfers trigger wallet switching, not token transfers
   */
  async handleBnbTransfer(analysis, tx) {
    try {
      // Get active config
      const activeConfig = await this.filter.getConfig();
      
      if (!activeConfig.autoFollowEnabled) {
        logger.debug('Auto-follow disabled, ignoring BNB transfer');
        return;
      }

      // Must be BNB_TRANSFER type
      if (analysis.type !== 'BNB_TRANSFER') {
        return;
      }

      const transferAmountBnb = analysis.valueInBnb;
      const newWallet = analysis.to;
      
      logger.info(`💸 BNB transfer detected: ${transferAmountBnb} BNB to ${newWallet}`);
      
      // Check if transfer meets minimum threshold
      if (transferAmountBnb >= activeConfig.minTransferAmountBnb && newWallet) {
        logger.info(`✅ Transfer amount ${transferAmountBnb} BNB meets threshold ${activeConfig.minTransferAmountBnb} BNB`);
        await this.switchWatchedWallet(
          newWallet.toLowerCase(),
          `BNB transfer of ${transferAmountBnb} BNB detected`
        );
        
        // Clear bought tokens list when switching wallets
        this.boughtTokens.clear();
        logger.info('🔄 Cleared bought tokens list for new wallet');
      } else {
        logger.debug(`Transfer amount ${transferAmountBnb} BNB below threshold ${activeConfig.minTransferAmountBnb} BNB - not switching`);
      }
    } catch (error) {
      logger.error('Error handling BNB transfer:', error);
    }
  }

  /**
   * Switch to a new watched wallet
   */
  async switchWatchedWallet(newWallet, reason) {
    const oldWallet = this.watchedWallet;
    
    // Prevent switching to bot's own wallet
    if (newWallet.toLowerCase() === this.wallet.address.toLowerCase()) {
      logger.warn('⚠️  Cannot switch to bot\'s own wallet');
      return;
    }

    // Prevent switching to the same wallet
    if (newWallet.toLowerCase() === oldWallet) {
      logger.debug('New wallet is the same as current wallet');
      return;
    }

    this.watchedWallet = newWallet.toLowerCase();
    this.stats.walletSwitches++;
    
    logger.info(`\n🔄 WALLET SWITCH`);
    logger.info(`   Old Wallet: ${oldWallet}`);
    logger.info(`   New Wallet: ${newWallet}`);
    logger.info(`   Reason: ${reason}`);
    logger.info(`   Bot will now copy trades from new wallet\n`);
    
    // Emit wallet switch event for API/WebSocket
    this.emit('walletSwitch', {
      oldWallet,
      newWallet: this.watchedWallet,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Print current configuration
   */
  async printConfig() {
    // Get config from MongoDB (via filter which has caching)
    const activeConfig = await this.filter.getConfig();
    
    logger.info('\n⚙️  Configuration:');
    logger.info(`   Mode: ${activeConfig.copyBuyOnly ? '🟢 BUY ONLY' : '🔵 BUY & SELL'}`);
    logger.info(`   Max Buy Amount: ${activeConfig.maxBuyAmountBnb} BNB`);
    logger.info(`   Slippage: ${activeConfig.slippagePercent}%`);
    logger.info(`   Max Gas Price: ${activeConfig.maxGasPriceGwei} Gwei`);
    logger.info(`   Min Liquidity: $${activeConfig.minLiquidityUsd.toLocaleString()}`);
    logger.info(`   Max Token Age: ${activeConfig.maxTokenAgeHours} hours`);
    logger.info(`   One-Time Buy: ${activeConfig.oneTimeBuyPerToken ? 'Enabled' : 'Disabled'}`);
    logger.info(`   Auto-Follow: ${activeConfig.autoFollowEnabled ? 'Enabled' : 'Disabled'}`);
    logger.info(`   Fast Mode: ${activeConfig.fastMode ? `Enabled (${activeConfig.gasMultiplier}x gas)` : 'Disabled'}`);
    
    if (activeConfig.autoTakeProfitEnabled) {
      logger.info(`   Take Profit: ${activeConfig.takeProfitPercent}%`);
    }
    
    if (activeConfig.enableTelegramAlerts) {
      logger.info(`   Telegram Alerts: Enabled`);
    }
    
    if (activeConfig.allowedRouters && activeConfig.allowedRouters.length > 0) {
      logger.info(`   Allowed Routers: ${activeConfig.allowedRouters.length} router(s)`);
    }
    
    if (activeConfig.blacklistedTokens && activeConfig.blacklistedTokens.length > 0) {
      logger.info(`   Blacklisted Tokens: ${activeConfig.blacklistedTokens.length} token(s)`);
    }
    logger.info('');
  }

  /**
   * Print bot statistics
   */
  printStats() {
    logger.info('\n📊 Bot Statistics:');
    logger.info(`   Total Transactions Seen: ${this.stats.totalTransactions}`);
    logger.info(`   Trades Detected: ${this.stats.tradesDetected}`);
    logger.info(`   Trades Executed: ${this.stats.tradesExecuted}`);
    logger.info(`   Trades Failed: ${this.stats.tradesFailed}`);
    logger.info(`   Trades Filtered: ${this.stats.tradesFiltered}`);
    logger.info(`   Duplicate Buys Skipped: ${this.stats.skippedDuplicateBuys}`);
    logger.info(`   Take Profits Executed: ${this.stats.takeProfitExecuted}`);
    logger.info(`   Wallet Switches: ${this.stats.walletSwitches}`);
    logger.info(`   Open Positions: ${this.profitTracker.getPositionCount()}`);
    logger.info(`   Unique Tokens Bought: ${this.boughtTokens.size}`);
    logger.info(`   Currently Watching: ${this.watchedWallet}\n`);
  }

  /**
   * Stop the bot
   */
  stop() {
    logger.info('🛑 Stopping bot...');
    this.provider.removeAllListeners();
    this.printStats();
    logger.info('Bot stopped');
  }

  /**
   * Pause monitoring (keep listeners but don't process transactions)
   */
  pause() {
    logger.info('⏸️  Pausing bot monitoring...');
    this.isPaused = true;
    logger.info('Bot paused - Will not process new transactions');
  }

  /**
   * Resume monitoring
   */
  resume() {
    logger.info('▶️  Resuming bot monitoring...');
    this.isPaused = false;
    logger.info('Bot resumed - Processing transactions');
  }
}
