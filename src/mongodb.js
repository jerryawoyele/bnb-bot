import mongoose from 'mongoose';
import { Session } from './models/Session.js';
import { Log } from './models/Log.js';
import { Trade } from './models/Trade.js';
import { Position } from './models/Position.js';
import { Config } from './models/Config.js';

/**
 * MongoDB Database Manager for Bot Data Persistence
 * Stores sessions, logs, trades, and positions in MongoDB
 */
export class MongoDatabase {
  constructor(mongoUri) {
    this.mongoUri = mongoUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/bnb-copy-bot';
    this.currentSessionId = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      await mongoose.connect(this.mongoUri);
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('💾 MongoDB disconnected');
    } catch (error) {
      console.error('Failed to disconnect MongoDB:', error.message);
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============ SESSION MANAGEMENT ============

  async createSession(watchedWallet, botWallet, config) {
    try {
      this.currentSessionId = this.generateSessionId();
      
      const session = new Session({
        sessionId: this.currentSessionId,
        watchedWallet,
        botWallet,
        status: 'active',
        config,
        startTime: new Date()
      });

      await session.save();
      console.log(`✅ Session created: ${this.currentSessionId}`);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error.message);
      throw error;
    }
  }

  async endSession() {
    if (!this.currentSessionId) return;

    try {
      await Session.findOneAndUpdate(
        { sessionId: this.currentSessionId },
        { 
          status: 'stopped',
          endTime: new Date()
        }
      );
      console.log(`✅ Session ended: ${this.currentSessionId}`);
      this.currentSessionId = null;
    } catch (error) {
      console.error('Failed to end session:', error.message);
    }
  }

  async getCurrentSession() {
    if (!this.currentSessionId) return null;

    try {
      return await Session.findOne({ sessionId: this.currentSessionId });
    } catch (error) {
      console.error('Failed to get current session:', error.message);
      return null;
    }
  }

  async getAllSessions(limit = 50) {
    try {
      return await Session.find()
        .sort({ startTime: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Failed to get sessions:', error.message);
      return [];
    }
  }

  async getSessionById(sessionId) {
    try {
      return await Session.findOne({ sessionId });
    } catch (error) {
      console.error('Failed to get session:', error.message);
      return null;
    }
  }

  async deleteSession(sessionId) {
    try {
      // Delete all data associated with this session
      const [sessionResult, logsResult, tradesResult, positionsResult] = await Promise.all([
        Session.deleteOne({ sessionId }),
        Log.deleteMany({ sessionId }),
        Trade.deleteMany({ sessionId }),
        Position.deleteMany({ sessionId })
      ]);

      console.log(`✅ Deleted session ${sessionId}:`);
      console.log(`   - Session: ${sessionResult.deletedCount}`);
      console.log(`   - Logs: ${logsResult.deletedCount}`);
      console.log(`   - Trades: ${tradesResult.deletedCount}`);
      console.log(`   - Positions: ${positionsResult.deletedCount}`);

      return {
        success: true,
        deleted: {
          session: sessionResult.deletedCount,
          logs: logsResult.deletedCount,
          trades: tradesResult.deletedCount,
          positions: positionsResult.deletedCount
        }
      };
    } catch (error) {
      console.error('Failed to delete session:', error.message);
      throw error;
    }
  }

  async updateSessionStats(stats) {
    if (!this.currentSessionId) return;

    try {
      await Session.findOneAndUpdate(
        { sessionId: this.currentSessionId },
        { stats }
      );
    } catch (error) {
      console.error('Failed to update session stats:', error.message);
    }
  }

  // ============ LOGS ============

  async insertLog(level, message, data = null) {
    if (!this.currentSessionId) return;

    try {
      const log = new Log({
        sessionId: this.currentSessionId,
        level,
        message,
        data,
        timestamp: new Date()
      });

      await log.save();
    } catch (error) {
      console.error('Failed to insert log:', error.message);
    }
  }

  async getLogs(sessionId = null, limit = 500) {
    try {
      const query = sessionId ? { sessionId } : { sessionId: this.currentSessionId };
      
      return await Log.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Failed to get logs:', error.message);
      return [];
    }
  }

  async getRecentLogs(limit = 100) {
    if (!this.currentSessionId) return [];

    try {
      return await Log.find({ sessionId: this.currentSessionId })
        .sort({ timestamp: 1 })
        .limit(limit);
    } catch (error) {
      console.error('Failed to get recent logs:', error.message);
      return [];
    }
  }

  async getAllLogs() {
    try {
      // Get ALL logs from ALL sessions, sorted by timestamp
      return await Log.find({})
        .sort({ timestamp: 1 })
        .lean();
    } catch (error) {
      console.error('Failed to get all logs:', error.message);
      return [];
    }
  }

  async clearAllLogs() {
    try {
      const result = await Log.deleteMany({});
      console.log(`✅ Cleared ${result.deletedCount} logs from database`);
      return result;
    } catch (error) {
      console.error('Failed to clear logs:', error.message);
      throw error;
    }
  }

  // ============ TRADES ============

  async insertTrade(trade) {
    if (!this.currentSessionId) return;

    try {
      const tradeDoc = new Trade({
        sessionId: this.currentSessionId,
        type: trade.type,
        token: trade.token,
        amount: trade.amount,
        txHash: trade.txHash || null,
        success: trade.success,
        error: trade.error || null,
        timestamp: new Date()
      });

      await tradeDoc.save();
    } catch (error) {
      console.error('Failed to insert trade:', error.message);
    }
  }

  async getTrades(sessionId = null, limit = 100) {
    try {
      const query = sessionId ? { sessionId } : { sessionId: this.currentSessionId };
      
      return await Trade.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Failed to get trades:', error.message);
      return [];
    }
  }

  // ============ POSITIONS ============

  async insertPosition(position) {
    if (!this.currentSessionId) return;

    try {
      const positionDoc = new Position({
        sessionId: this.currentSessionId,
        token: position.token,
        buyPrice: position.buyPrice,
        buyAmountBnb: position.buyAmountBnb,
        tokenAmount: position.tokenAmount,
        txHash: position.txHash,
        timestamp: new Date()
      });

      await positionDoc.save();
    } catch (error) {
      console.error('Failed to insert position:', error.message);
    }
  }

  async getOpenPositions(sessionId = null) {
    try {
      const query = sessionId 
        ? { sessionId, closed: false } 
        : { sessionId: this.currentSessionId, closed: false };
      
      return await Position.find(query).sort({ timestamp: -1 });
    } catch (error) {
      console.error('Failed to get open positions:', error.message);
      return [];
    }
  }

  async closePosition(token, closeTxHash, profitLoss) {
    if (!this.currentSessionId) return;

    try {
      await Position.findOneAndUpdate(
        { sessionId: this.currentSessionId, token, closed: false },
        {
          closed: true,
          closeTimestamp: new Date(),
          closeTxHash,
          profitLoss
        }
      );
    } catch (error) {
      console.error('Failed to close position:', error.message);
    }
  }

  async getAllPositions(sessionId = null, limit = 100) {
    try {
      const query = sessionId ? { sessionId } : { sessionId: this.currentSessionId };
      
      return await Position.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Failed to get positions:', error.message);
      return [];
    }
  }

  // ============ UTILITY ============

  async getStats(sessionId = null) {
    try {
      const query = sessionId ? { sessionId } : { sessionId: this.currentSessionId };
      
      const [logs, trades, openPositions, closedPositions] = await Promise.all([
        Log.countDocuments(query),
        Trade.countDocuments(query),
        Position.countDocuments({ ...query, closed: false }),
        Position.countDocuments({ ...query, closed: true })
      ]);

      return {
        total_logs: logs,
        total_trades: trades,
        open_positions: openPositions,
        closed_positions: closedPositions
      };
    } catch (error) {
      console.error('Failed to get stats:', error.message);
      return {
        total_logs: 0,
        total_trades: 0,
        open_positions: 0,
        closed_positions: 0
      };
    }
  }

  // ============ CONFIG MANAGEMENT ============

  async getConfig() {
    try {
      // Get the most recent config or create default
      let config = await Config.findOne().sort({ updatedAt: -1 });
      
      if (!config) {
        // Create default config if none exists
        config = await Config.create({
          copyBuyOnly: true,
          copySell: false,
          autoTakeProfitEnabled: true,
          takeProfitPercent: 100,
          maxBuyAmountBnb: 0.5,
          slippagePercent: 2,
          maxGasPriceGwei: 10,
          minLiquidityUsd: 10000,
          maxTokenAgeHours: 72,
          oneTimeBuyPerToken: true,
          autoFollowEnabled: true,
          minTransferAmountBnb: 0.1,
          fastMode: true,
          gasMultiplier: 1.2,
          blacklistedTokens: [],
          allowedRouters: ['0x10ED43C718714eb63d5aA57B78B54704E256024E']
        });
      }

      // Return plain object
      return config.toObject();
    } catch (error) {
      console.error('Failed to get config:', error.message);
      return null;
    }
  }

  async updateConfig(updates) {
    try {
      // Update the most recent config or create new
      let config = await Config.findOne().sort({ updatedAt: -1 });
      
      if (!config) {
        config = new Config(updates);
      } else {
        Object.assign(config, updates);
      }
      
      config.lastUpdated = new Date();
      await config.save();
      
      return config.toObject();
    } catch (error) {
      console.error('Failed to update config:', error.message);
      throw error;
    }
  }

  close() {
    return this.disconnect();
  }
}
