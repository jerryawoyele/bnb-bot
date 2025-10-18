# ⚡ Quick Start Guide

Get your BNB copy-trading bot running in 5 minutes!

## 1️⃣ Install Dependencies

```bash
npm install
```

## 2️⃣ Get Your API Keys

### WebSocket RPC (Required)
Choose **ONE** provider:

- **NodeReal** (Free tier available): https://nodereal.io/
  - Sign up → Create App → Copy WebSocket URL
  - Example: `wss://bsc-mainnet.nodereal.io/ws/v1/YOUR_API_KEY`

- **QuickNode** (Free trial): https://www.quicknode.com/
  - Create Endpoint → Select BSC → Copy WebSocket URL

- **Public RPC** (Not recommended for production):
  - `wss://bsc-ws-node.nariox.org:443`

## 3️⃣ Prepare Your Bot Wallet

You need a wallet with:
- **Private key** (export from MetaMask or create new)
- **At least 0.1 BNB** for trades + gas fees

> ⚠️ **Security**: Use a NEW wallet dedicated to the bot. Never use your main wallet!

### Create New Wallet (Recommended)
```javascript
// Run this once to generate a new wallet
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address, '\nPrivate Key:', wallet.privateKey);"
```

## 4️⃣ Configure Your Bot

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your details:

```env
# 1. Your WebSocket RPC
WS_RPC=wss://bsc-mainnet.nodereal.io/ws/v1/YOUR_API_KEY

# 2. Your bot wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# 3. Wallet address to copy trade
START_WATCHED=0x1234567890123456789012345678901234567890

# 4. Safety limits (recommended defaults)
MAX_BUY_AMOUNT_BNB=0.1
SLIPPAGE_PERCENT=2
MIN_LIQUIDITY_BNB=50
```

## 5️⃣ Fund Your Bot Wallet

Send **BNB** to your bot wallet address:
- Minimum: 0.1 BNB
- Recommended: 0.5+ BNB for multiple trades

Check balance:
```bash
# Visit BSCScan
https://bscscan.com/address/YOUR_BOT_WALLET_ADDRESS
```

## 6️⃣ Start the Bot

```bash
npm start
```

You should see:
```
🚀 BNB CHAIN COPY-TRADING BOT 🚀
✅ Configuration valid
✅ Connected to BSC network
👀 Watching wallet: 0x...
💰 Wallet balance: 0.5000 BNB
✅ Bot is running and monitoring blocks...
```

## 7️⃣ Monitor Activity

The bot will:
- ✅ Monitor every transaction from the watched wallet
- ✅ Detect DEX swaps (buy/sell)
- ✅ Apply safety filters
- ✅ Execute copy trades automatically
- ✅ Log all activity to console

### Stop the Bot
Press `Ctrl+C` to stop safely.

## 🎯 Test Mode (Recommended First)

Before real trading, test with small amounts:

```env
MAX_BUY_AMOUNT_BNB=0.01
SLIPPAGE_PERCENT=5
MIN_LIQUIDITY_BNB=20
```

## 🔍 Find a Wallet to Copy

Where to find good wallets:
- **BSCScan**: Look at successful traders' addresses
- **DexScreener**: Check top traders on specific tokens
- **Twitter/Telegram**: Follow smart money addresses
- **Whale Alerts**: Track large wallet movements

## 📊 Example Configuration Profiles

### 🟢 Conservative (Safe)
```env
MAX_BUY_AMOUNT_BNB=0.1
SLIPPAGE_PERCENT=1
MAX_GAS_PRICE_GWEI=5
MIN_LIQUIDITY_BNB=100
MAX_TOKEN_AGE_HOURS=0
AUTO_FOLLOW_ENABLED=false
```

### 🟡 Balanced
```env
MAX_BUY_AMOUNT_BNB=0.5
SLIPPAGE_PERCENT=2
MAX_GAS_PRICE_GWEI=10
MIN_LIQUIDITY_BNB=50
MAX_TOKEN_AGE_HOURS=168
AUTO_FOLLOW_ENABLED=true
```

### 🔴 Aggressive (Risky)
```env
MAX_BUY_AMOUNT_BNB=2.0
SLIPPAGE_PERCENT=5
MAX_GAS_PRICE_GWEI=15
MIN_LIQUIDITY_BNB=10
MAX_TOKEN_AGE_HOURS=24
AUTO_FOLLOW_ENABLED=true
```

## ❓ Troubleshooting

### "Cannot find module"
```bash
npm install
```

### "Invalid private key"
- Remove `0x` prefix from private key
- Make sure it's 64 characters long

### "Insufficient funds"
- Add more BNB to your bot wallet
- Check balance: https://bscscan.com/address/YOUR_ADDRESS

### "Connection timeout"
- Check your WebSocket RPC URL
- Try a different provider
- Check your internet connection

### Bot not detecting trades
- Verify the watched wallet is active
- Check if wallet is making trades on PancakeSwap
- Wait for next transaction

## 🆘 Need Help?

1. Read full documentation: `README.md`
2. Check logs for error messages
3. Verify all configuration values
4. Start with small test amounts

## ✅ Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] WebSocket RPC obtained
- [ ] Bot wallet created
- [ ] Bot wallet funded (0.1+ BNB)
- [ ] `.env` file configured
- [ ] Target wallet address set
- [ ] Bot started (`npm start`)
- [ ] Bot showing connection success

---

**You're ready to trade! 🚀**

*Remember: Start small, monitor actively, and never invest more than you can afford to lose.*
