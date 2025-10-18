import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  level: {
    type: String,
    required: true,
    enum: ['debug', 'info', 'warn', 'error']
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed
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
LogSchema.index({ sessionId: 1, timestamp: -1 });

export const Log = mongoose.model('Log', LogSchema);
