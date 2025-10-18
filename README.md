# 🚀 BNB Copy-Trading Bot

A smart, automated copy-trading bot for **Binance Smart Chain (BSC)** that monitors a target wallet and replicates its trades on DEXs like PancakeSwap with customizable filters and risk management.

## ✨ Features

- 🎯 **Real-time Trade Copying** - Instantly copy trades from any wallet on BSC
- 🔄 **Auto-Follow Mode** - Automatically switch to new wallets when funds are transferred
- 🛡️ **Advanced Filtering** - Protect your funds with multiple safety filters
- ⚡ **Fast Execution** - WebSocket-based monitoring for minimal latency
- 📊 **Trade Analytics** - Built-in statistics and logging
- 🔒 **Security First** - Environment-based configuration, no hardcoded keys

## 🎛️ Built-in Filters

| Filter | Description | Purpose |
|--------|-------------|---------|
| **Max Buy Amount** | Cap your investment per trade | Risk management |
| **Slippage Control** | Set acceptable price slippage | Prevent sandwich attacks |
| **Gas Price Limit** | Maximum gas price you'll pay | Cost control |
| **Min Liquidity** | Minimum pool liquidity required | Avoid illiquid tokens |
| **Max Token Age** | Only trade recently deployed tokens | Target new opportunities |
| **Router Whitelist** | Only copy trades from specific DEXs | Prevent scam DEX routing |
| **Token Blacklist** | Block specific token addresses | Avoid known scams |

## 📋 Prerequisites

- **Node.js** v18 or higher
- **BSC WebSocket RPC** endpoint (QuickNode, GetBlock, Ankr, or NodeReal)
- **Private Key** for your bot wallet (with BNB for gas)
- Basic understanding of DeFi and trading risks

## 🚀 Quick Start

### 1. Clone or Download

```bash
cd "C:\Users\Jerry A\Desktop\BNB Bot"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your details:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required Configuration
WS_RPC=wss://bsc-mainnet.nodereal.io/ws/v1/YOUR_API_KEY
PRIVATE_KEY=your_bot_wallet_private_key_here
START_WATCHED=0xTargetWalletAddressToWatch

# Trading Parameters (adjust to your risk tolerance)
MAX_BUY_AMOUNT_BNB=0.5
SLIPPAGE_PERCENT=2
MAX_GAS_PRICE_GWEI=10
MIN_LIQUIDITY_BNB=50
MAX_TOKEN_AGE_HOURS=72

# Auto-Follow Settings
AUTO_FOLLOW_ENABLED=true
MIN_TRANSFER_AMOUNT_BNB=0.1
```

### 4. Run the Bot

```bash
npm start
```

## 🔧 Configuration Guide

### WebSocket RPC Providers

Choose one of these providers and get your API key:

- **NodeReal** (Recommended): https://nodereal.io/
- **QuickNode**: https://www.quicknode.com/
- **GetBlock**: https://getblock.io/
- **Ankr**: https://www.ankr.com/

Example URLs:
```
wss://bsc-mainnet.nodereal.io/ws/v1/YOUR_API_KEY
wss://YOUR_ENDPOINT.bsc.quiknode.pro/YOUR_API_KEY/
```

### Trading Filters Explained

#### **MAX_BUY_AMOUNT_BNB**
- Maximum BNB amount per buy trade
- If leader buys with 1 BNB and your max is 0.5, bot will buy with 0.5 BNB
- Prevents over-investment

#### **SLIPPAGE_PERCENT**
- Price movement tolerance (%)
- Lower = stricter execution price, higher chance of failure
- Higher = more lenient, but more vulnerable to frontrunning
- Recommended: 2-5%

#### **MAX_GAS_PRICE_GWEI**
- Maximum gas price bot will pay
- Prevents trading during gas spikes
- Check current BSC gas: https://bscscan.com/gastracker
- Typical: 5-10 Gwei

#### **MIN_LIQUIDITY_BNB**
- Minimum BNB in liquidity pool
- Higher = safer but fewer opportunities
- Recommended: 50+ BNB for safety

#### **MAX_TOKEN_AGE_HOURS**
- Only trade tokens deployed within X hours
- Set to 0 to disable
- Useful for sniping new launches
- Recommended: 24-72 hours for new tokens

#### **AUTO_FOLLOW_ENABLED**
- Automatically switch to new wallet when leader transfers funds
- Useful for following smart money across wallets
- Set to `false` to stick to one wallet

### Router Whitelist

Restrict copying to specific DEX routers:

```env
ALLOWED_ROUTERS=0x10ED43C718714eb63d5aA57B78B54704E256024E
```

Common BSC Routers:
- **PancakeSwap v2**: `0x10ED43C718714eb63d5aA57B78B54704E256024E`
- **PancakeSwap v3**: `0x13f4EA83D0bd40E75C8222255bc855a974568Dd4`
- **Biswap**: `0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8`

Leave empty to allow all routers (not recommended).

### Token Blacklist

Block specific tokens:

```env
BLACKLISTED_TOKENS=0x123...,0x456...
```

## 📊 Understanding the Output

### Bot Startup
```
🔧 Validating configuration...
✅ Configuration valid
🌐 Connecting to BSC WebSocket...
✅ Connected to BSC network
🚀 Starting BNB Copy-Trading Bot
👀 Watching wallet: 0x...
💰 Bot balance: 1.5000 BNB
```

### Trade Detection
```
📡 Detected transaction from watched wallet: 0x...
💱 Swap detected: BUY
   Router: 0x10ED43C718714eb63d5aA57B78B54704E256024E
   Token In: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
   Token Out: 0x...
   Amount: 0.5 BNB
```

### Filter Results
```
🔍 Applying filters...
✅ All filters passed
🎯 Executing copy trade...
```

### Trade Execution
```
==============================================================
[2024-01-15T10:30:45.123Z] 🔔 TRADE SUCCESS
==============================================================
  Transaction Hash: 0x...
  Type: BUY
  Token: 0x...
  Amount In: 0.5 BNB
  Block: 12345678
  Gas Used: 250000
==============================================================
```

### Wallet Switch
```
************************************************************
[2024-01-15T10:45:23.456Z] 🔄 WALLET SWITCH
************************************************************
  From: 0xOldWallet...
  To:   0xNewWallet...
  Reason: Transfer of 1.5 BNB detected
************************************************************
```

## 🛡️ Security Best Practices

### 1. Protect Your Private Key
- **Never** share your private key
- **Never** commit `.env` to git
- Use a dedicated wallet for the bot
- Keep only necessary funds in the bot wallet

### 2. Start with Small Amounts
- Test with minimal BNB first
- Increase investment gradually as you gain confidence
- Set conservative `MAX_BUY_AMOUNT_BNB`

### 3. Monitor Actively
- Check logs regularly
- Review trades in real-time
- Be ready to stop the bot if needed (Ctrl+C)

### 4. Understand the Risks
- **Honeypots**: Tokens you can buy but not sell
- **Rug Pulls**: Developers drain liquidity
- **Frontrunning**: MEV bots may front-run your trades
- **Gas Fees**: Failed transactions still cost gas
- **Impermanent Loss**: Not applicable here but be aware of DeFi risks

## 🔍 Monitoring & Debugging

### Check Transaction on BSCScan
```
https://bscscan.com/tx/YOUR_TX_HASH
```

### View Bot Wallet
```
https://bscscan.com/address/YOUR_BOT_WALLET
```

### Common Issues

#### "Insufficient BNB balance"
- Add more BNB to your bot wallet
- Each trade requires BNB for the swap + gas

#### "Transaction reverted"
- Slippage too low - increase `SLIPPAGE_PERCENT`
- Token may be honeypot - add to blacklist
- Insufficient liquidity - increase `MIN_LIQUIDITY_BNB`

#### "Gas price exceeds limit"
- Network is congested
- Increase `MAX_GAS_PRICE_GWEI` or wait

#### "No liquidity pool exists"
- Token pair doesn't have liquidity
- Check on PancakeSwap or other DEXs

## 📈 Advanced Usage

### Multiple Allowed Routers
```env
ALLOWED_ROUTERS=0x10ED43C718714eb63d5aA57B78B54704E256024E,0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8
```

### Disable Token Age Filter
```env
MAX_TOKEN_AGE_HOURS=0
```

### Aggressive Trading (Higher Risk)
```env
MAX_BUY_AMOUNT_BNB=2.0
SLIPPAGE_PERCENT=5
MIN_LIQUIDITY_BNB=10
```

### Conservative Trading (Lower Risk)
```env
MAX_BUY_AMOUNT_BNB=0.1
SLIPPAGE_PERCENT=1
MIN_LIQUIDITY_BNB=100
MAX_TOKEN_AGE_HOURS=168
```

## 🛑 Stopping the Bot

Press `Ctrl+C` in the terminal. The bot will:
1. Stop monitoring new blocks
2. Print final statistics
3. Exit gracefully

## 📊 Statistics

The bot tracks:
- Total transactions from watched wallet
- Trades detected
- Trades successfully executed
- Trades that failed
- Trades filtered out
- Number of wallet switches

View stats at any time by pressing `Ctrl+C` or wait for the 5-minute periodic report.

## 🔄 Updates & Maintenance

### Update Dependencies
```bash
npm update
```

### Check for Node.js Updates
```bash
node --version
```

## ⚠️ Disclaimer

This bot is provided for educational purposes. Cryptocurrency trading involves substantial risk of loss. The authors are not responsible for any financial losses incurred. Always:

- Do your own research (DYOR)
- Never invest more than you can afford to lose
- Understand smart contract risks
- Be aware of scam tokens and honeypots
- Monitor your bot actively

## 🤝 Contributing

Found a bug or have a feature request? Feel free to:
- Report issues
- Submit pull requests
- Suggest improvements

## 📝 License

MIT License - See LICENSE file for details

---

**Happy Trading! 🚀💰**

*Remember: Smart trading is safe trading. Always prioritize security and risk management over profit.*
