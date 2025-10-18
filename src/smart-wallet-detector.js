import { ethers } from 'ethers';
import { logger } from './logger.js';

/**
 * Smart Wallet Detector
 * Monitors a trigger wallet for incoming transfers, then finds matching outgoing transfers
 * within 1 minute that are within $10 of the incoming amount
 */
export class SmartWalletDetector {
  constructor(provider, triggerWallet, bnbPriceUsd = 600) {
    this.provider = provider;
    this.triggerWallet = triggerWallet.toLowerCase();
    this.bnbPriceUsd = bnbPriceUsd; // You may want to fetch this dynamically
    this.pendingIncomingTx = null;
    this.monitoringTimeout = null;
    this.isActive = false;
  }

  async start(onWalletDetected, onNoMatch, onMultipleMatches) {
    if (this.isActive) {
      logger.warn('Smart wallet detector already active');
      return;
    }

    this.isActive = true;
    this.onWalletDetected = onWalletDetected;
    this.onNoMatch = onNoMatch;
    this.onMultipleMatches = onMultipleMatches;

    logger.info(`🔍 Smart Wallet Detector started`);
    logger.info(`   Monitoring wallet: ${this.triggerWallet}`);

    // Listen for incoming transfers to trigger wallet
    this.provider.on('block', async (blockNumber) => {
      if (!this.isActive) return;
      await this.checkBlock(blockNumber);
    });
  }

  stop() {
    this.isActive = false;
    if (this.monitoringTimeout) {
      clearTimeout(this.monitoringTimeout);
      this.monitoringTimeout = null;
    }
    logger.info('🛑 Smart Wallet Detector stopped');
  }

  async checkBlock(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber, true);
      if (!block || !block.transactions) return;

      for (const tx of block.transactions) {
        // Check if this is a transfer TO the trigger wallet
        if (tx.to && tx.to.toLowerCase() === this.triggerWallet && tx.value > 0) {
          const amountBnb = parseFloat(ethers.formatEther(tx.value));
          const amountUsd = amountBnb * this.bnbPriceUsd;

          logger.info(`💰 Incoming transfer detected to trigger wallet`);
          logger.info(`   Amount: ${amountBnb.toFixed(4)} BNB (~$${amountUsd.toFixed(2)})`);
          logger.info(`   From: ${tx.from}`);
          logger.info(`   TX: ${tx.hash}`);

          // Start monitoring for outgoing transfers
          this.startMonitoring(amountBnb, amountUsd);
          return; // Only process one incoming at a time
        }
      }
    } catch (error) {
      logger.error('Error checking block:', error);
    }
  }

  startMonitoring(incomingAmountBnb, incomingAmountUsd) {
    if (this.pendingIncomingTx) {
      logger.warn('Already monitoring an incoming transfer, ignoring new one');
      return;
    }

    this.pendingIncomingTx = {
      amountBnb: incomingAmountBnb,
      amountUsd: incomingAmountUsd,
      timestamp: Date.now(),
      matchingOutgoing: []
    };

    logger.info(`⏱️  Monitoring for outgoing transfers (next 60 seconds)...`);
    logger.info(`   Looking for transfers within $10 of $${incomingAmountUsd.toFixed(2)}`);

    // Set timeout for 60 seconds
    this.monitoringTimeout = setTimeout(() => {
      this.evaluateMatches();
    }, 60000); // 60 seconds

    // Start checking for outgoing transfers
    this.monitorOutgoing();
  }

  async monitorOutgoing() {
    const checkInterval = setInterval(async () => {
      if (!this.pendingIncomingTx) {
        clearInterval(checkInterval);
        return;
      }

      try {
        // Get recent transactions from the trigger wallet
        const currentBlock = await this.provider.getBlockNumber();
        
        // Check last few blocks for outgoing transfers
        for (let i = 0; i < 3; i++) {
          const blockNumber = currentBlock - i;
          const block = await this.provider.getBlock(blockNumber, true);
          
          if (!block || !block.transactions) continue;

          for (const tx of block.transactions) {
            // Check if this is a transfer FROM the trigger wallet
            if (tx.from && tx.from.toLowerCase() === this.triggerWallet && tx.value > 0) {
              const amountBnb = parseFloat(ethers.formatEther(tx.value));
              const amountUsd = amountBnb * this.bnbPriceUsd;

              // Check if this matches our criteria (within $10)
              const difference = Math.abs(amountUsd - this.pendingIncomingTx.amountUsd);
              
              if (difference <= 10) {
                // Check if we already recorded this transaction
                const alreadyRecorded = this.pendingIncomingTx.matchingOutgoing.some(
                  m => m.hash === tx.hash
                );

                if (!alreadyRecorded) {
                  logger.info(`✅ Found matching outgoing transfer!`);
                  logger.info(`   Amount: ${amountBnb.toFixed(4)} BNB (~$${amountUsd.toFixed(2)})`);
                  logger.info(`   To: ${tx.to}`);
                  logger.info(`   Difference: $${difference.toFixed(2)}`);
                  logger.info(`   TX: ${tx.hash}`);

                  this.pendingIncomingTx.matchingOutgoing.push({
                    to: tx.to,
                    amountBnb,
                    amountUsd,
                    difference,
                    hash: tx.hash
                  });

                  // If we found more than one match, stop immediately
                  if (this.pendingIncomingTx.matchingOutgoing.length > 1) {
                    clearInterval(checkInterval);
                    clearTimeout(this.monitoringTimeout);
                    this.handleMultipleMatches();
                    return;
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        logger.error('Error monitoring outgoing transfers:', error);
      }
    }, 5000); // Check every 5 seconds
  }

  evaluateMatches() {
    if (!this.pendingIncomingTx) return;

    const matchCount = this.pendingIncomingTx.matchingOutgoing.length;

    logger.info(`⏰ Monitoring period ended`);
    logger.info(`   Found ${matchCount} matching transfer(s)`);

    if (matchCount === 0) {
      logger.warn('❌ No matching outgoing transfer found');
      logger.warn('   Shutting down bot...');
      this.handleNoMatch();
    } else if (matchCount === 1) {
      logger.info('✅ Exactly one matching transfer found!');
      const match = this.pendingIncomingTx.matchingOutgoing[0];
      logger.info(`   Target wallet: ${match.to}`);
      this.handleWalletDetected(match.to);
    } else {
      this.handleMultipleMatches();
    }

    this.pendingIncomingTx = null;
  }

  handleWalletDetected(walletAddress) {
    this.stop();
    if (this.onWalletDetected) {
      this.onWalletDetected(walletAddress);
    }
  }

  handleNoMatch() {
    this.stop();
    if (this.onNoMatch) {
      this.onNoMatch();
    }
  }

  handleMultipleMatches() {
    logger.error('❌ Multiple matching transfers found');
    logger.error('   Shutting down bot...');
    this.stop();
    if (this.onMultipleMatches) {
      this.onMultipleMatches();
    }
  }

  async updateBnbPrice() {
    try {
      // You can implement fetching real BNB price from an API
      // For now, we'll use a fixed price
      this.bnbPriceUsd = 600; // Update this dynamically if needed
    } catch (error) {
      logger.error('Failed to update BNB price:', error);
    }
  }
}
