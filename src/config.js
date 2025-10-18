import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

export const config = {
  // Network Configuration
  wsRpc: process.env.WS_RPC,
  httpRpc: process.env.HTTP_RPC || 'https://bsc-dataseed1.binance.org/',
  privateKey: process.env.PRIVATE_KEY,
  
  // Wallet Configuration
  startWatched: process.env.START_WATCHED,
  
  // Contract Addresses
  pancakeRouter: process.env.PANCAKE_ROUTER || '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  wbnb: process.env.WBNB || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  
  // Trading Mode
  copyBuyOnly: process.env.COPY_BUY_ONLY === 'true',
  copySell: process.env.COPY_SELL === 'true',
  autoTakeProfitEnabled: process.env.AUTO_TAKE_PROFIT_ENABLED === 'true',
  takeProfitPercent: parseFloat(process.env.TAKE_PROFIT_PERCENT || '100'),
  
  // Trading Filters
  maxBuyAmountBnb: parseFloat(process.env.MAX_BUY_AMOUNT_BNB || '0.5'),
  slippagePercent: parseFloat(process.env.SLIPPAGE_PERCENT || '2'),
  maxGasPriceGwei: parseFloat(process.env.MAX_GAS_PRICE_GWEI || '10'),
  minLiquidityUsd: parseFloat(process.env.MIN_LIQUIDITY_USD || '10000'),
  maxTokenAgeHours: parseInt(process.env.MAX_TOKEN_AGE_HOURS || '72'),
  
  // One-time buy tracking
  oneTimeBuyPerToken: process.env.ONE_TIME_BUY_PER_TOKEN === 'true',
  
  // Auto-follow Configuration
  autoFollowEnabled: process.env.AUTO_FOLLOW_ENABLED === 'true',
  minTransferAmountBnb: parseFloat(process.env.MIN_TRANSFER_AMOUNT_BNB || '0.1'),
  
  // Blacklist & Whitelist
  blacklistedTokens: (process.env.BLACKLISTED_TOKENS || '')
    .split(',')
    .map(addr => addr.trim().toLowerCase())
    .filter(addr => addr),
  
  allowedRouters: (process.env.ALLOWED_ROUTERS || '')
    .split(',')
    .map(addr => addr.trim().toLowerCase())
    .filter(addr => addr),
  
  // Speed Optimization
  fastMode: process.env.FAST_MODE === 'true',
  gasMultiplier: parseFloat(process.env.GAS_MULTIPLIER || '1.2'),
  
  // Logging & Alerts
  logLevel: process.env.LOG_LEVEL || 'info',
  enableTelegramAlerts: process.env.ENABLE_TELEGRAM_ALERTS === 'true',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  sendWatchAlerts: process.env.SEND_WATCH_ALERTS === 'true',
  sendTradeAlerts: process.env.SEND_TRADE_ALERTS === 'true',
  sendProfitAlerts: process.env.SEND_PROFIT_ALERTS === 'true',
};

// Validation
export function validateConfig() {
  const errors = [];
  
  if (!config.wsRpc) {
    errors.push('WS_RPC is required');
  }
  
  if (!config.privateKey) {
    errors.push('PRIVATE_KEY is required');
  }
  
  // START_WATCHED is optional in controller mode
  if (config.startWatched && !ethers.isAddress(config.startWatched)) {
    errors.push('START_WATCHED is not a valid Ethereum address');
  }
  
  if (config.enableTelegramAlerts && (!config.telegramBotToken || !config.telegramChatId)) {
    errors.push('Telegram alerts enabled but TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
  
  return true;
}
