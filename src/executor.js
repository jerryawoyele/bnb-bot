import { ethers } from 'ethers';
import { config } from './config.js';
import { logger } from './logger.js';
import { PANCAKE_ROUTER_ABI, ERC20_ABI } from './abis.js';

export class TradeExecutor {
  constructor(wallet, provider) {
    this.wallet = wallet;
    this.provider = provider;
    this.router = new ethers.Contract(
      config.pancakeRouter,
      PANCAKE_ROUTER_ABI,
      wallet
    );
  }

  /**
   * Execute a copy trade based on leader's transaction
   */
  async executeTrade(tradeData, adjustedAmountBnb = null) {
    try {
      logger.info(`Executing ${tradeData.swapType} trade...`);

      if (tradeData.swapType === 'BUY') {
        return await this.executeBuy(tradeData, adjustedAmountBnb);
      } else if (tradeData.swapType === 'SELL') {
        return await this.executeSell(tradeData);
      } else {
        logger.warn('Unsupported swap type:', tradeData.swapType);
        return { success: false, reason: 'Unsupported swap type' };
      }
    } catch (error) {
      logger.error('Trade execution failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a BUY trade (BNB -> Token)
   */
  async executeBuy(tradeData, adjustedAmountBnb = null) {
    try {
      const amountBnb = adjustedAmountBnb || tradeData.amountInBnb;
      const amountIn = ethers.parseEther(amountBnb.toString());

      logger.info(`Buying token ${tradeData.tokenOut} with ${amountBnb} BNB`);

      // Check bot's BNB balance
      const balance = await this.provider.getBalance(this.wallet.address);
      if (balance < amountIn) {
        logger.error('Insufficient BNB balance');
        return { 
          success: false, 
          reason: `Insufficient balance. Have: ${ethers.formatEther(balance)} BNB, Need: ${amountBnb} BNB` 
        };
      }

      // Calculate minimum output with slippage
      const path = [config.wbnb, tradeData.tokenOut];
      const amounts = await this.router.getAmountsOut(amountIn, path);
      const amountOutMin = this.applySlippage(amounts[1], config.slippagePercent);

      // Set deadline (5 minutes from now)
      const deadline = Math.floor(Date.now() / 1000) + 300;

      // Get gas price with fast mode optimization
      const feeData = await this.provider.getFeeData();
      let gasPrice = feeData.gasPrice;
      
      // Fast mode: increase gas price for faster execution
      if (config.fastMode) {
        gasPrice = BigInt(Math.floor(Number(gasPrice) * config.gasMultiplier));
        logger.debug(`⚡ Fast mode: Boosting gas to ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);
      }

      logger.info(`Amount out (min): ${ethers.formatUnits(amountOutMin, 18)} tokens`);
      logger.info(`Gas price: ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);

      // Execute swap immediately
      const tx = await this.router.swapExactETHForTokens(
        amountOutMin,
        path,
        this.wallet.address,
        deadline,
        {
          value: amountIn,
          gasPrice: gasPrice,
          gasLimit: 500000, // Increased gas limit for safety
        }
      );

      logger.info(`Transaction sent: ${tx.hash}`);
      logger.info('Waiting for confirmation...');

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        logger.trade('SUCCESS', {
          'Transaction Hash': receipt.hash,
          'Type': 'BUY',
          'Token': tradeData.tokenOut,
          'Amount In': `${amountBnb} BNB`,
          'Block': receipt.blockNumber,
          'Gas Used': receipt.gasUsed.toString(),
        });

        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          tokenAddress: tradeData.tokenOut,
          amountBnb,
          amountOutMin, // Estimated token amount received
        };
      } else {
        logger.error('Transaction failed');
        return { success: false, reason: 'Transaction reverted' };
      }
    } catch (error) {
      logger.error('Buy execution error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a SELL trade (Token -> BNB)
   */
  async executeSell(tradeData) {
    try {
      const tokenAddress = tradeData.tokenIn;
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);

      logger.info(`Selling token ${tokenAddress} for BNB`);

      // Check token balance
      const balance = await token.balanceOf(this.wallet.address);
      if (balance === 0n) {
        logger.warn('No tokens to sell');
        return { success: false, reason: 'No token balance' };
      }

      // Use 100% of token balance or the amount from leader's trade (whichever is smaller)
      const amountIn = balance < tradeData.amountIn ? balance : tradeData.amountIn;

      logger.info(`Selling ${ethers.formatUnits(amountIn, 18)} tokens`);

      // Check allowance
      const allowance = await token.allowance(this.wallet.address, config.pancakeRouter);
      if (allowance < amountIn) {
        logger.info('Approving token...');
        const approveTx = await token.approve(
          config.pancakeRouter,
          ethers.MaxUint256 // Approve unlimited
        );
        await approveTx.wait();
        logger.info('Token approved');
      }

      // Calculate minimum output with slippage
      const path = [tokenAddress, config.wbnb];
      const amounts = await this.router.getAmountsOut(amountIn, path);
      const amountOutMin = this.applySlippage(amounts[1], config.slippagePercent);

      // Set deadline
      const deadline = Math.floor(Date.now() / 1000) + 300;

      // Get gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      logger.info(`Expected output (min): ${ethers.formatEther(amountOutMin)} BNB`);

      // Execute swap
      const tx = await this.router.swapExactTokensForETH(
        amountIn,
        amountOutMin,
        path,
        this.wallet.address,
        deadline,
        {
          gasPrice: gasPrice,
          gasLimit: 500000,
        }
      );

      logger.info(`Transaction sent: ${tx.hash}`);
      logger.info('Waiting for confirmation...');

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        logger.trade('SUCCESS', {
          'Transaction Hash': receipt.hash,
          'Type': 'SELL',
          'Token': tokenAddress,
          'Amount Out (min)': `${ethers.formatEther(amountOutMin)} BNB`,
          'Block': receipt.blockNumber,
          'Gas Used': receipt.gasUsed.toString(),
        });

        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        };
      } else {
        logger.error('Transaction failed');
        return { success: false, reason: 'Transaction reverted' };
      }
    } catch (error) {
      logger.error('Sell execution error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply slippage to an amount
   */
  applySlippage(amount, slippagePercent) {
    const slippageMultiplier = (100 - slippagePercent) / 100;
    return BigInt(Math.floor(Number(amount) * slippageMultiplier));
  }

  /**
   * Get bot's current BNB balance
   */
  async getBnbBalance() {
    const balance = await this.provider.getBalance(this.wallet.address);
    return parseFloat(ethers.formatEther(balance));
  }

  /**
   * Get bot's token balance
   */
  async getTokenBalance(tokenAddress) {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const balance = await token.balanceOf(this.wallet.address);
      const decimals = await token.decimals();
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      logger.error('Error getting token balance:', error);
      return 0;
    }
  }
}
