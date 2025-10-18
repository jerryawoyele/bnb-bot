# 💾 Database Integration

## ✅ What's Been Added

Your bot now has **persistent data storage** using SQLite database!

### Features

✅ **Logs Persistence** - All logs saved to database  
✅ **Trades History** - Every trade recorded  
✅ **Positions Tracking** - Open and closed positions stored  
✅ **Stats History** - Historical performance data  
✅ **Fast Retrieval** - Indexed for quick queries  
✅ **Real-Time Updates** - Database + WebSocket combo  
✅ **Automatic Cleanup** - Old logs auto-deleted  

---

## 🗄️ Database Structure

### Tables Created

**1. logs** - All bot logs
```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY,
  timestamp TEXT,
  level TEXT,          -- DEBUG, INFO, WARN, ERROR
  message TEXT,
  data TEXT,           -- JSON data if any
  created_at DATETIME
);
```

**2. trades** - Trading history
```sql
CREATE TABLE trades (
  id INTEGER PRIMARY KEY,
  timestamp TEXT,
  type TEXT,           -- BUY, SELL
  token TEXT,
  amount TEXT,
  tx_hash TEXT,
  success INTEGER,     -- 1 = success, 0 = failed
  error TEXT,
  created_at DATETIME
);
```

**3. positions** - Position tracking
```sql
CREATE TABLE positions (
  id INTEGER PRIMARY KEY,
  token TEXT UNIQUE,
  buy_price TEXT,
  buy_amount_bnb TEXT,
  token_amount TEXT,
  tx_hash TEXT,
  timestamp TEXT,
  closed INTEGER,      -- 0 = open, 1 = closed
  close_timestamp TEXT,
  close_tx_hash TEXT,
  profit_loss TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
```

**4. stats_history** - Performance over time
```sql
CREATE TABLE stats_history (
  id INTEGER PRIMARY KEY,
  timestamp TEXT,
  trades_executed INTEGER,
  trades_failed INTEGER,
  trades_filtered INTEGER,
  open_positions INTEGER,
  take_profit_executed INTEGER,
  wallet_switches INTEGER,
  created_at DATETIME
);
```

---

## 📂 Database Location

```
BNB Bot/
├── data/
│   └── bot.db          ← SQLite database file
├── src/
│   └── database.js     ← Database manager
└── ...
```

**Database File:** `data/bot.db`  
**Automatically created** on first run

---

## 🚀 How It Works

### 1. **Logging Flow**

```
Bot logs something
    ↓
logger.info('message')
    ↓
├─→ Console output
├─→ Save to database (database.insertLog)
└─→ Broadcast to dashboard (WebSocket)
```

### 2. **Initial Load**

```
User opens dashboard
    ↓
WebSocket connects
    ↓
Server sends last 100 logs from database
    ↓
Dashboard displays historical logs
    ↓
New logs stream in real-time
```

### 3. **Data Persistence**

```
Bot restarts
    ↓
All historical data intact:
  ✓ Previous logs
  ✓ Trade history
  ✓ Position records
  ✓ Performance stats
```

---

## 🔌 New API Endpoints

### Get Logs
```http
GET /api/logs?limit=500&offset=0
```

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "timestamp": "2025-10-18T00:42:15.123Z",
      "level": "info",
      "message": "Bot started",
      "data": null
    }
  ],
  "limit": 500,
  "offset": 0
}
```

### Get Trades
```http
GET /api/trades?limit=100&offset=0
```

**Response:**
```json
{
  "trades": [
    {
      "id": 1,
      "timestamp": "2025-10-18T00:45:30.000Z",
      "type": "BUY",
      "token": "0x123...",
      "amount": "0.5",
      "tx_hash": "0xabc...",
      "success": 1,
      "error": null
    }
  ],
  "limit": 100,
  "offset": 0
}
```

### Get Database Stats
```http
GET /api/database/stats
```

**Response:**
```json
{
  "total_logs": 1523,
  "total_trades": 45,
  "open_positions": 3,
  "closed_positions": 42
}
```

---

## ⚡ Real-Time Updates Improved

### Before Database
- Logs lost on restart
- No historical data
- Dashboard shows only new logs
- Stats reset on restart

### After Database
- ✅ All logs persist
- ✅ Historical data available
- ✅ Dashboard loads 100 recent logs on open
- ✅ New logs stream in real-time
- ✅ Stats survive restarts
- ✅ Trade history preserved

---

## 📊 Performance

### Database Performance
- **SQLite** - Embedded, no external server needed
- **WAL mode** - Write-Ahead Logging for better concurrency
- **Indexed** - Fast queries on timestamps and tokens
- **Lightweight** - Minimal overhead
- **Fast reads** - < 1ms for most queries

### Storage Impact
- **Logs:** ~200 bytes per log
- **Trades:** ~150 bytes per trade
- **Positions:** ~200 bytes per position
- **1000 logs** = ~200KB
- **10,000 logs** = ~2MB

### Auto-Cleanup
Logs older than **7 days** automatically deleted (configurable)

---

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd "C:\Users\Jerry A\Desktop\BNB Bot"
npm install
```

This installs **better-sqlite3** (the database package)

### 2. Start Bot

```bash
npm start
```

You'll see:
```
💾 Initializing database...
✅ Database initialized
✅ Database ready
```

### 3. Database Created Automatically

The `data/bot.db` file is created on first run.

---

## 🎯 Dashboard Integration

### Logs Tab - Now Better!

**Features:**
- ✅ Loads last 100 logs from database on open
- ✅ New logs stream in real-time
- ✅ 500 logs kept in memory
- ✅ Survives page refresh (reloads from DB)
- ✅ Fast and responsive

**What You'll See:**

1. Open Logs tab
2. Instantly see last 100 historical logs
3. Watch new logs stream in
4. Page refresh = reload historical logs
5. Never lose log history again!

---

## 📈 Usage Examples

### Check Database Stats

```bash
curl http://localhost:3001/api/database/stats
```

**Output:**
```json
{
  "total_logs": 1523,
  "total_trades": 45,
  "open_positions": 3,
  "closed_positions": 42
}
```

### Get Recent Logs

```bash
curl http://localhost:3001/api/logs?limit=10
```

### Get Trade History

```bash
curl http://localhost:3001/api/trades?limit=20
```

---

## 🗑️ Database Management

### View Database

Use any SQLite viewer:
- **DB Browser for SQLite** (GUI)
- **SQLite CLI**
- **VS Code Extensions**

### Backup Database

```bash
# Copy the database file
cp data/bot.db data/bot_backup.db
```

### Clear Old Logs

Automatic cleanup happens on bot start (logs > 7 days old).

Manual cleanup:
```javascript
database.clearOldLogs(7); // Keep last 7 days
```

### Reset Database

```bash
# Stop bot
# Delete database file
rm data/bot.db
# Start bot (creates new database)
npm start
```

---

## 🔧 Configuration

### Change Auto-Cleanup Period

Edit `src/database.js`:

```javascript
clearOldLogs(daysToKeep = 7) {  // Change 7 to any number
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  // ...
}
```

### Change Log Limit

Edit `server/api.js`:

```javascript
const recentLogs = this.database.getRecentLogs(100); // Change 100
```

### Disable Database

Remove database initialization from `src/index.js`:

```javascript
// Comment out:
// const database = new BotDatabase();
// logger.setDatabase(database);
```

---

## 🐛 Troubleshooting

### Database not created
**Problem:** No `data/bot.db` file

**Solution:**
1. Check file permissions
2. Ensure `data/` directory can be created
3. Check bot logs for database errors

### "Database locked" error
**Problem:** Multiple processes accessing database

**Solution:**
1. Stop all bot instances
2. Restart bot
3. WAL mode should prevent this

### Logs not loading
**Problem:** Dashboard logs tab empty

**Solution:**
1. Check bot is running
2. Check WebSocket connection (header shows "Connected")
3. Check browser console (F12) for errors
4. Verify database has logs: `curl http://localhost:3001/api/logs`

### Database too large
**Problem:** bot.db file very large

**Solution:**
1. Run cleanup: Database auto-cleans logs > 7 days
2. Reduce retention period
3. Manually delete old data via SQL

---

## 📊 Monitoring

### Check Database Health

**API Endpoint:**
```bash
curl http://localhost:3001/api/database/stats
```

**Expected Output:**
```json
{
  "total_logs": 1500,      ✅ Normal
  "total_trades": 45,      ✅ Growing over time
  "open_positions": 3,     ✅ Active trading
  "closed_positions": 42   ✅ Trading history
}
```

### Database File Size

```bash
# Windows
dir data\bot.db

# Linux/Mac
ls -lh data/bot.db
```

**Expected:** < 10MB for normal usage

---

## 🎉 Benefits

### For Users
✅ Never lose logs again  
✅ Historical data always available  
✅ Faster dashboard loading  
✅ Better debugging  
✅ Performance tracking over time  

### For Development
✅ Persistent storage  
✅ Easy data analysis  
✅ Audit trail  
✅ Error tracking  
✅ Trade history  

---

## 🚀 Summary

Your bot now has:

✅ **SQLite database** for persistence  
✅ **All logs saved** automatically  
✅ **Trade history** preserved  
✅ **Position tracking** across restarts  
✅ **Dashboard loads historical data**  
✅ **Real-time streaming** on top of persisted data  
✅ **Fast queries** with indexing  
✅ **Auto-cleanup** of old data  

**Data persists across:**
- Bot restarts
- Page refreshes
- System reboots
- Dashboard reconnections

**Everything works together:**
```
Database (persistence) + WebSocket (real-time) = Best of both worlds!
```

🎉 **Your bot is now production-ready with full data persistence!**
