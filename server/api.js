import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { EventEmitter } from 'events';

/**
 * API Server for Copy-Trading Bot
 * Provides REST endpoints and WebSocket for real-time updates
 */
export class BotAPI extends EventEmitter {
  constructor(tracker, config, database = null) {
    super();
    this.tracker = tracker;
    this.config = config;
    this.database = database;
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'PATCH']
      }
    });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupBotListeners();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Bot status
    this.app.get('/api/status', async (req, res) => {
      try {
        const balance = await this.tracker.executor.getBnbBalance();
        res.json({
          running: true,
          watchedWallet: this.tracker.watchedWallet,
          botWallet: this.tracker.wallet.address,
          balance: balance,
          uptime: process.uptime(),
          config: {
            mode: this.config.copyBuyOnly ? 'BUY_ONLY' : 'BUY_SELL',
            takeProfitEnabled: this.config.autoTakeProfitEnabled,
            takeProfitPercent: this.config.takeProfitPercent,
            fastMode: this.config.fastMode,
            oneTimeBuy: this.config.oneTimeBuyPerToken
          }
        });
      } catch (error) {
        res.json({
          running: true,
          watchedWallet: this.tracker.watchedWallet,
          botWallet: this.tracker.wallet.address,
          balance: '0',
          uptime: process.uptime(),
          config: {
            mode: this.config.copyBuyOnly ? 'BUY_ONLY' : 'BUY_SELL',
            takeProfitEnabled: this.config.autoTakeProfitEnabled,
            takeProfitPercent: this.config.takeProfitPercent,
            fastMode: this.config.fastMode,
            oneTimeBuy: this.config.oneTimeBuyPerToken
          }
        });
      }
    });

    // Statistics
    this.app.get('/api/stats', (req, res) => {
      res.json(this.tracker.stats);
    });

    // Open positions
    this.app.get('/api/positions', (req, res) => {
      const positions = this.tracker.profitTracker.getPositions();
      res.json(positions);
    });

    // Configuration
    this.app.get('/api/config', (req, res) => {
      res.json({
        copyBuyOnly: this.config.copyBuyOnly,
        copySell: this.config.copySell,
        autoTakeProfitEnabled: this.config.autoTakeProfitEnabled,
        takeProfitPercent: this.config.takeProfitPercent,
        maxBuyAmountBnb: this.config.maxBuyAmountBnb,
        slippagePercent: this.config.slippagePercent,
        minLiquidityUsd: this.config.minLiquidityUsd,
        maxTokenAgeHours: this.config.maxTokenAgeHours,
        oneTimeBuyPerToken: this.config.oneTimeBuyPerToken,
        fastMode: this.config.fastMode,
        gasMultiplier: this.config.gasMultiplier,
        autoFollowEnabled: this.config.autoFollowEnabled
      });
    });

    // Update configuration (requires restart to take effect)
    this.app.patch('/api/config', (req, res) => {
      res.json({
        success: false,
        message: 'Configuration updates require bot restart. Please update .env file and restart.'
      });
    });

    // Wallet balance
    this.app.get('/api/wallet/balance', async (req, res) => {
      try {
        const balance = await this.tracker.executor.getBnbBalance();
        res.json({ balance, address: this.tracker.wallet.address });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Change watched wallet
    this.app.post('/api/wallet/watch', (req, res) => {
      const { address } = req.body;
      
      if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({ error: 'Invalid wallet address' });
      }

      const oldWallet = this.tracker.watchedWallet;
      this.tracker.watchedWallet = address.toLowerCase();
      
      // Emit event for WebSocket
      this.emit('walletChanged', { old: oldWallet, new: address });
      
      res.json({ success: true, watchedWallet: address });
    });

    // Get logs from database
    this.app.get('/api/logs', (req, res) => {
      if (!this.database) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const limit = parseInt(req.query.limit) || 500;
      const offset = parseInt(req.query.offset) || 0;
      
      try {
        const logs = this.database.getLogs(limit, offset);
        res.json({ logs, limit, offset });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get trades from database
    this.app.get('/api/trades', (req, res) => {
      if (!this.database) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      
      try {
        const trades = this.database.getTrades(limit, offset);
        res.json({ trades, limit, offset });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get database stats
    this.app.get('/api/database/stats', (req, res) => {
      if (!this.database) {
        return res.status(503).json({ error: 'Database not available' });
      }

      try {
        const stats = this.database.getStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Manual sell position
    this.app.post('/api/positions/:tokenAddress/sell', async (req, res) => {
      try {
        const { tokenAddress } = req.params;
        const position = this.tracker.profitTracker.positions.get(tokenAddress.toLowerCase());
        
        if (!position) {
          return res.status(404).json({ error: 'Position not found' });
        }

        // Create sell opportunity
        const opportunity = {
          tokenAddress,
          balance: position.tokenAmount,
          profitPercent: 0,
          buyValueBnb: position.buyAmountBnb,
          currentValueBnb: 0
        };

        const result = await this.tracker.profitTracker.executeTakeProfit(
          opportunity,
          this.tracker.executor,
          this.tracker.notificationService
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Trade history (last 50 trades)
    this.app.get('/api/history', (req, res) => {
      // This would require implementing trade history storage
      res.json({ trades: [] });
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Send initial data
      socket.emit('status', {
        running: true,
        watchedWallet: this.tracker.watchedWallet,
        botWallet: this.tracker.wallet.address
      });

      socket.emit('stats', this.tracker.stats);
      socket.emit('positions', this.tracker.profitTracker.getPositions());

      // Send recent logs from database
      if (this.database) {
        try {
          const recentLogs = this.database.getRecentLogs(100);
          socket.emit('initialLogs', recentLogs.reverse()); // Reverse to show oldest first
        } catch (error) {
          console.error('Failed to send initial logs:', error.message);
        }
      }

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  setupBotListeners() {
    // Listen to bot events and broadcast to WebSocket clients
    
    // Stats updates every 2 seconds for real-time feel
    setInterval(() => {
      this.io.emit('stats', this.tracker.stats);
    }, 2000);

    // Position updates every 3 seconds for real-time feel
    setInterval(() => {
      this.io.emit('positions', this.tracker.profitTracker.getPositions());
    }, 3000);

    // Status updates every 5 seconds (includes balance, uptime, etc)
    setInterval(async () => {
      try {
        const balance = await this.tracker.executor.getBnbBalance();
        this.io.emit('status', {
          running: true,
          watchedWallet: this.tracker.watchedWallet,
          botWallet: this.tracker.wallet.address,
          balance: balance,
          uptime: process.uptime(),
          config: {
            mode: this.config.copyBuyOnly ? 'BUY_ONLY' : 'BUY_SELL',
            takeProfitEnabled: this.config.autoTakeProfitEnabled,
            takeProfitPercent: this.config.takeProfitPercent,
            fastMode: this.config.fastMode,
            oneTimeBuy: this.config.oneTimeBuyPerToken
          }
        });
      } catch (error) {
        // Ignore errors but still send status without balance
        this.io.emit('status', {
          running: true,
          watchedWallet: this.tracker.watchedWallet,
          botWallet: this.tracker.wallet.address,
          balance: '0',
          uptime: process.uptime(),
          config: {
            mode: this.config.copyBuyOnly ? 'BUY_ONLY' : 'BUY_SELL',
            takeProfitEnabled: this.config.autoTakeProfitEnabled,
            takeProfitPercent: this.config.takeProfitPercent,
            fastMode: this.config.fastMode,
            oneTimeBuy: this.config.oneTimeBuyPerToken
          }
        });
      }
    }, 5000);

    // Wallet change events
    this.on('walletChanged', (data) => {
      this.io.emit('walletChanged', data);
    });
  }

  // Method to emit custom events from bot
  emitTrade(trade) {
    this.io.emit('trade', trade);
  }

  emitTransaction(tx) {
    this.io.emit('transaction', tx);
  }

  emitTakeProfit(data) {
    this.io.emit('takeProfit', data);
  }

  emitLog(level, message, data = null) {
    this.io.emit('log', {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  start(port = 3001) {
    return new Promise((resolve) => {
      this.httpServer.listen(port, () => {
        console.log(`🌐 API Server running on http://localhost:${port}`);
        console.log(`📡 WebSocket ready for connections`);
        resolve();
      });
    });
  }

  stop() {
    this.httpServer.close();
    this.io.close();
  }
}
