import mongoose from 'mongoose';

const TradeSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['BUY', 'SELL']
  },
  token: {
    type: String,
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  txHash: {
    type: String
  },
  success: {
    type: Boolean,
    required: true
  },
  error: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
TradeSchema.index({ sessionId: 1, timestamp: -1 });
TradeSchema.index({ token: 1 });

export const Trade = mongoose.model('Trade', TradeSchema);
