import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  // Trading Mode
  copyBuyOnly: { type: Boolean, default: true },
  copySell: { type: Boolean, default: false },
  autoTakeProfitEnabled: { type: Boolean, default: true },
  takeProfitPercent: { type: Number, default: 100 },
  
  // Risk Management
  maxBuyAmountBnb: { type: Number, default: 0.5 },
  slippagePercent: { type: Number, default: 2 },
  maxGasPriceGwei: { type: Number, default: 10 },
  minLiquidityUsd: { type: Number, default: 10000 },
  maxTokenAgeHours: { type: Number, default: 72 },
  
  // Filters
  oneTimeBuyPerToken: { type: Boolean, default: true },
  autoFollowEnabled: { type: Boolean, default: true },
  minTransferAmountBnb: { type: Number, default: 0.1 },
  
  // Performance
  fastMode: { type: Boolean, default: true },
  gasMultiplier: { type: Number, default: 1.2 },
  
  // Blacklist
  blacklistedTokens: { type: [String], default: [] },
  allowedRouters: { type: [String], default: ['0x10ED43C718714eb63d5aA57B78B54704E256024E'] },
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'system' }
}, {
  timestamps: true
});

export const Config = mongoose.model('Config', configSchema);
