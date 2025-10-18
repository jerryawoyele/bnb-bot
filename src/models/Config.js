import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  // Trading Mode
  copyBuyOnly: { type: Boolean, default: true },
  copySell: { type: Boolean, default: false },
  
  // Take Profit Settings
  autoTakeProfitEnabled: { type: Boolean, default: true },
  takeProfitPercent: { type: Number, default: 100 }, // % price increase to trigger
  takeProfitBagPercent: { type: Number, default: 100 }, // % of bag to sell (NEW)
  
  // Buy/Sell Amounts
  buyAmountBnb: { type: Number, default: 0.01 }, // Fixed amount to buy (was maxBuyAmountBnb)
  
  // Gas Settings
  buyGasGwei: { type: Number, default: 10 }, // Buy gas fee (NEW)
  sellGasGwei: { type: Number, default: 10 }, // Sell gas fee (NEW)
  
  // Slippage Settings
  buySlippagePercent: { type: Number, default: 2 }, // Buy slippage (NEW)
  sellSlippagePercent: { type: Number, default: 2 }, // Sell slippage (NEW)
  
  // Market Cap Filter
  maxMarketCapUsd: { type: Number, default: 0 }, // 0 = unlimited (NEW)
  
  // Token Age Filter
  maxTokenAgeSeconds: { type: Number, default: 0 }, // 0 = unlimited (was maxTokenAgeHours)
  
  // Auto-Follow Settings
  autoFollowEnabled: { type: Boolean, default: true },
  minTransferAmountBnb: { type: Number, default: 0.1 },
  
  // Performance
  fastMode: { type: Boolean, default: true },
  gasMultiplier: { type: Number, default: 1.2 },
  
  // Blacklist
  blacklistedTokens: { type: [String], default: [] },
  allowedRouters: { type: [String], default: ['0x10ED43C718714eb63d5aA57B78B54704E256024E'] },
  
  // Legacy fields (for backwards compatibility)
  maxBuyAmountBnb: { type: Number }, // Deprecated
  slippagePercent: { type: Number }, // Deprecated
  maxGasPriceGwei: { type: Number }, // Deprecated
  minLiquidityUsd: { type: Number }, // Deprecated (REMOVED)
  maxTokenAgeHours: { type: Number }, // Deprecated
  oneTimeBuyPerToken: { type: Boolean }, // Deprecated (now always on)
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'system' }
}, {
  timestamps: true
});

export const Config = mongoose.model('Config', configSchema);
