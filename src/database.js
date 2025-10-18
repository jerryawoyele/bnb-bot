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
  constructor(dbPath = null) {
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
    
    this.initializeFiles();
  }

  initializeTables() {
    // Logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
    `);

    // Trades table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        type TEXT NOT NULL,
        token TEXT NOT NULL,
        amount TEXT NOT NULL,
        tx_hash TEXT,
        success INTEGER NOT NULL,
        error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_trades_token ON trades(token);
    `);

    // Positions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL UNIQUE,
        buy_price TEXT NOT NULL,
        buy_amount_bnb TEXT NOT NULL,
        token_amount TEXT NOT NULL,
        tx_hash TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        closed INTEGER DEFAULT 0,
        close_timestamp TEXT,
        close_tx_hash TEXT,
        profit_loss TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_positions_token ON positions(token);
      CREATE INDEX IF NOT EXISTS idx_positions_closed ON positions(closed);
    `);

    // Stats history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stats_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        trades_executed INTEGER DEFAULT 0,
        trades_failed INTEGER DEFAULT 0,
        trades_filtered INTEGER DEFAULT 0,
        open_positions INTEGER DEFAULT 0,
        take_profit_executed INTEGER DEFAULT 0,
        wallet_switches INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_stats_timestamp ON stats_history(timestamp DESC);
    `);

    console.log('✅ Database initialized');
  }

  // ============ LOGS ============
  
  insertLog(level, message, data = null) {
    const stmt = this.db.prepare(`
      INSERT INTO logs (timestamp, level, message, data)
      VALUES (?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        new Date().toISOString(),
        level,
        message,
        data ? JSON.stringify(data) : null
      );
    } catch (error) {
      console.error('Failed to insert log:', error.message);
    }
  }

  getLogs(limit = 500, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT * FROM logs
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(limit, offset);
    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      level: row.level,
      message: row.message,
      data: row.data ? JSON.parse(row.data) : null
    }));
  }

  getRecentLogs(limit = 100) {
    return this.getLogs(limit, 0);
  }

  clearOldLogs(daysToKeep = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const stmt = this.db.prepare(`
      DELETE FROM logs
      WHERE created_at < ?
    `);
    
    const result = stmt.run(cutoffDate.toISOString());
    return result.changes;
  }

  // ============ TRADES ============
  
  insertTrade(trade) {
    const stmt = this.db.prepare(`
      INSERT INTO trades (timestamp, type, token, amount, tx_hash, success, error)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        trade.timestamp || new Date().toISOString(),
        trade.type,
        trade.token,
        trade.amount,
        trade.txHash || null,
        trade.success ? 1 : 0,
        trade.error || null
      );
    } catch (error) {
      console.error('Failed to insert trade:', error.message);
    }
  }

  getTrades(limit = 100, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT * FROM trades
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(limit, offset);
  }

  getTradesByToken(token, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM trades
      WHERE token = ?
      ORDER BY id DESC
      LIMIT ?
    `);
    
    return stmt.all(token, limit);
  }

  // ============ POSITIONS ============
  
  insertPosition(position) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO positions 
      (token, buy_price, buy_amount_bnb, token_amount, tx_hash, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        position.token,
        position.buyPrice,
        position.buyAmountBnb,
        position.tokenAmount,
        position.txHash,
        position.timestamp || new Date().toISOString()
      );
    } catch (error) {
      console.error('Failed to insert position:', error.message);
    }
  }

  getOpenPositions() {
    const stmt = this.db.prepare(`
      SELECT * FROM positions
      WHERE closed = 0
      ORDER BY id DESC
    `);
    
    return stmt.all();
  }

  closePosition(token, closeTxHash, profitLoss) {
    const stmt = this.db.prepare(`
      UPDATE positions
      SET closed = 1,
          close_timestamp = ?,
          close_tx_hash = ?,
          profit_loss = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE token = ?
    `);
    
    try {
      stmt.run(
        new Date().toISOString(),
        closeTxHash,
        profitLoss,
        token
      );
    } catch (error) {
      console.error('Failed to close position:', error.message);
    }
  }

  getAllPositions(limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM positions
      ORDER BY id DESC
      LIMIT ?
    `);
    
    return stmt.all(limit);
  }

  // ============ STATS ============
  
  insertStats(stats) {
    const stmt = this.db.prepare(`
      INSERT INTO stats_history 
      (timestamp, trades_executed, trades_failed, trades_filtered, 
       open_positions, take_profit_executed, wallet_switches)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      stmt.run(
        new Date().toISOString(),
        stats.tradesExecuted || 0,
        stats.tradesFailed || 0,
        stats.tradesFiltered || 0,
        stats.openPositions || 0,
        stats.takeProfitExecuted || 0,
        stats.walletSwitches || 0
      );
    } catch (error) {
      console.error('Failed to insert stats:', error.message);
    }
  }

  getLatestStats() {
    const stmt = this.db.prepare(`
      SELECT * FROM stats_history
      ORDER BY id DESC
      LIMIT 1
    `);
    
    return stmt.get();
  }

  getStatsHistory(hours = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);
    
    const stmt = this.db.prepare(`
      SELECT * FROM stats_history
      WHERE created_at > ?
      ORDER BY id DESC
    `);
    
    return stmt.all(cutoffDate.toISOString());
  }

  // ============ UTILITY ============
  
  getStats() {
    const stmt = this.db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM logs) as total_logs,
        (SELECT COUNT(*) FROM trades) as total_trades,
        (SELECT COUNT(*) FROM positions WHERE closed = 0) as open_positions,
        (SELECT COUNT(*) FROM positions WHERE closed = 1) as closed_positions
    `);
    
    return stmt.get();
  }

  close() {
    this.db.close();
  }

  backup(backupPath) {
    return this.db.backup(backupPath);
  }
}
