import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * JSON-Based Database Manager for Bot Data Persistence
 * Stores logs, trades, positions, and stats history in JSON files
 * No native dependencies required - pure JavaScript!
 */
export class BotDatabase {
  constructor() {
    // Create data directory if it doesn't exist
    const dataDir = join(__dirname, '..', 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // Initialize JSON database files
    this.dbDir = dataDir;
    this.logsFile = join(dataDir, 'logs.json');
    this.tradesFile = join(dataDir, 'trades.json');
    this.positionsFile = join(dataDir, 'positions.json');
    this.statsFile = join(dataDir, 'stats.json');
    
    // In-memory cache for fast access
    this.logs = [];
    this.trades = [];
    this.positions = [];
    this.stats = [];
    
    this.initializeFiles();
    console.log('✅ JSON Database initialized');
  }

  initializeFiles() {
    // Load or create logs file
    if (existsSync(this.logsFile)) {
      try {
        this.logs = JSON.parse(readFileSync(this.logsFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load logs.json, starting fresh');
        this.logs = [];
      }
    } else {
      this.logs = [];
      this.saveLogs();
    }

    // Load or create trades file
    if (existsSync(this.tradesFile)) {
      try {
        this.trades = JSON.parse(readFileSync(this.tradesFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load trades.json, starting fresh');
        this.trades = [];
      }
    } else {
      this.trades = [];
      this.saveTrades();
    }

    // Load or create positions file
    if (existsSync(this.positionsFile)) {
      try {
        this.positions = JSON.parse(readFileSync(this.positionsFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load positions.json, starting fresh');
        this.positions = [];
      }
    } else {
      this.positions = [];
      this.savePositions();
    }

    // Load or create stats file
    if (existsSync(this.statsFile)) {
      try {
        this.stats = JSON.parse(readFileSync(this.statsFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load stats.json, starting fresh');
        this.stats = [];
      }
    } else {
      this.stats = [];
      this.saveStats();
    }
  }

  // Save methods (sync to disk)
  saveLogs() {
    try {
      writeFileSync(this.logsFile, JSON.stringify(this.logs, null, 2));
    } catch (error) {
      console.error('Failed to save logs:', error.message);
    }
  }

  saveTrades() {
    try {
      writeFileSync(this.tradesFile, JSON.stringify(this.trades, null, 2));
    } catch (error) {
      console.error('Failed to save trades:', error.message);
    }
  }

  savePositions() {
    try {
      writeFileSync(this.positionsFile, JSON.stringify(this.positions, null, 2));
    } catch (error) {
      console.error('Failed to save positions:', error.message);
    }
  }

  saveStats() {
    try {
      writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.error('Failed to save stats:', error.message);
    }
  }

  // ============ LOGS ============
  
  insertLog(level, message, data = null) {
    const log = {
      id: this.logs.length + 1,
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      data: data,
      created_at: new Date().toISOString()
    };
    
    this.logs.push(log);
    
    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // Save every 10 logs to reduce disk writes
    if (this.logs.length % 10 === 0) {
      this.saveLogs();
    }
  }

  getLogs(limit = 500, offset = 0) {
    const start = Math.max(0, this.logs.length - offset - limit);
    const end = this.logs.length - offset;
    return this.logs.slice(start, end).reverse();
  }

  getRecentLogs(limit = 100) {
    return this.logs.slice(-limit);
  }

  clearOldLogs(daysToKeep = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const before = this.logs.length;
    this.logs = this.logs.filter(log => new Date(log.created_at) > cutoffDate);
    const removed = before - this.logs.length;
    
    if (removed > 0) {
      this.saveLogs();
    }
    
    return removed;
  }

  // ============ TRADES ============
  
  insertTrade(trade) {
    const tradeRecord = {
      id: this.trades.length + 1,
      timestamp: trade.timestamp || new Date().toISOString(),
      type: trade.type,
      token: trade.token,
      amount: trade.amount,
      tx_hash: trade.txHash || null,
      success: trade.success ? 1 : 0,
      error: trade.error || null,
      created_at: new Date().toISOString()
    };
    
    this.trades.push(tradeRecord);
    this.saveTrades();
  }

  getTrades(limit = 100, offset = 0) {
    const start = Math.max(0, this.trades.length - offset - limit);
    const end = this.trades.length - offset;
    return this.trades.slice(start, end).reverse();
  }

  getTradesByToken(token, limit = 50) {
    return this.trades
      .filter(t => t.token.toLowerCase() === token.toLowerCase())
      .slice(-limit)
      .reverse();
  }

  // ============ POSITIONS ============
  
  insertPosition(position) {
    const existing = this.positions.findIndex(p => p.token.toLowerCase() === position.token.toLowerCase());
    
    const positionRecord = {
      id: existing >= 0 ? this.positions[existing].id : this.positions.length + 1,
      token: position.token,
      buy_price: position.buyPrice,
      buy_amount_bnb: position.buyAmountBnb,
      token_amount: position.tokenAmount,
      tx_hash: position.txHash,
      timestamp: position.timestamp || new Date().toISOString(),
      closed: 0,
      close_timestamp: null,
      close_tx_hash: null,
      profit_loss: null,
      created_at: existing >= 0 ? this.positions[existing].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (existing >= 0) {
      this.positions[existing] = positionRecord;
    } else {
      this.positions.push(positionRecord);
    }
    
    this.savePositions();
  }

  getOpenPositions() {
    return this.positions.filter(p => p.closed === 0);
  }

  closePosition(token, closeTxHash, profitLoss) {
    const position = this.positions.find(p => p.token.toLowerCase() === token.toLowerCase());
    
    if (position) {
      position.closed = 1;
      position.close_timestamp = new Date().toISOString();
      position.close_tx_hash = closeTxHash;
      position.profit_loss = profitLoss;
      position.updated_at = new Date().toISOString();
      
      this.savePositions();
    }
  }

  getAllPositions(limit = 100) {
    return this.positions.slice(-limit).reverse();
  }

  // ============ STATS ============
  
  insertStats(stats) {
    const statsRecord = {
      id: this.stats.length + 1,
      timestamp: new Date().toISOString(),
      trades_executed: stats.tradesExecuted || 0,
      trades_failed: stats.tradesFailed || 0,
      trades_filtered: stats.tradesFiltered || 0,
      open_positions: stats.openPositions || 0,
      take_profit_executed: stats.takeProfitExecuted || 0,
      wallet_switches: stats.walletSwitches || 0,
      created_at: new Date().toISOString()
    };
    
    this.stats.push(statsRecord);
    
    // Keep only last 1000 stats records
    if (this.stats.length > 1000) {
      this.stats = this.stats.slice(-1000);
    }
    
    this.saveStats();
  }

  getLatestStats() {
    return this.stats.length > 0 ? this.stats[this.stats.length - 1] : null;
  }

  getStatsHistory(hours = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);
    
    return this.stats.filter(s => new Date(s.created_at) > cutoffDate);
  }

  // ============ UTILITY ============
  
  getStats() {
    return {
      total_logs: this.logs.length,
      total_trades: this.trades.length,
      open_positions: this.positions.filter(p => p.closed === 0).length,
      closed_positions: this.positions.filter(p => p.closed === 1).length
    };
  }

  close() {
    // Save all data before closing
    this.saveLogs();
    this.saveTrades();
    this.savePositions();
    this.saveStats();
    console.log('💾 Database saved and closed');
  }

  backup(backupDir) {
    try {
      if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      writeFileSync(join(backupDir, `logs-${timestamp}.json`), JSON.stringify(this.logs, null, 2));
      writeFileSync(join(backupDir, `trades-${timestamp}.json`), JSON.stringify(this.trades, null, 2));
      writeFileSync(join(backupDir, `positions-${timestamp}.json`), JSON.stringify(this.positions, null, 2));
      writeFileSync(join(backupDir, `stats-${timestamp}.json`), JSON.stringify(this.stats, null, 2));
      
      console.log(`✅ Database backed up to ${backupDir}`);
      return true;
    } catch (error) {
      console.error('Failed to backup database:', error.message);
      return false;
    }
  }
}
