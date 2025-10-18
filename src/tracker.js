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
  constructor(provider, wallet) {
    super();
    this.provider = provider;
    this.wallet = wallet;
    this.watchedWallet = config.startWatched.toLowerCase();
    this.decoder = new TransactionDecoder();
    this.filter = new TradeFilter(provider);
    this.executor = new TradeExecutor(wallet, provider);
    this.profitTracker = new ProfitTracker(provider, wallet);
    this.notificationService = new NotificationService();
    
    // Stats
    this.stats = {
      totalTransactions: 0,
      tradesDetected: 0,
      tradesExecuted: 0,
      tradesFailed: 0,
      tradesFiltered: 0,
      walletSwitches: 0,
      takeProfitExecuted: 0,
    };
  }

  /**
   * Start monitoring the blockchain for transactions
   */
  async start() {
    logger.info('🚀 Starting BNB Copy-Trading Bot');
    logger.info(`👀 Watching wallet: ${this.watchedWallet}`);
    logger.info(`🤖 Bot wallet: ${this.wallet.address}`);
    const balance = await this.executor.getBnbBalance();
    logger.info(`💰 Bot balance: ${balance.toFixed(4)} BNB`);
    
    this.printConfig();

    // Send startup notification
    const mode = config.copyBuyOnly ? 'BUY ONLY' : 'BUY & SELL';
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

      this.stats.totalTransactions++;
      logger.info(`\n📡 Detected transaction from watched wallet: ${tx.hash}`);

      // Analyze transaction
      const analysis = this.decoder.analyzeTransaction(tx);
      logger.debug('Transaction analysis:', analysis);

      // Send watch alert for ALL transactions except token transfers
      if (analysis.type !== 'TOKEN_TRANSFER' && analysis.type !== 'UNKNOWN' && analysis.type !== 'ERROR') {
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

      // Handle different transaction types
      if (this.decoder.isSwapTransaction(analysis)) {
        await this.handleSwapTransaction(analysis, tx);
      } else if (this.decoder.isTransferTransaction(analysis)) {
        await this.handleTransferTransaction(analysis, tx);
      } else {
        logger.debug('Transaction type not relevant for copy trading');
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

      // BUY ONLY MODE: Skip sell trades
      if (config.copyBuyOnly && analysis.swapType === 'SELL') {
        logger.info('⏭️  Skipping SELL trade (BUY ONLY mode enabled)');
        return;
      }

      // If sell copying is disabled, skip
      if (!config.copySell && analysis.swapType === 'SELL') {
        logger.info('⏭️  Skipping SELL trade (COPY_SELL disabled)');
        return;
      }

      // ONE-TIME BUY CHECK: Skip if already bought this token
      if (config.oneTimeBuyPerToken && analysis.swapType === 'BUY') {
        const tokenAddress = analysis.tokenOut;
        if (this.profitTracker.hasAlreadyBought(tokenAddress)) {
          logger.info(`⏭️  Already bought ${tokenAddress}, skipping (one-time buy rule)`);
          this.stats.tradesFiltered++;
          return;
        }
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
        adjustedAmount = this.filter.calculateAdjustedAmount(analysis.amountInBnb);
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
   * Handle transfer transaction (potential wallet switch)
   */
  async handleTransferTransaction(analysis, tx) {
    try {
      if (!config.autoFollowEnabled) {
        logger.debug('Auto-follow disabled, ignoring transfer');
        return;
      }

      let transferAmountBnb = 0;
      let newWallet = null;

      if (analysis.type === 'BNB_TRANSFER') {
        transferAmountBnb = analysis.valueInBnb;
        newWallet = analysis.to;
        logger.info(`💸 BNB transfer detected: ${transferAmountBnb} BNB to ${newWallet}`);
      } else if (analysis.type === 'TOKEN_TRANSFER') {
        // For token transfers, we'll switch if it's a significant transfer
        newWallet = analysis.to;
        logger.info(`🪙 Token transfer detected to ${newWallet}`);
        // You could add logic here to check token value in BNB terms
        transferAmountBnb = config.minTransferAmountBnb; // Assume it meets threshold
      }

      // Check if transfer meets minimum threshold
      if (transferAmountBnb >= config.minTransferAmountBnb && newWallet) {
        await this.switchWatchedWallet(
          newWallet.toLowerCase(),
          `Transfer of ${transferAmountBnb} BNB detected`
        );
      } else {
        logger.debug(`Transfer amount ${transferAmountBnb} BNB below threshold ${config.minTransferAmountBnb} BNB`);
      }
    } catch (error) {
      logger.error('Error handling transfer transaction:', error);
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
    
    logger.walletSwitch(oldWallet, newWallet, reason);
  }

  /**
   * Print current configuration
   */
  printConfig() {
    logger.info('\n⚙️  Configuration:');
    logger.info(`   Mode: ${config.copyBuyOnly ? '🟢 BUY ONLY' : '🔵 BUY & SELL'}`);
    logger.info(`   Max Buy Amount: ${config.maxBuyAmountBnb} BNB`);
    logger.info(`   Slippage: ${config.slippagePercent}%`);
    logger.info(`   Max Gas Price: ${config.maxGasPriceGwei} Gwei`);
    logger.info(`   Min Liquidity: $${config.minLiquidityUsd.toLocaleString()}`);
    logger.info(`   Max Token Age: ${config.maxTokenAgeHours} hours`);
    logger.info(`   One-Time Buy: ${config.oneTimeBuyPerToken ? 'Enabled' : 'Disabled'}`);
    logger.info(`   Auto-Follow: ${config.autoFollowEnabled ? 'Enabled' : 'Disabled'}`);
    logger.info(`   Fast Mode: ${config.fastMode ? `Enabled (${config.gasMultiplier}x gas)` : 'Disabled'}`);
    
    if (config.autoTakeProfitEnabled) {
      logger.info(`   Take Profit: ${config.takeProfitPercent}%`);
    }
    
    if (config.enableTelegramAlerts) {
      logger.info(`   Telegram Alerts: Enabled`);
    }
    
    if (config.allowedRouters.length > 0) {
      logger.info(`   Allowed Routers: ${config.allowedRouters.length} router(s)`);
    }
    
    if (config.blacklistedTokens.length > 0) {
      logger.info(`   Blacklisted Tokens: ${config.blacklistedTokens.length} token(s)`);
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
    logger.info(`   Take Profits Executed: ${this.stats.takeProfitExecuted}`);
    logger.info(`   Wallet Switches: ${this.stats.walletSwitches}`);
    logger.info(`   Open Positions: ${this.profitTracker.getPositionCount()}`);
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
}
