# 🚀 START HERE - Complete Setup Guide

Welcome to your **Advanced BNB Copy-Trading Bot**! This guide will get you running in under 10 minutes.

---

## 📋 What You Have

A professional copy-trading bot with:
- ✅ **Buy-only mode** - Only copies buys, not sells
- ✅ **Auto take-profit at 100%** - Sells automatically at 2x
- ✅ **Lightning-fast execution** - 1-3 second copy speed
- ✅ **USD-based liquidity filter** - Consistent safety
- ✅ **One-time buy per token** - No duplicates
- ✅ **Max token age filter** - Snipe new launches
- ✅ **Telegram alerts** - Real-time notifications
- ✅ **Watch alerts** - See all wallet activity

---

## 🎯 Quick Start (3 Steps)

### Step 1: Install Dependencies ✅

Already done! You ran `npm install`.

---

### Step 2: Configure `.env` File

You need to update your `.env` file with:

#### Required Settings:

```env
# 1. WebSocket RPC (REQUIRED)
WS_RPC=wss://bsc.publicnode.com

# 2. Bot Wallet Private Key (REQUIRED)
PRIVATE_KEY=your_64_character_private_key_here

# 3. Wallet to Copy (REQUIRED)
START_WATCHED=0xAddressYouWantToCopyHere
```

#### Optional but Recommended: Telegram

```env
# 4. Telegram Bot (Optional but recommended)
ENABLE_TELEGRAM_ALERTS=true
TELEGRAM_BOT_TOKEN=get_from_@BotFather
TELEGRAM_CHAT_ID=get_from_@userinfobot
```

**See `TELEGRAM_SETUP.md` for Telegram setup (5 minutes)**

---

### Step 3: Start the Bot

```bash
npm start
```

You should see:
```
🚀 BNB CHAIN COPY-TRADING BOT 🚀
✅ Connected to BSC network
👀 Watching wallet: 0x...
💰 Bot balance: 0.5000 BNB
🎯 Take-profit monitoring enabled (100%)
✅ Bot is running and monitoring blocks...
```

---

## 📱 Telegram Setup (Recommended)

### Why Telegram?
- See every transaction from watched wallet
- Get notified when bot trades
- Profit alerts when 100% reached
- Error alerts if something fails
- **No need to watch logs!**

### Setup (5 minutes):
1. Open Telegram → Search `@BotFather`
2. Send `/newbot` and follow instructions
3. Copy your bot token
4. Search `@userinfobot` → Send any message
5. Copy your chat ID
6. Add to `.env` file

**Full guide:** `TELEGRAM_SETUP.md`

---

## ⚙️ Configuration Explained

### Trading Mode
```env
# Buy-only mode (copies only buy trades)
COPY_BUY_ONLY=true

# Auto take-profit (sells at 100% profit)
AUTO_TAKE_PROFIT_ENABLED=true
TAKE_PROFIT_PERCENT=100
```

### Safety Filters
```env
# Max BNB per trade
MAX_BUY_AMOUNT_BNB=0.5

# Minimum liquidity in USD (not BNB!)
MIN_LIQUIDITY_USD=10000

# Only buy tokens deployed within X hours (0 = disabled)
MAX_TOKEN_AGE_HOURS=72

# Prevent buying same token twice
ONE_TIME_BUY_PER_TOKEN=true
```

### Speed Settings
```env
# Fast mode (1-3 second execution)
FAST_MODE=true
GAS_MULTIPLIER=1.2
```

---

## 💡 Example Configurations

### 🟢 **Safe Sniper** (Recommended for Beginners)
```env
COPY_BUY_ONLY=true
MAX_BUY_AMOUNT_BNB=0.1
MIN_LIQUIDITY_USD=20000
MAX_TOKEN_AGE_HOURS=24
ONE_TIME_BUY_PER_TOKEN=true
FAST_MODE=true
```

### 🟡 **Balanced Trader**
```env
COPY_BUY_ONLY=true
MAX_BUY_AMOUNT_BNB=0.5
MIN_LIQUIDITY_USD=10000
MAX_TOKEN_AGE_HOURS=72
ONE_TIME_BUY_PER_TOKEN=true
FAST_MODE=true
```

### 🔴 **Aggressive Sniper** (Higher Risk)
```env
COPY_BUY_ONLY=true
MAX_BUY_AMOUNT_BNB=2.0
MIN_LIQUIDITY_USD=5000
MAX_TOKEN_AGE_HOURS=1
ONE_TIME_BUY_PER_TOKEN=false
FAST_MODE=true
GAS_MULTIPLIER=1.5
```

---

## 🔍 How to Find Good Wallets to Copy

### Method 1: DexScreener
1. Go to https://dexscreener.com/
2. Find profitable tokens on BSC
3. Click "Top Traders" tab
4. Copy profitable wallet addresses

### Method 2: BSCScan
1. Go to https://bscscan.com/
2. Search for successful tokens
3. Check holders/transfers
4. Find wallets with good profit patterns

### Method 3: Twitter/Telegram
- Follow "smart money" wallet trackers
- Crypto influencers often share addresses
- Trading communities share profitable wallets

---

## 📊 Understanding Bot Output

### When Bot Detects a Trade:
```
📡 Detected transaction from watched wallet
💱 Swap detected: BUY
   Token In: WBNB
   Token Out: 0x1234...
   Amount: 0.5 BNB

🔍 Applying filters...
✅ All filters passed
🎯 Executing copy trade...
✅ Copy trade executed successfully!
```

### Telegram Notification:
```
🎯 Copy Trade Executed

Type: BUY
Token: 0x1234567...
Amount: 0.5 BNB
🎯 Take Profit: 100%

View Transaction
✅ Success
```

### When 100% Profit Reached:
```
💰 TAKE PROFIT SUCCESS!

Token: 0x1234567...
Profit: 100.50%
Amount: +0.5025 BNB

View Transaction
✅ Sold at target!
```

---

## 🆘 Troubleshooting

### Bot won't start
**Error:** "Configuration errors"
**Fix:** Check `.env` file has all required fields

**Error:** "Connection failed"
**Fix:** Update `WS_RPC` in `.env` - try `wss://bsc.publicnode.com`

### No trades executing
**Possible reasons:**
1. Watched wallet isn't trading
2. Trades being filtered (check logs)
3. Insufficient BNB balance
4. Gas price too high

**Fix:** Check logs and Telegram alerts

### Telegram not working
**Fix:** Follow `TELEGRAM_SETUP.md` step-by-step

---

## 📚 Full Documentation

| Guide | What's Inside |
|-------|--------------|
| **SUMMARY.md** | Feature overview & quick reference |
| **FEATURES.md** | Detailed feature explanations |
| **TELEGRAM_SETUP.md** | Telegram bot setup |
| **QUICKSTART.md** | Alternative quick setup |
| **FAQ.md** | Common questions answered |
| **SECURITY.md** | Security best practices |
| **RPC_ENDPOINTS.md** | RPC provider list |

---

## 🌐 Running 24/7 (Optional)

To receive alerts and trade 24/7, host on a server:

### Option 1: VPS (Best)
**Providers:** DigitalOcean ($6/mo), Vultr, Linode

```bash
# On VPS
npm install -g pm2
pm2 start src/index.js --name copy-bot
pm2 save
pm2 startup
```

### Option 2: Railway.app (Easiest)
1. Push code to GitHub
2. Connect Railway to repo
3. Add environment variables
4. Deploy (free tier available)

---

## ✅ Pre-Launch Checklist

Before going live with real money:

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` configured with all required settings
- [ ] WS_RPC endpoint working (`npm test`)
- [ ] Bot wallet funded with 0.1+ BNB
- [ ] Telegram bot setup (recommended)
- [ ] Test with small `MAX_BUY_AMOUNT_BNB` first
- [ ] Watched wallet address is correct
- [ ] Read `SECURITY.md`

---

## 🎯 Your First Trade

Once bot is running:

1. **Watch logs** - See what bot detects
2. **Check Telegram** - Get real-time alerts
3. **Wait for leader** - Bot copies their next buy
4. **Monitor position** - Bot checks profit every 30s
5. **Auto sell at 100%** - Bot sells when target reached

---

## 🔐 Security Reminders

- ✅ Use dedicated wallet for bot
- ✅ Never share private keys
- ✅ Start with small amounts
- ✅ Keep only necessary funds in bot wallet
- ✅ Regular withdrawals to main wallet
- ✅ Monitor Telegram alerts

---

## 💰 Profit Strategy

### Recommended Approach:
1. Start with 0.1-0.5 BNB per trade
2. Enable 100% take-profit
3. Let bot accumulate profits
4. Withdraw profits weekly to main wallet
5. Scale up gradually

### Risk Management:
- Never risk more than you can lose
- Diversify across multiple strategies
- Don't chase every trade
- Use filters to avoid scams

---

## 📞 Need Help?

1. **Check logs** - Most issues shown in console
2. **Read FAQ.md** - Common questions answered
3. **Check documentation** - Guides cover everything
4. **Verify config** - Most issues are configuration

---

## 🎉 You're Ready to Trade!

Your bot has everything needed:
- ✅ Buy-only copy trading
- ✅ Auto take-profit at 100%
- ✅ Lightning-fast execution
- ✅ Professional filtering
- ✅ Real-time alerts

**Start with small amounts, monitor closely, and scale up as you gain confidence!**

---

## 🚀 Quick Commands

```bash
# Test connection
npm test

# Start bot
npm start

# Stop bot
Ctrl+C

# View logs
# Logs are in console - no file logging
```

---

**Happy Trading! 🚀💰**

*Built with ❤️ for profitable copy trading*
