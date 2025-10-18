# 📱 Telegram Bot Setup Guide

This guide will help you set up Telegram notifications for your copy-trading bot.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Your Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a chat and send: `/newbot`
3. Choose a name for your bot (e.g., "My Copy Trading Bot")
4. Choose a username (must end in 'bot', e.g., "my_copytrading_bot")
5. **Copy the bot token** (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Get Your Chat ID

**Method 1: Using @userinfobot (Easiest)**
1. Search for `@userinfobot` in Telegram
2. Start a chat and send any message
3. **Copy your Chat ID** (looks like: `123456789`)

**Method 2: Using Web API**
1. Start a chat with YOUR bot (the one you just created)
2. Send any message to your bot
3. Open this URL in browser (replace YOUR_BOT_TOKEN):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. Look for `"chat":{"id":123456789` in the response
5. **Copy the ID number**

### Step 3: Configure Your Bot

Edit your `.env` file and add:

```env
# Telegram Configuration
ENABLE_TELEGRAM_ALERTS=true
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# Alert Settings
SEND_WATCH_ALERTS=true
SEND_TRADE_ALERTS=true
SEND_PROFIT_ALERTS=true
```

### Step 4: Test Your Setup

Run the bot and you should receive a startup message in Telegram!

```bash
npm start
```

---

## 📨 Alert Types

### 1. Watch Alerts (Real-time Transaction Monitoring)
Sent for **EVERY** transaction from the watched wallet (except token transfers).

**Example:**
```
📡 WATCH ALERT: BUY

From: 0x1234...5678
To: 0xabcd...ef12
Value: 0.5000 BNB
Token: 0x9876...
Amount: 0.5000 BNB

View on BSCScan
```

**Disable with:** `SEND_WATCH_ALERTS=false`

---

### 2. Trade Alerts (Copy Trade Notifications)
Sent when your bot executes or skips a trade.

**Success:**
```
🎯 Copy Trade Executed

Type: BUY
Token: 0x1234567...
Amount: 0.5 BNB
🎯 Take Profit: 100%

View Transaction

✅ Success
```

**Filtered:**
```
⚠️ Trade Filtered

Token: 0x1234567...
Reason: Liquidity $5000 below minimum $10000

❌ Trade skipped
```

**Failed:**
```
❌ Trade Failed

Type: BUY
Token: 0x1234567...
Reason: Insufficient balance
```

**Disable with:** `SEND_TRADE_ALERTS=false`

---

### 3. Profit Alerts (Take Profit Notifications)
Sent when your position reaches profit target and sells.

**Target Reached:**
```
🎯 TAKE PROFIT TARGET REACHED!

Token: 0x1234567...
Profit: 100.50% 💰

Buy Value: 0.5000 BNB
Current Value: 1.0025 BNB
Profit: +0.5025 BNB

🤖 Executing sell order...
```

**Success:**
```
💰 TAKE PROFIT SUCCESS!

Token: 0x1234567...
Profit: 100.50%
Amount: +0.5025 BNB

View Transaction

✅ Sold at target!
```

**Disable with:** `SEND_PROFIT_ALERTS=false`

---

### 4. Startup Alert
Sent when bot starts successfully.

```
🚀 Copy-Trading Bot Started

Bot Wallet: 0x1234...5678
Watching: 0xabcd...ef12
Balance: 1.5000 BNB

Mode: BUY ONLY
🎯 Take Profit: 100%
✅ One-time buy per token

✅ Bot is now active and monitoring
```

---

### 5. Wallet Switch Alert
Sent when auto-follow switches to a new wallet.

```
🔄 Wallet Switch

From: 0x1234...5678
To: 0xabcd...ef12
Reason: Transfer of 1.5 BNB detected
```

---

## 🎛️ Customizing Alerts

### Minimal Alerts (Only Profits)
```env
SEND_WATCH_ALERTS=false
SEND_TRADE_ALERTS=false
SEND_PROFIT_ALERTS=true
```

### Maximum Alerts (Everything)
```env
SEND_WATCH_ALERTS=true
SEND_TRADE_ALERTS=true
SEND_PROFIT_ALERTS=true
```

### Trade Only (No Watch Spam)
```env
SEND_WATCH_ALERTS=false
SEND_TRADE_ALERTS=true
SEND_PROFIT_ALERTS=true
```

---

## 🔧 Advanced Setup

### Multiple Bots, One Telegram
You can run multiple bots and send alerts to the same Telegram chat. Each message will show which transaction/token it's about.

### Private Group Alerts
1. Create a private Telegram group
2. Add your bot to the group
3. Get the group chat ID (negative number, e.g., `-123456789`)
4. Use the group ID in `.env`

### Rate Limiting
Built-in rate limiting prevents duplicate alerts within 2 seconds. No configuration needed.

---

## 🚨 Troubleshooting

### "Failed to send Telegram notification"
**Causes:**
1. Wrong bot token
2. Wrong chat ID
3. Bot not started (you must send `/start` to your bot first)
4. Network issues

**Fix:**
1. Verify bot token from @BotFather
2. Verify chat ID from @userinfobot
3. Start a chat with your bot
4. Check internet connection

### No messages received
**Checklist:**
- [ ] `ENABLE_TELEGRAM_ALERTS=true`
- [ ] Bot token is correct
- [ ] Chat ID is correct (no quotes, just numbers)
- [ ] You sent `/start` to your bot
- [ ] Bot is actually detecting transactions

**Test manually:**
```bash
# In your terminal
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage?chat_id=YOUR_CHAT_ID&text=Test"
```

### Messages delayed
This is normal. Telegram can have 1-5 second delays depending on their server load.

---

## 📊 Sample .env Configuration

```env
# ======================
# TELEGRAM CONFIGURATION
# ======================

# Enable Telegram alerts
ENABLE_TELEGRAM_ALERTS=true

# Your bot token from @BotFather
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Your chat ID from @userinfobot
TELEGRAM_CHAT_ID=123456789

# Alert preferences
SEND_WATCH_ALERTS=true      # All wallet activity
SEND_TRADE_ALERTS=true      # Copy trades only
SEND_PROFIT_ALERTS=true     # Take profit alerts
```

---

## 🌐 Hosting Your Bot Online (24/7 Operation)

To receive alerts 24/7, host your bot online:

### Option 1: VPS (Recommended)
**Providers:** DigitalOcean, Linode, Vultr, AWS EC2

**Setup:**
1. Rent a VPS ($5-10/month)
2. Install Node.js
3. Clone your bot files
4. Run with PM2 for auto-restart

```bash
# On your VPS
npm install -g pm2
pm2 start src/index.js --name copy-bot
pm2 save
pm2 startup
```

### Option 2: Railway.app (Free Tier)
1. Sign up at https://railway.app/
2. Connect your GitHub repo
3. Add environment variables
4. Deploy

### Option 3: Heroku (Simple but Paid)
1. Sign up at https://heroku.com/
2. Install Heroku CLI
3. Deploy with `git push heroku main`

### Option 4: Replit (Easy but Limited)
1. Sign up at https://replit.com/
2. Import your project
3. Add secrets (env variables)
4. Keep alive with UptimeRobot

---

## 🔐 Security Tips

1. **Never share your bot token** - Anyone with it can control your bot
2. **Never share your chat ID** - Others could spam you
3. **Use private chats** - Don't post tokens in public groups
4. **Revoke compromised tokens** - Message @BotFather with `/revoke`

---

## 📚 Additional Resources

- **Telegram Bot API:** https://core.telegram.org/bots/api
- **BotFather Commands:** https://core.telegram.org/bots#6-botfather
- **Telegram Bot Tutorial:** https://core.telegram.org/bots/tutorial

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Bot created with @BotFather
- [ ] Bot token copied correctly
- [ ] Chat ID obtained from @userinfobot
- [ ] Configuration added to `.env`
- [ ] `ENABLE_TELEGRAM_ALERTS=true`
- [ ] Sent `/start` to your bot
- [ ] Test message received
- [ ] Bot started successfully
- [ ] Received startup notification

---

**Your bot is now ready to send real-time alerts! 🎉**

For support, check the FAQ.md or review error logs.
