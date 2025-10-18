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

      // Filter 3: Check gas price (with swap type)
      results.filters.gasPrice = await this.checkGasPrice(tradeData.swapType);
      if (!results.filters.gasPrice.passed) {
        results.passed = false;
        return results;
      }

      // Filter 4: Check token age (for BUY trades only)
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
    const activeConfig = await this.getConfig();
    const routerLower = router.toLowerCase();
    
    // If no allowed routers specified, allow all
    if (!activeConfig.allowedRouters || activeConfig.allowedRouters.length === 0) {
      return { passed: true, reason: 'No router whitelist configured' };
    }

    const isAllowed = activeConfig.allowedRouters.includes(routerLower);
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
    const activeConfig = await this.getConfig();
    const tokenLower = tokenAddress.toLowerCase();
    const isBlacklisted = activeConfig.blacklistedTokens && activeConfig.blacklistedTokens.includes(tokenLower);
    
    return {
      passed: !isBlacklisted,
      reason: isBlacklisted 
        ? `Token ${tokenAddress} is blacklisted` 
        : 'Token not blacklisted',
    };
  }

  /**
   * Get fixed buy amount from config
   */
  async getBuyAmount() {
    const activeConfig = await this.getConfig();
    // Use buyAmountBnb (new field) or fall back to maxBuyAmountBnb (legacy)
    return activeConfig.buyAmountBnb || activeConfig.maxBuyAmountBnb || 0.01;
  }

  /**
   * Check current gas price against buy/sell limits
   */
  async checkGasPrice(swapType = 'BUY') {
    try {
      const activeConfig = await this.getConfig();
      const feeData = await this.provider.getFeeData();
      const gasPriceGwei = parseFloat(ethers.formatUnits(feeData.gasPrice, 'gwei'));
      
      // Use different limits for buy vs sell
      const maxGas = swapType === 'BUY' 
        ? (activeConfig.buyGasGwei || activeConfig.maxGasPriceGwei || 10)
        : (activeConfig.sellGasGwei || activeConfig.maxGasPriceGwei || 10);
      
      const withinLimit = gasPriceGwei <= maxGas;
      
      return {
        passed: withinLimit,
        reason: withinLimit
          ? `Gas price ${gasPriceGwei.toFixed(2)} Gwei acceptable for ${swapType}`
          : `Gas price ${gasPriceGwei.toFixed(2)} Gwei exceeds max ${maxGas} Gwei for ${swapType}`,
        gasPriceGwei,
        maxGasGwei: maxGas,
      };
    } catch (error) {
      logger.warn('Could not check gas price:', error.message);
      return { passed: true, reason: 'Gas price check skipped' };
    }
  }

  // Liquidity check removed - no longer used

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
      const activeConfig = await this.getConfig();
      const block = await this.provider.getBlock(firstEvent.blockNumber);
      const tokenAgeSeconds = Date.now() / 1000 - block.timestamp;
      
      // Use maxTokenAgeSeconds (new) or fall back to maxTokenAgeHours * 3600 (legacy)
      const maxAgeSeconds = activeConfig.maxTokenAgeSeconds || 
                           (activeConfig.maxTokenAgeHours ? activeConfig.maxTokenAgeHours * 3600 : 0);
      
      const acceptable = tokenAgeSeconds <= maxAgeSeconds || maxAgeSeconds === 0;

      return {
        passed: acceptable,
        reason: acceptable
          ? `Token age ${tokenAgeSeconds.toFixed(0)}s is acceptable`
          : `Token age ${tokenAgeSeconds.toFixed(0)}s exceeds max ${maxAgeSeconds}s`,
        tokenAgeSeconds,
        maxTokenAgeSeconds: maxAgeSeconds,
      };
    } catch (error) {
      logger.warn('Could not check token age:', error.message);
      // If we can't determine age, allow it (might be old token with no recent events)
      return { passed: true, reason: 'Token age check skipped' };
    }
  }

  /**
   * Get fixed buy amount from config (ignores original amount)
   */
  async getFixedBuyAmount() {
    return await this.getBuyAmount();
  }
}
