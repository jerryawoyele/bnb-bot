import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { EventEmitter } from 'events';

/**
 * Enhanced API Server with Bot Control
 * Manages bot start/stop, session viewing, and real-time updates
 */
export class ControllerAPI extends EventEmitter {
  constructor(botController, mongoDatabase) {
    super();
    this.botController = botController;
    this.database = mongoDatabase;
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
      }
    });
    
    // Give bot controller access to API
    if (this.botController) {
      this.botController.api = this;
    }
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
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
    // ============ HEALTH & STATUS ============
    
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: Date.now(),
        dbConnected: this.database?.isConnected || false
      });
    });

    this.app.get('/api/bot/status', (req, res) => {
      const status = this.botController.getStatus();
      res.json(status);
    });

    // ============ BOT CONTROL ============
    
    // Start bot with smart detection
    this.app.post('/api/bot/start/auto', async (req, res) => {
      try {
        const result = await this.botController.startWithSmartDetection();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Start bot with specific wallet
    this.app.post('/api/bot/start', async (req, res) => {
      try {
        const { walletAddress } = req.body;
        
        if (!walletAddress) {
          return res.status(400).json({ 
            success: false, 
            message: 'walletAddress is required' 
          });
        }

        const result = await this.botController.startWithWallet(walletAddress);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Stop bot
    this.app.post('/api/bot/stop', async (req, res) => {
      try {
        const result = await this.botController.stop();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // ============ SESSION MANAGEMENT ============
    
    // Get all sessions
    this.app.get('/api/sessions', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 50;
        const sessions = await this.database.getAllSessions(limit);
        res.json({ sessions });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get current session
    this.app.get('/api/sessions/current', async (req, res) => {
      try {
        const session = await this.database.getCurrentSession();
        res.json({ session });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get specific session
    this.app.get('/api/sessions/:sessionId', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const session = await this.database.getSessionById(sessionId);
        
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ session });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get session logs
    this.app.get('/api/sessions/:sessionId/logs', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit) || 500;
        const logs = await this.database.getLogs(sessionId, limit);
        res.json({ logs });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get session trades
    this.app.get('/api/sessions/:sessionId/trades', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        const trades = await this.database.getTrades(sessionId, limit);
        res.json({ trades });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get session positions
    this.app.get('/api/sessions/:sessionId/positions', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        const positions = await this.database.getAllPositions(sessionId, limit);
        res.json({ positions });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get session stats
    this.app.get('/api/sessions/:sessionId/stats', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const stats = await this.database.getStats(sessionId);
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Delete session and all related data
    this.app.delete('/api/sessions/:sessionId', async (req, res) => {
      try {
        const { sessionId } = req.params;
        await this.database.deleteSession(sessionId);
        res.json({ success: true, message: 'Session deleted successfully' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ============ CURRENT SESSION DATA ============
    
    // Get current logs
    this.app.get('/api/logs', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 500;
        const logs = await this.database.getLogs(null, limit);
        res.json({ logs });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get ALL logs from ALL sessions
    this.app.get('/api/logs/all', async (req, res) => {
      try {
        const logs = await this.database.getAllLogs();
        res.json({ logs });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Delete ALL logs from database
    this.app.delete('/api/logs/all', async (req, res) => {
      try {
        await this.database.clearAllLogs();
        res.json({ success: true, message: 'All logs cleared' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get current trades
    this.app.get('/api/trades', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 100;
        const trades = await this.database.getTrades(null, limit);
        res.json({ trades });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get current positions
    this.app.get('/api/positions', async (req, res) => {
      try {
        const positions = await this.database.getOpenPositions();
        res.json(positions);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get current stats
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.database.getStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get config
    this.app.get('/api/config', async (req, res) => {
      try {
        const config = await this.database.getConfig();
        res.json({
          triggerWallet: this.botController.triggerWallet,
          ...config
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Update config
    this.app.put('/api/config', async (req, res) => {
      try {
        const updatedConfig = await this.database.updateConfig(req.body);
        res.json({ success: true, config: updatedConfig });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Send bot status
      const status = this.botController.getStatus();
      socket.emit('botStatus', status);

      // Send recent logs if bot is running
      if (status.isRunning) {
        this.sendInitialData(socket);
      }

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  async sendInitialData(socket) {
    try {
      // Send recent logs
      const recentLogs = await this.database.getRecentLogs(100);
      socket.emit('initialLogs', recentLogs);

      // Send positions
      const positions = await this.database.getOpenPositions();
      socket.emit('positions', positions);

      // Send stats
      const stats = await this.database.getStats();
      socket.emit('stats', stats);
    } catch (error) {
      console.error('Failed to send initial data:', error.message);
    }
  }

  // ============ REAL-TIME BROADCASTS ============

  async emitLog(level, message, data) {
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast to WebSocket clients
    this.io.emit('log', logEntry);
    
    // Persist to MongoDB immediately
    try {
      await this.database.insertLog(level, message, data);
    } catch (error) {
      console.error('Failed to persist log to MongoDB:', error.message);
    }
  }

  emitTrade(trade) {
    this.io.emit('trade', trade);
  }

  emitTransaction(tx) {
    this.io.emit('transaction', tx);
  }

  emitTakeProfit(data) {
    this.io.emit('takeProfit', data);
  }

  emitStats(stats) {
    this.io.emit('stats', stats);
  }

  emitPositions(positions) {
    this.io.emit('positions', positions);
  }

  emitBotStatus(status) {
    this.io.emit('botStatus', status);
  }

  // ============ SERVER CONTROL ============

  async start(port = 3001) {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer.listen(port, () => {
          console.log(`✅ API server running on port ${port}`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop() {
    return new Promise((resolve) => {
      this.httpServer.close(() => {
        console.log('API server stopped');
        resolve();
      });
    });
  }
}
