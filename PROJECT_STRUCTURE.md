# 📁 Project Structure

## Overview
```
BNB Bot/
├── src/                      # Source code
│   ├── index.js              # Main entry point
│   ├── config.js             # Configuration management
│   ├── logger.js             # Logging system
│   ├── abis.js               # Smart contract ABIs
│   ├── decoder.js            # Transaction decoder
│   ├── filters.js            # Trade filtering system
│   ├── executor.js           # Trade execution engine
│   ├── tracker.js            # Wallet tracking & monitoring
│   └── notifications.js      # Telegram alerts (optional)
├── .env                      # Environment variables (create from .env.example)
├── .env.example              # Example configuration
├── .gitignore                # Git ignore rules
├── package.json              # Node.js dependencies
├── README.md                 # Main documentation
├── QUICKSTART.md             # Quick start guide
├── SECURITY.md               # Security guidelines
├── FAQ.md                    # Frequently asked questions
├── LICENSE                   # MIT License
└── PROJECT_STRUCTURE.md      # This file
```

## File Descriptions

### Core Application Files

#### `src/index.js` (Main Entry Point)
- Initializes WebSocket connection to BSC
- Creates bot wallet from private key
- Starts the wallet tracker
- Handles graceful shutdown (Ctrl+C)
- Displays startup banner and configuration

**Key Functions:**
- `main()` - Application entry point
- Validates configuration
- Sets up WebSocket provider
- Initializes and starts tracker

---

#### `src/config.js` (Configuration Management)
- Loads environment variables from `.env`
- Provides typed configuration object
- Validates required settings
- Exports configuration to other modules

**Key Exports:**
- `config` - Configuration object
- `validateConfig()` - Validation function

**Configuration Sections:**
- Network settings (RPC, chain)
- Wallet addresses
- Trading filters
- Auto-follow settings
- Security settings

---

#### `src/logger.js` (Logging System)
- Structured logging with timestamps
- Multiple log levels (debug, info, warn, error)
- Special formatters for trades and wallet switches
- Configurable log level via environment

**Key Functions:**
- `logger.debug()` - Debug messages
- `logger.info()` - Info messages
- `logger.warn()` - Warning messages
- `logger.error()` - Error messages
- `logger.trade()` - Trade execution logs
- `logger.walletSwitch()` - Wallet change logs

---

#### `src/abis.js` (Smart Contract ABIs)
- PancakeSwap Router v2 ABI
- PancakeSwap Factory ABI
- PancakeSwap Pair ABI
- ERC20 Token ABI
- Function signature mappings
- Helper functions for decoding

**Key Exports:**
- `PANCAKE_ROUTER_ABI` - Router interface
- `PANCAKE_FACTORY_ABI` - Factory interface
- `PANCAKE_PAIR_ABI` - Pair interface
- `ERC20_ABI` - Token interface
- `ROUTER_SIGNATURES` - Function signatures
- `getFunctionName()` - Signature decoder

---

#### `src/decoder.js` (Transaction Decoder)
- Analyzes transactions from watched wallet
- Identifies transaction types (swap, transfer, unknown)
- Extracts trade parameters (tokens, amounts, paths)
- Decodes router function calls

**Key Class: `TransactionDecoder`**

**Methods:**
- `analyzeTransaction(tx)` - Main analysis function
- `decodeSwapTransaction(tx, functionName)` - Decode DEX swaps
- `decodeTokenTransfer(tx)` - Decode ERC20 transfers
- `isSwapTransaction(analysis)` - Check if transaction is a swap
- `isTransferTransaction(analysis)` - Check if transaction is a transfer

**Detects:**
- BNB transfers
- Token transfers
- DEX swaps (buy/sell)
- Router interactions

---

#### `src/filters.js` (Trade Filtering System)
- Applies safety filters to trades before execution
- Checks multiple criteria (liquidity, gas, age, etc.)
- Prevents risky or unprofitable trades
- Configurable via environment variables

**Key Class: `TradeFilter`**

**Methods:**
- `applyFilters(tradeData)` - Apply all filters
- `checkAllowedRouter(router)` - Router whitelist check
- `checkNotBlacklisted(token)` - Token blacklist check
- `checkMaxBuyAmount(amountBnb)` - Buy amount limit
- `checkGasPrice()` - Gas price check
- `checkLiquidity(tokenA, tokenB)` - Liquidity check
- `checkTokenAge(token)` - Token age check
- `calculateAdjustedAmount(amount)` - Amount adjustment

**Filters:**
1. ✅ Allowed router
2. ✅ Not blacklisted
3. ✅ Max buy amount
4. ✅ Gas price limit
5. ✅ Minimum liquidity
6. ✅ Maximum token age

---

#### `src/executor.js` (Trade Execution Engine)
- Executes copy trades on PancakeSwap
- Handles BUY and SELL operations
- Manages token approvals
- Calculates slippage and deadlines
- Submits transactions to blockchain

**Key Class: `TradeExecutor`**

**Methods:**
- `executeTrade(tradeData, adjustedAmount)` - Main execution function
- `executeBuy(tradeData, adjustedAmount)` - Execute buy trade
- `executeSell(tradeData)` - Execute sell trade
- `applySlippage(amount, slippagePercent)` - Calculate slippage
- `getBnbBalance()` - Get bot's BNB balance
- `getTokenBalance(token)` - Get bot's token balance

**Features:**
- Automatic token approval
- Slippage protection
- Gas price management
- Transaction confirmation waiting
- Error handling and logging

---

#### `src/tracker.js` (Wallet Tracking & Monitoring)
- Monitors blockchain for new blocks
- Detects transactions from watched wallet
- Coordinates decoder, filter, and executor
- Handles auto-follow wallet switching
- Tracks statistics

**Key Class: `WalletTracker`**

**Methods:**
- `start()` - Start monitoring
- `onNewBlock(blockNumber)` - Process new block
- `processTransaction(txHash)` - Process single transaction
- `handleSwapTransaction(analysis, tx)` - Handle detected swaps
- `handleTransferTransaction(analysis, tx)` - Handle transfers
- `switchWatchedWallet(newWallet, reason)` - Switch wallets
- `printConfig()` - Display configuration
- `printStats()` - Display statistics
- `stop()` - Stop monitoring

**Statistics Tracked:**
- Total transactions seen
- Trades detected
- Trades executed
- Trades failed
- Trades filtered
- Wallet switches

---

#### `src/notifications.js` (Telegram Alerts)
- Optional Telegram notification system
- Sends alerts for trades, errors, wallet switches
- Requires Telegram bot token and chat ID
- Enable via environment variables

**Key Class: `NotificationService`**

**Methods:**
- `sendMessage(message)` - Send message to Telegram
- `notifyTradeSuccess(...)` - Trade success alert
- `notifyTradeFailed(...)` - Trade failure alert
- `notifyWalletSwitch(...)` - Wallet switch alert
- `notifyBotStartup(...)` - Bot startup alert
- `notifyError(...)` - Error alert

---

### Configuration Files

#### `.env` (Environment Variables)
Your private configuration file. **NEVER commit to git!**

Required variables:
- `WS_RPC` - WebSocket RPC endpoint
- `PRIVATE_KEY` - Bot wallet private key
- `START_WATCHED` - Initial wallet to watch

See `.env.example` for all available options.

#### `.env.example` (Configuration Template)
Template showing all available configuration options with descriptions and recommended defaults.

#### `.gitignore` (Git Ignore Rules)
Prevents sensitive files from being committed:
- `.env` (your secrets)
- `node_modules/` (dependencies)
- `*.log` (log files)
- Other temporary files

---

### Documentation Files

#### `README.md` (Main Documentation)
Comprehensive guide covering:
- Features overview
- Installation instructions
- Configuration guide
- Filter explanations
- Usage examples
- Security best practices
- Troubleshooting

#### `QUICKSTART.md` (Quick Start Guide)
Condensed setup guide for fast deployment:
- 5-minute setup process
- Minimal configuration
- Testing procedures
- Configuration profiles

#### `SECURITY.md` (Security Guidelines)
Critical security information:
- Private key protection
- Wallet setup best practices
- Common attack vectors
- Incident response procedures
- Security checklist

#### `FAQ.md` (Frequently Asked Questions)
Answers to common questions:
- General questions
- Technical questions
- Trading questions
- Troubleshooting
- Advanced topics

#### `PROJECT_STRUCTURE.md` (This File)
Detailed explanation of project architecture and file organization.

#### `LICENSE` (MIT License)
Open-source license with disclaimer.

---

### Dependency File

#### `package.json` (Node.js Configuration)
Project metadata and dependencies:
- **ethers**: ^6.10.0 (Blockchain interaction)
- **dotenv**: ^16.3.1 (Environment variables)
- **bignumber.js**: ^9.1.2 (Precise number handling)
- **axios**: ^1.6.5 (HTTP requests for notifications)

Scripts:
- `npm start` - Run the bot

---

## Data Flow

```
1. WebSocket receives new block
   ↓
2. tracker.js processes block
   ↓
3. Finds transactions from watched wallet
   ↓
4. decoder.js analyzes transaction
   ↓
5. Is it a swap?
   ├─ Yes → filters.js applies filters
   │         ↓
   │       All filters pass?
   │         ├─ Yes → executor.js executes trade
   │         └─ No → Skip trade (log reason)
   │
   └─ No → Is it a transfer?
             ├─ Yes → Switch watched wallet (if enabled)
             └─ No → Ignore transaction
```

## Module Dependencies

```
index.js
├── config.js
├── logger.js
└── tracker.js
    ├── decoder.js
    │   ├── abis.js
    │   └── config.js
    ├── filters.js
    │   ├── abis.js
    │   ├── config.js
    │   └── logger.js
    ├── executor.js
    │   ├── abis.js
    │   ├── config.js
    │   └── logger.js
    └── notifications.js (optional)
        ├── config.js
        └── logger.js
```

## Extension Points

Want to customize the bot? Here's where to start:

### Add New Filters
**File:** `src/filters.js`
**Method:** `applyFilters()`
Add your custom filter logic and integrate it into the filter chain.

### Modify Trade Logic
**File:** `src/executor.js`
**Methods:** `executeBuy()`, `executeSell()`
Customize how trades are executed.

### Add New Transaction Types
**File:** `src/decoder.js`
**Method:** `analyzeTransaction()`
Detect and decode additional transaction types.

### Custom Notifications
**File:** `src/notifications.js`
Add new notification types or integrate other services (Discord, Slack, etc.)

### Database Logging
**File:** Create `src/database.js`
Add persistent storage for trades, statistics, and analytics.

### Web Dashboard
**File:** Create `dashboard/` directory
Build a web interface for monitoring and controlling the bot.

---

## Best Practices

### Code Organization
- Keep each file focused on one responsibility
- Use clear, descriptive function names
- Add comments for complex logic
- Follow existing code style

### Configuration
- Never hardcode sensitive values
- Use environment variables
- Provide sensible defaults
- Validate all configuration

### Error Handling
- Use try-catch blocks
- Log errors with context
- Fail gracefully
- Don't expose sensitive info in errors

### Security
- Never log private keys
- Validate all external inputs
- Use secure RPC providers
- Keep dependencies updated

---

## Development Workflow

### Testing Changes
1. Modify code
2. Update `.env` with test configuration
3. Set `MAX_BUY_AMOUNT_BNB=0.01` (small amount)
4. Run: `npm start`
5. Monitor logs for errors
6. Test with real transaction from watched wallet

### Debugging
1. Set `LOG_LEVEL=debug` in `.env`
2. Add `console.log()` statements
3. Check transaction on BSCScan
4. Review error stack traces
5. Test in isolation

### Deploying
1. Test thoroughly
2. Update documentation
3. Set production configuration
4. Monitor closely after deployment
5. Have rollback plan ready

---

## Need More Help?

- **Setup Issues:** See `QUICKSTART.md`
- **Security Concerns:** See `SECURITY.md`
- **Common Questions:** See `FAQ.md`
- **General Info:** See `README.md`

**Happy coding! 🚀**
