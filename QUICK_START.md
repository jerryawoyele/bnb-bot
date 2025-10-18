# 🚀 Quick Start Guide

Get your bot running in 5 minutes!

---

## ⚡ Fast Setup (Local)

### Step 1: Install MongoDB

**Option A: Local MongoDB**
```bash
# Download and install MongoDB Community Server
https://www.mongodb.com/try/download/community

# Default runs on: mongodb://localhost:27017
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
```bash
# 1. Go to: https://www.mongodb.com/atlas
# 2. Sign up (free)
# 3. Create M0 Free cluster
# 4. Create database user
# 5. Allow access from anywhere (0.0.0.0/0)
# 6. Get connection string:
#    mongodb+srv://user:pass@cluster.mongodb.net/bnb-copy-bot
```

### Step 2: Configure Environment

```bash
# Copy example
cp .env.example .env

# Edit .env and set:
PRIVATE_KEY=your_private_key_here
MONGODB_URI=mongodb://localhost:27017/bnb-copy-bot
# Or MongoDB Atlas URI
```

### Step 3: Install & Run

```bash
# Install backend dependencies
npm install

# Start backend
npm start
```

**You should see:**
```
╔═══════════════════════════════════════════╗
║  ✅ BOT READY - Waiting for commands      ║
║  📱 Dashboard: http://localhost:3000      ║
║  🔌 API: http://localhost:3001            ║
║  💾 MongoDB: Connected                    ║
╚═══════════════════════════════════════════╝
```

### Step 4: Start Frontend (New Terminal)

```bash
cd frontend
npm install
npm run dev
```

### Step 5: Open Dashboard

```
http://localhost:3000
```

---

## 🎯 Using the Bot

### First Time Setup

1. **Open Dashboard** → Should connect automatically
2. **Go to Control Tab** → First tab
3. **Choose Mode:**
   - **Auto Detection** → Smart wallet detection
   - **Manual** → Enter wallet address

### Auto Detection Mode

1. Click **"Start Auto Detection"**
2. Bot monitors: `0xe2d60cfe3cf8b2079c7df0144c5b28c03469775c`
3. Waits for incoming transfer
4. Finds matching outgoing transfer (60s window, within $10)
5. Auto-starts tracking detected wallet

### Manual Mode

1. Enter wallet address (0x...)
2. Click **"Start with Wallet"**
3. Bot starts tracking immediately

### Monitoring

- **Dashboard Tab** → Live stats, positions, trades
- **Logs Tab** → Real-time logs
- **Sessions Tab** → View previous runs

### Stopping

1. Go to **Control Tab**
2. Click **"Stop Bot"**
3. Session saved to MongoDB

---

## 🔧 Common Issues

### Backend Won't Start

**Error: MongoDB connection failed**
```bash
# Solution: Make sure MongoDB is running

# Local MongoDB:
# Check if service is running

# MongoDB Atlas:
# Check connection string
# Verify network access (0.0.0.0/0)
# Check username/password
```

**Error: Cannot find module 'mongoose'**
```bash
# Solution: Install dependencies
npm install
```

### Frontend Can't Connect

**Error: "Connecting to Backend..."**
```bash
# Solution: Make sure backend is running
npm start

# Check it's on port 3001:
# Open: http://localhost:3001/api/health
```

### Bot Not Trading

1. **Check bot is started** (Control tab)
2. **Check wallet has BNB** for gas fees
3. **Check RPC endpoint** is working
4. **Review logs** for filter reasons

---

## 📊 Dashboard Overview

### Control Tab (Start/Stop)
```
┌────────────────────────────────┐
│  🎮 Bot Control                │
├────────────────────────────────┤
│  Status: 🟢 Running            │
│  Mode: 📊 Tracking             │
│  Watching: 0xabc...            │
│                                │
│  [Stop Bot]                    │
└────────────────────────────────┘
```

### Dashboard Tab (Live Data)
```
┌────────────────────────────────┐
│  📊 Statistics                 │
│  Trades: 5  |  Failed: 1       │
│  Open: 2    |  Profit: 3       │
├────────────────────────────────┤
│  💼 Open Positions             │
│  Token A    0.5 BNB   +25%     │
│  Token B    0.3 BNB   +10%     │
├────────────────────────────────┤
│  📈 Recent Trades              │
│  BUY  Token C  0.5 BNB  ✅     │
│  SELL Token D  0.8 BNB  ✅     │
└────────────────────────────────┘
```

### Sessions Tab (History)
```
┌────────────────────────────────┐
│  📚 Previous Sessions          │
├────────────────────────────────┤
│  Session #1                    │
│  2h 30m  |  5 trades  |  🟢   │
│  [View Details]                │
│                                │
│  Session #2                    │
│  1h 15m  |  3 trades  |  🟡   │
│  [View Details]                │
└────────────────────────────────┘
```

---

## 🧪 Testing Smart Detection

### Test Scenario

1. **Start Auto Detection**
2. **Send test transfer to trigger wallet:**
   ```
   To: 0xe2d60cfe3cf8b2079c7df0144c5b28c03469775c
   Amount: 0.01 BNB
   ```
3. **Within 60 seconds, trigger wallet sends:**
   ```
   To: Your target wallet
   Amount: ~0.01 BNB (within $10)
   ```
4. **Bot auto-detects and starts tracking your target wallet**

### Expected Logs
```
💰 Incoming transfer detected to trigger wallet
   Amount: 0.01 BNB (~$6)
   From: 0x...

⏱️ Monitoring for outgoing transfers (next 60 seconds)...

✅ Found matching outgoing transfer!
   Amount: 0.0098 BNB (~$5.88)
   To: 0xabc...
   Difference: $0.12

🎯 Wallet detected: 0xabc...
✅ Bot started and tracking wallet
```

---

## 📦 What's Included

### Backend
- ✅ Bot Controller (start/stop)
- ✅ Smart Wallet Detector
- ✅ Trading Engine
- ✅ MongoDB Integration
- ✅ Session Management
- ✅ WebSocket Server
- ✅ REST API

### Frontend
- ✅ Bot Control UI
- ✅ Live Dashboard
- ✅ Session Viewer
- ✅ Real-time Logs
- ✅ Config Panel
- ✅ Responsive Design

### Database
- ✅ Sessions (track each run)
- ✅ Logs (all activity)
- ✅ Trades (executed trades)
- ✅ Positions (open/closed)
- ✅ Auto-persistence

---

## 🌐 Deploy Online

See **`DEPLOYMENT_GUIDE.md`** for complete instructions:

1. **MongoDB Atlas** (free) - Database hosting
2. **Railway** (free $5 credit) - Backend hosting
3. **Vercel** (free) - Frontend hosting

Total cost: **$0/month** on free tiers!

---

## 🎓 Learning Resources

### Understanding Smart Detection
Read: `COMPLETE_FEATURE_SUMMARY.md` → Smart Wallet Detection section

### API Reference
All endpoints documented in: `COMPLETE_FEATURE_SUMMARY.md` → API Endpoints

### Deployment
Full guide: `DEPLOYMENT_GUIDE.md`

### Configuration
All options explained in: `.env.example`

---

## 🆘 Need Help?

### Check Logs

**Backend logs:**
```bash
# Terminal where you ran: npm start
# Shows all bot activity
```

**Frontend logs:**
```bash
# Browser console (F12)
# Shows API calls and errors
```

**MongoDB logs:**
```bash
# MongoDB Atlas: Database → Metrics
# Shows database operations
```

### Common Questions

**Q: Bot not detecting wallet?**
A: Check trigger wallet has incoming+outgoing transfers within 60s and $10 range

**Q: Can I change trigger wallet?**
A: Yes! Edit `src/bot-controller.js` line 12:
```javascript
this.triggerWallet = '0xe2d60cfe3cf8b2079c7df0144c5b28c03469775c';
```

**Q: How to change $10 range?**
A: Edit `src/smart-wallet-detector.js` line 128:
```javascript
if (difference <= 10) { // Change 10 to your value
```

**Q: Can I use multiple bots?**
A: Yes! Each bot instance creates its own session in MongoDB

**Q: How to backup data?**
A: MongoDB Atlas has auto-backups. Or export sessions via API.

---

## 🎉 You're Ready!

Your bot is fully configured with:
- ✅ Smart wallet detection
- ✅ MongoDB persistence
- ✅ Web-based control
- ✅ Session history
- ✅ Real-time monitoring

**Start the bot and happy trading! 🚀**

---

## 📞 Quick Reference

| Action | Location |
|--------|----------|
| Start bot | Control tab → Click button |
| Stop bot | Control tab → Stop button |
| View live stats | Dashboard tab |
| Check logs | Logs tab |
| View history | Sessions tab |
| Change config | Config tab |
| Deploy online | See DEPLOYMENT_GUIDE.md |

---

**Questions? Check `COMPLETE_FEATURE_SUMMARY.md` for detailed explanations!**
