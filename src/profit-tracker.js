import { ethers } from 'ethers';
import { config } from './config.js';
import { logger } from './logger.js';
import { ERC20_ABI, PANCAKE_ROUTER_ABI } from './abis.js';

/**
 * Tracks token positions and manages take-profit
 */
export class ProfitTracker {
  constructor(provider, wallet) {
    this.provider = provider;
    this.wallet = wallet;
    this.router = new ethers.Contract(
      config.pancakeRouter,
      PANCAKE_ROUTER_ABI,
      wallet
    );
    
    // Track bought tokens: { tokenAddress: { buyPrice, amount, txHash, timestamp } }
    this.positions = new Map();
    
    // Track tokens already bought (for one-time buy rule)
    this.boughtTokens = new Set();
  }

  /**
   * Record a buy trade
   */
  recordBuy(tokenAddress, amountBnb, tokenAmount, txHash) {
    const buyPrice = amountBnb / parseFloat(ethers.formatEther(tokenAmount));
    
    this.positions.set(tokenAddress.toLowerCase(), {
      buyPrice,
      buyAmountBnb: amountBnb,
      tokenAmount,
      txHash,
      timestamp: Date.now(),
    });
    
    this.boughtTokens.add(tokenAddress.toLowerCase());
    
    logger.info(`📝 Position recorded: ${tokenAddress}`);
    logger.info(`   Buy price: ${buyPrice.toFixed(10)} BNB per token`);
    logger.info(`   Amount: ${ethers.formatEther(tokenAmount)} tokens`);
  }

  /**
   * Check if we should take profit on a token
   */
  async checkTakeProfit(tokenAddress, notificationService = null) {
    if (!config.autoTakeProfitEnabled) {
      return null;
    }

    const position = this.positions.get(tokenAddress.toLowerCase());
    if (!position) {
      return null;
    }

    try {
      // Get current token balance
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const balance = await token.balanceOf(this.wallet.address);
      
      if (balance === 0n) {
        logger.debug(`No balance for ${tokenAddress}, removing position`);
        this.positions.delete(tokenAddress.toLowerCase());
        return null;
      }

      // Get current value in BNB
      const path = [tokenAddress, config.wbnb];
      const amounts = await this.router.getAmountsOut(balance, path);
      const currentValueBnb = parseFloat(ethers.formatEther(amounts[1]));
      
      // Calculate profit percentage
      const profitPercent = ((currentValueBnb - position.buyAmountBnb) / position.buyAmountBnb) * 100;
      
      logger.debug(`📊 ${tokenAddress} profit: ${profitPercent.toFixed(2)}%`);

      // Check if we've reached take profit target
      if (profitPercent >= config.takeProfitPercent) {
        logger.info(`🎯 TAKE PROFIT TARGET REACHED: ${profitPercent.toFixed(2)}%`);
        logger.info(`   Token: ${tokenAddress}`);
        logger.info(`   Buy value: ${position.buyAmountBnb.toFixed(4)} BNB`);
        logger.info(`   Current value: ${currentValueBnb.toFixed(4)} BNB`);
        logger.info(`   Profit: ${(currentValueBnb - position.buyAmountBnb).toFixed(4)} BNB`);
        
        // Send notification before selling
        if (notificationService && config.sendProfitAlerts) {
          await notificationService.notifyTakeProfit(
            tokenAddress,
            position.buyAmountBnb,
            currentValueBnb,
            profitPercent
          );
        }
        
        return {
          tokenAddress,
          balance,
          profitPercent,
          buyValueBnb: position.buyAmountBnb,
          currentValueBnb,
        };
      }

      return null;
    } catch (error) {
      logger.error(`Error checking take profit for ${tokenAddress}:`, error);
      return null;
    }
  }

  /**
   * Check all positions for take profit opportunities
   */
  async checkAllPositions(notificationService = null) {
    const takeProfitOpportunities = [];
    
    for (const [tokenAddress] of this.positions) {
      const opportunity = await this.checkTakeProfit(tokenAddress, notificationService);
      if (opportunity) {
        takeProfitOpportunities.push(opportunity);
      }
    }
    
    return takeProfitOpportunities;
  }

  /**
   * Execute take profit sell
   */
  async executeTakeProfit(opportunity, executor, notificationService = null) {
    try {
      logger.info(`💰 Executing take profit for ${opportunity.tokenAddress}`);
      
      // Prepare sell data
      const sellData = {
        swapType: 'SELL',
        tokenIn: opportunity.tokenAddress,
        tokenOut: config.wbnb,
        amountIn: opportunity.balance,
      };
      
      // Execute sell
      const result = await executor.executeSell(sellData);
      
      if (result.success) {
        // Remove position after successful sell
        this.positions.delete(opportunity.tokenAddress.toLowerCase());
        
        logger.trade('TAKE PROFIT SUCCESS', {
          'Token': opportunity.tokenAddress,
          'Profit': `${opportunity.profitPercent.toFixed(2)}%`,
          'Buy Value': `${opportunity.buyValueBnb.toFixed(4)} BNB`,
          'Sell Value': `${opportunity.currentValueBnb.toFixed(4)} BNB`,
          'Profit Amount': `${(opportunity.currentValueBnb - opportunity.buyValueBnb).toFixed(4)} BNB`,
          'Transaction': result.txHash,
        });
        
        if (notificationService && config.sendProfitAlerts) {
          await notificationService.notifyTakeProfitSuccess(
            opportunity.tokenAddress,
            opportunity.profitPercent,
            opportunity.currentValueBnb - opportunity.buyValueBnb,
            result.txHash
          );
        }
      } else {
        logger.error('Take profit sell failed:', result.reason || result.error);
      }
      
      return result;
    } catch (error) {
      logger.error('Error executing take profit:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if token was already bought
   */
  hasAlreadyBought(tokenAddress) {
    return this.boughtTokens.has(tokenAddress.toLowerCase());
  }

  /**
   * Get all current positions
   */
  getPositions() {
    return Array.from(this.positions.entries()).map(([token, data]) => ({
      token,
      ...data,
    }));
  }

  /**
   * Get position count
   */
  getPositionCount() {
    return this.positions.size;
  }

  /**
   * Clear all positions (use with caution)
   */
  clearPositions() {
    this.positions.clear();
    logger.warn('All positions cleared');
  }
}
