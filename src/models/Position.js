import mongoose from 'mongoose';

const PositionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true
  },
  buyPrice: {
    type: String,
    required: true
  },
  buyAmountBnb: {
    type: String,
    required: true
  },
  tokenAmount: {
    type: String,
    required: true
  },
  txHash: {
    type: String,
    required: true
  },
  closed: {
    type: Boolean,
    default: false
  },
  closeTimestamp: {
    type: Date
  },
  closeTxHash: {
    type: String
  },
  profitLoss: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
PositionSchema.index({ sessionId: 1, closed: 1 });
PositionSchema.index({ token: 1 });

export const Position = mongoose.model('Position', PositionSchema);
