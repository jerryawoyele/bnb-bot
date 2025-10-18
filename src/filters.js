import { ethers } from 'ethers';
import { config } from './config.js';
import { logger } from './logger.js';
import { 
  PANCAKE_FACTORY_ABI, 
  PANCAKE_PAIR_ABI, 
  ERC20_ABI 
} from './abis.js';

export class TradeFilter {
  constructor(provider, database = null) {
    this.provider = provider;
    this.database = database;
    this.factoryAddress = '0xBCfCcbde45cE874adCB698cC183deBcF17952812'; // PancakeSwap v2 Factory
    this.factory = new ethers.Contract(
      this.factoryAddress,
      PANCAKE_FACTORY_ABI,
      provider
    );
    this.bnbPriceUsd = null;
    this.bnbPriceLastUpdate = 0;
    // BUSD address for price oracle
    this.busdAddress = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
    this.configCache = null;
    this.configLastUpdate = 0;
  }

  /**
   * Get config from MongoDB or fall back to static config
   */
  async getConfig() {
    const now = Date.now();
    
    // Return cached config if less than 10 seconds old
    if (this.configCache && (now - this.configLastUpdate) < 10000) {
      return this.configCache;
    }

    // Try to get from MongoDB
    if (this.database) {
      try {
        const dbConfig = await this.database.getConfig();
        if (dbConfig) {
          this.configCache = dbConfig;
          this.configLastUpdate = now;
          return dbConfig;
        }
      } catch (error) {
        logger.warn('Failed to get config from MongoDB, using static config:', error.message);
      }
    }

    // Fall back to static config
    return config;
  }

  /**
   * Get BNB price in USD (cached for 1 minute)
   */
  async getBnbPriceUsd() {
    const now = Date.now();
    
    // Return cached price if less than 1 minute old
    if (this.bnbPriceUsd && (now - this.bnbPriceLastUpdate) < 60000) {
      return this.bnbPriceUsd;
    }

    try {
      // Get WBNB/BUSD pair
      const pairAddress = await this.factory.getPair(config.wbnb, this.busdAddress);
      
      if (pairAddress === ethers.ZeroAddress) {
        logger.warn('WBNB/BUSD pair not found, using fallback price');
        return 600; // Fallback price
      }

      const pair = new ethers.Contract(pairAddress, PANCAKE_PAIR_ABI, this.provider);
      const reserves = await pair.getReserves();
      const token0 = await pair.token0();
      
      // Calculate price based on reserves
      let bnbReserve, busdReserve;
      if (token0.toLowerCase() === config.wbnb.toLowerCase()) {
        bnbReserve = reserves.reserve0;
        busdReserve = reserves.reserve1;
      } else {
        bnbReserve = reserves.reserve1;
        busdReserve = reserves.reserve0;
      }

      this.bnbPriceUsd = parseFloat(ethers.formatEther(busdReserve)) / parseFloat(ethers.formatEther(bnbReserve));
      this.bnbPriceLastUpdate = now;
      
      logger.debug(`BNB Price: $${this.bnbPriceUsd.toFixed(2)}`);
      return this.bnbPriceUsd;
    } catch (error) {
      logger.warn('Could not fetch BNB price:', error.message);
      return this.bnbPriceUsd || 600; // Return cached or fallback
    }
  }

  /**
   * Apply all filters to a trade
   */
  async applyFilters(tradeData) {
    const results = {
      passed: true,
      filters: {},
    };

    try {
      // Filter 1: Check if router is allowed
      results.filters.allowedRouter = await this.checkAllowedRouter(tradeData.router);
      if (!results.filters.allowedRouter.passed) {
        results.passed = false;
        return results;
      }

      // Filter 2: Check if token is blacklisted
      const tokenToCheck = tradeData.tokenOut || tradeData.tokenIn;
      results.filters.notBlacklisted = await this.checkNotBlacklisted(tokenToCheck);
      if (!results.filters.notBlacklisted.passed) {
        results.passed = false;
        return results;
      }

      // Filter 3: Check buy amount (for BUY trades)
      if (tradeData.swapType === 'BUY') {
        results.filters.maxBuyAmount = this.checkMaxBuyAmount(tradeData.amountInBnb);
        if (!results.filters.maxBuyAmount.passed) {
          results.passed = false;
          return results;
        }
      }

      // Filter 4: Check gas price
      results.filters.gasPrice = await this.checkGasPrice();
      if (!results.filters.gasPrice.passed) {
        results.passed = false;
        return results;
      }

      // Filter 5: Check liquidity
      results.filters.liquidity = await this.checkLiquidity(
        tradeData.tokenIn,
        tradeData.tokenOut
      );
      if (!results.filters.liquidity.passed) {
        results.passed = false;
        return results;
      }

      // Filter 6: Check token age (for new tokens)
      if (tradeData.swapType === 'BUY') {
        results.filters.tokenAge = await this.checkTokenAge(tradeData.tokenOut);
        if (!results.filters.tokenAge.passed) {
          results.passed = false;
          return results;
        }
      }

      logger.info('✅ All filters passed');
    } catch (error) {
      logger.error('Error applying filters:', error);
      results.passed = false;
      results.error = error.message;
    }

    return results;
  }

  /**
   * Check if router is in allowed list
   */
  async checkAllowedRouter(router) {
    const routerLower = router.toLowerCase();
    
    // If no allowed routers specified, allow all
    if (config.allowedRouters.length === 0) {
      return { passed: true, reason: 'No router whitelist configured' };
    }

    const isAllowed = config.allowedRouters.includes(routerLower);
    return {
      passed: isAllowed,
      reason: isAllowed 
        ? 'Router is in whitelist' 
        : `Router ${router} not in allowed list`,
    };
  }

  /**
   * Check if token is blacklisted
   */
  async checkNotBlacklisted(tokenAddress) {
    const tokenLower = tokenAddress.toLowerCase();
    const isBlacklisted = config.blacklistedTokens.includes(tokenLower);
    
    return {
      passed: !isBlacklisted,
      reason: isBlacklisted 
        ? `Token ${tokenAddress} is blacklisted` 
        : 'Token not blacklisted',
    };
  }

  /**
   * Check if buy amount is within limit
   */
  checkMaxBuyAmount(amountBnb) {
    const withinLimit = amountBnb <= config.maxBuyAmountBnb;
    
    return {
      passed: withinLimit,
      reason: withinLimit
        ? `Amount ${amountBnb} BNB within limit`
        : `Amount ${amountBnb} BNB exceeds max ${config.maxBuyAmountBnb} BNB`,
      amountBnb,
      maxBuyAmountBnb: config.maxBuyAmountBnb,
    };
  }

  /**
   * Check current gas price
   */
  async checkGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      const gasPriceGwei = parseFloat(ethers.formatUnits(feeData.gasPrice, 'gwei'));
      const withinLimit = gasPriceGwei <= config.maxGasPriceGwei;
      
      return {
        passed: withinLimit,
        reason: withinLimit
          ? `Gas price ${gasPriceGwei.toFixed(2)} Gwei acceptable`
          : `Gas price ${gasPriceGwei.toFixed(2)} Gwei exceeds max ${config.maxGasPriceGwei} Gwei`,
        gasPriceGwei,
        maxGasPriceGwei: config.maxGasPriceGwei,
      };
    } catch (error) {
      logger.warn('Could not check gas price:', error.message);
      return { passed: true, reason: 'Gas price check skipped' };
    }
  }

  /**
   * Check liquidity of token pair (in USD)
   */
  async checkLiquidity(tokenA, tokenB) {
    try {
      // Get pair address
      const pairAddress = await this.factory.getPair(tokenA, tokenB);
      
      if (pairAddress === ethers.ZeroAddress) {
        return { 
          passed: false, 
          reason: 'No liquidity pool exists for this pair' 
        };
      }

      // Get pair contract
      const pair = new ethers.Contract(pairAddress, PANCAKE_PAIR_ABI, this.provider);
      
      // Get reserves
      const reserves = await pair.getReserves();
      const token0 = await pair.token0();
      const token1 = await pair.token1();

      // Determine which reserve is BNB/WBNB
      const wbnbAddress = config.wbnb.toLowerCase();
      let bnbReserve;
      
      if (token0.toLowerCase() === wbnbAddress) {
        bnbReserve = reserves.reserve0;
      } else if (token1.toLowerCase() === wbnbAddress) {
        bnbReserve = reserves.reserve1;
      } else {
        // Neither token is BNB, can't check liquidity in BNB terms
        return { passed: true, reason: 'Token-to-token swap, BNB liquidity check skipped' };
      }

      const liquidityBnb = parseFloat(ethers.formatEther(bnbReserve));
      
      // Get BNB price and convert to USD
      const bnbPriceUsd = await this.getBnbPriceUsd();
      const liquidityUsd = liquidityBnb * bnbPriceUsd;
      
      const sufficient = liquidityUsd >= config.minLiquidityUsd;

      return {
        passed: sufficient,
        reason: sufficient
          ? `Liquidity $${liquidityUsd.toFixed(0)} is sufficient`
          : `Liquidity $${liquidityUsd.toFixed(0)} below minimum $${config.minLiquidityUsd}`,
        liquidityBnb,
        liquidityUsd,
        minLiquidityUsd: config.minLiquidityUsd,
        pairAddress,
      };
    } catch (error) {
      logger.warn('Could not check liquidity:', error.message);
      // On error, be cautious and reject
      return { 
        passed: false, 
        reason: `Liquidity check failed: ${error.message}` 
      };
    }
  }

  /**
   * Check token age (time since contract deployment)
   */
  async checkTokenAge(tokenAddress) {
    try {
      // Get token contract
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      // Try to get contract creation by checking earliest transfer event
      const currentBlock = await this.provider.getBlockNumber();
      const blocksToCheck = 50000; // Roughly 2 days on BSC
      const fromBlock = Math.max(0, currentBlock - blocksToCheck);
      
      const filter = token.filters.Transfer();
      const events = await token.queryFilter(filter, fromBlock, currentBlock);
      
      if (events.length === 0) {
        // No events found in recent blocks, assume old token
        return { 
          passed: true, 
          reason: 'Token appears to be older (no recent creation events)' 
        };
      }

      // Get the earliest event
      const firstEvent = events[0];
      const block = await this.provider.getBlock(firstEvent.blockNumber);
      const tokenAgeHours = (Date.now() / 1000 - block.timestamp) / 3600;
      
      const acceptable = tokenAgeHours <= config.maxTokenAgeHours || config.maxTokenAgeHours === 0;

      return {
        passed: acceptable,
        reason: acceptable
          ? `Token age ${tokenAgeHours.toFixed(2)} hours is acceptable`
          : `Token age ${tokenAgeHours.toFixed(2)} hours exceeds max ${config.maxTokenAgeHours} hours`,
        tokenAgeHours,
        maxTokenAgeHours: config.maxTokenAgeHours,
      };
    } catch (error) {
      logger.warn('Could not check token age:', error.message);
      // If we can't determine age, allow it (might be old token with no recent events)
      return { passed: true, reason: 'Token age check skipped' };
    }
  }

  /**
   * Calculate adjusted buy amount based on max limit
   */
  calculateAdjustedAmount(originalAmountBnb) {
    if (originalAmountBnb <= config.maxBuyAmountBnb) {
      return originalAmountBnb;
    }
    
    // Cap at max buy amount
    return config.maxBuyAmountBnb;
  }
}
