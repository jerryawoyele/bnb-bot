import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  watchedWallet: {
    type: String,
    required: true
  },
  botWallet: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'stopped', 'completed'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  config: {
    type: mongoose.Schema.Types.Mixed
  },
  stats: {
    tradesExecuted: { type: Number, default: 0 },
    tradesFailed: { type: Number, default: 0 },
    tradesFiltered: { type: Number, default: 0 },
    openPositions: { type: Number, default: 0 },
    takeProfitExecuted: { type: Number, default: 0 },
    walletSwitches: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

export const Session = mongoose.model('Session', SessionSchema);
