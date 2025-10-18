import { config } from './config.js';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = LOG_LEVELS[config.logLevel] || LOG_LEVELS.info;

// API broadcast hook (set from main after API initialization)
let apiBroadcast = null;

// Database hook (set from main after database initialization)
let database = null;

function formatTimestamp() {
  return new Date().toISOString();
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= currentLogLevel;
}

function broadcastToAPI(level, message, data = null) {
  if (apiBroadcast) {
    try {
      apiBroadcast(level, message, data);
    } catch (error) {
      // Ignore broadcast errors to prevent recursive logging
    }
  }
}

export const logger = {
  setAPIBroadcast: (broadcastFn) => {
    apiBroadcast = broadcastFn;
  },

  setDatabase: (db) => {
    database = db;
  },

  debug: (message, data = null) => {
    if (shouldLog('debug')) {
      console.log(`[${formatTimestamp()}] [DEBUG] ${message}`, data || '');
      broadcastToAPI('debug', message, data);
      if (database) {
        // Support both MongoDB and JSON database
        if (database.insertLog) {
          database.insertLog('debug', message, data);
        }
      }
    }
  },
  
  info: (message, data = null) => {
    if (shouldLog('info')) {
      console.log(`[${formatTimestamp()}] [INFO] ${message}`, data || '');
      broadcastToAPI('info', message, data);
      if (database) {
        if (database.insertLog) {
          database.insertLog('info', message, data);
        }
      }
    }
  },
  
  warn: (message, data = null) => {
    if (shouldLog('warn')) {
      console.warn(`[${formatTimestamp()}] [WARN] ${message}`, data || '');
      broadcastToAPI('warn', message, data);
      if (database) {
        if (database.insertLog) {
          database.insertLog('warn', message, data);
        }
      }
    }
  },
  
  error: (message, error = null) => {
    if (shouldLog('error')) {
      console.error(`[${formatTimestamp()}] [ERROR] ${message}`);
      if (error) {
        console.error(error);
      }
      const errorData = error?.message || error;
      broadcastToAPI('error', message, errorData);
      if (database) {
        if (database.insertLog) {
          database.insertLog('error', message, errorData);
        }
      }
    }
  },
  
  trade: (action, details) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${formatTimestamp()}] 🔔 TRADE ${action}`);
    console.log(`${'='.repeat(60)}`);
    Object.entries(details).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log(`${'='.repeat(60)}\n`);
  },
  
  walletSwitch: (oldWallet, newWallet, reason) => {
    console.log(`\n${'*'.repeat(60)}`);
    console.log(`[${formatTimestamp()}] 🔄 WALLET SWITCH`);
    console.log(`${'*'.repeat(60)}`);
    console.log(`  From: ${oldWallet}`);
    console.log(`  To:   ${newWallet}`);
    console.log(`  Reason: ${reason}`);
    console.log(`${'*'.repeat(60)}\n`);
  },
};
