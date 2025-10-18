# ✅ New Filter System Complete!

The bot now uses the new filter system with updated requirements.

---

## 🎯 Changes Implemented

### 1. **Fixed Buy Amount** ✅
- **Old:** `maxBuyAmountBnb` (maximum limit)
- **New:** `buyAmountBnb` (fixed amount)
- **Behavior:** Bot always buys with this exact BNB amount, regardless of watched wallet amount

### 2. **Separate Buy/Sell Gas Fees** ✅
- **Old:** `maxGasPriceGwei` (single limit)
- **New:** 
  - `buyGasGwei` - Gas limit for buys
  - `sellGasGwei` - Gas limit for sells

### 3. **Separate Buy/Sell Slippage** ✅
- **Old:** `slippagePercent` (single setting)
- **New:**
  - `buySlippagePercent` - Slippage for buys
  - `sellSlippagePercent` - Slippage for sells

### 4. **Take Profit Bag Percentage** ✅
- **New:** `takeProfitBagPercent` 
- **Purpose:** What percentage of bag to sell when take profit triggers
- **Example:** 50% means sell half your position

### 5. **Max Market Cap Filter** ✅
- **New:** `maxMarketCapUsd`
- **Purpose:** Only buy tokens with market cap below this USD value
- **0 = Unlimited**

### 6. **Token Age in Seconds** ✅
- **Old:** `maxTokenAgeHours` (in hours)
- **New:** `maxTokenAgeSeconds` (in seconds)
- **More precise control**
- **0 = Unlimited**

### 7. **Removed Min Liquidity** ✅
- **Old:** `minLiquidityUsd` - No longer used
- **Reason:** Simplified filtering

---

## 📊 New Config Schema

```javascript
{
  // Trading Mode
  copyBuyOnly: true/false,
  copySell: true/false,
  
  // Take Profit
  autoTakeProfitEnabled: true/false,
  takeProfitPercent: 100,        // % price increase to trigger
  takeProfitBagPercent: 100,     // % of bag to sell (NEW)
  
  // Buy Amount
  buyAmountBnb: 0.01,            // Fixed amount (NEW)
  
  // Gas Settings
  buyGasGwei: 10,                // Buy gas limit (NEW)
  sellGasGwei: 10,               // Sell gas limit (NEW)
  
  // Slippage
  buySlippagePercent: 2,         // Buy slippage (NEW)
  sellSlippagePercent: 2,        // Sell slippage (NEW)
  
  // Filters
  maxMarketCapUsd: 0,            // Max market cap (NEW) - 0 = unlimited
  maxTokenAgeSeconds: 0,         // Max age in seconds (NEW) - 0 = unlimited
  
  // Auto-Follow
  autoFollowEnabled: true/false,
  minTransferAmountBnb: 0.1,
  
  // Performance
  fastMode: true/false,
  gasMultiplier: 1.2
}
```

---

## 🔄 What Changed in Backend

### Config Model (`src/models/Config.js`)

**New Fields:**
- `buyAmountBnb` - Fixed buy amount
- `buyGasGwei` - Buy gas limit
- `sellGasGwei` - Sell gas limit
- `buySlippagePercent` - Buy slippage
- `sellSlippagePercent` - Sell slippage
- `takeProfitBagPercent` - Bag % to sell
- `maxMarketCapUsd` - Market cap filter
- `maxTokenAgeSeconds` - Age in seconds

**Deprecated (kept for backwards compatibility):**
- `maxBuyAmountBnb`
- `slippagePercent`
- `maxGasPriceGwei`
- `minLiquidityUsd` (removed from filters)
- `maxTokenAgeHours`

### Filters (`src/filters.js`)

**Updated Methods:**
1. `getBuyAmount()` - Returns fixed buy amount from config
2. `checkGasPrice(swapType)` - Uses buyGasGwei or sellGasGwei based on swap type
3. `checkTokenAge()` - Uses seconds instead of hours
4. `applyFilters()` - Removed liquidity and max amount checks
5. `getFixedBuyAmount()` - Replaces calculateAdjustedAmount

**Removed:**
- `checkMaxBuyAmount()` - No longer needed (fixed amount)
- `checkLiquidity()` - Removed entirely

### Tracker (`src/tracker.js`)

**Updated:**
- Uses `getFixedBuyAmount()` instead of `calculateAdjustedAmount()`
- Logs show "fixed buy amount" instead of "adjusted amount"
- printConfig shows all new fields

---

## 💡 How It Works Now

### Fixed Buy Amount

**Old Behavior:**
```
Watched wallet buys with 0.5 BNB
maxBuyAmountBnb = 0.1 BNB
→ Bot buys with 0.1 BNB (capped)
```

**New Behavior:**
```
Watched wallet buys with any amount
buyAmountBnb = 0.01 BNB
→ Bot always buys with 0.01 BNB (fixed)
```

### Separate Gas Limits

**Buy Transaction:**
```javascript
Gas limit: buyGasGwei (e.g., 10 Gwei)
```

**Sell Transaction:**
```javascript
Gas limit: sellGasGwei (e.g., 15 Gwei)
```

### Take Profit Bag %

**Example:**
```
Position: 1000 tokens
Price increase: 100% (trigger)
takeProfitBagPercent: 50%
→ Sell 500 tokens (keep 500)
```

### Token Age in Seconds

**Example:**
```
maxTokenAgeSeconds: 300 (5 minutes)
→ Only buy tokens created in last 5 minutes

maxTokenAgeSeconds: 0 (unlimited)
→ Buy tokens of any age
```

---

## 📝 Logs You'll See

### Startup Config

```
⚙️  Configuration:
   Mode: 🟢 BUY ONLY
   Buy Amount: 0.01 BNB (fixed)           ← NEW
   Buy Gas: 10 Gwei                       ← NEW
   Sell Gas: 10 Gwei                      ← NEW
   Buy Slippage: 2%                       ← NEW
   Sell Slippage: 2%                      ← NEW
   Max Token Age: 300s (5min)             ← NEW FORMAT
   Max Market Cap: $1,000,000             ← NEW
   Auto-Follow: Enabled
   Fast Mode: Enabled (1.2x gas)
   Take Profit: 100% gain → Sell 100% of bag  ← UPDATED
```

### During Trade

```
💰 Using fixed buy amount: 0.01 BNB (watched wallet bought 0.5 BNB)
🔍 Applying filters...
✅ Gas price 8 Gwei acceptable for BUY
✅ Token age 150s is acceptable
✅ All filters passed
🎯 Executing copy trade...
```

---

## 🎮 Frontend Updates Needed

### ConfigEditor Component

**You need to update the UI to show:**

1. **Take Profit Section:**
   - Take Profit Percent (% price increase)
   - Take Profit Bag % (% of bag to sell) ← NEW

2. **Buy Amount Section:**
   - Buy Amount (BNB) - Fixed amount ← RENAMED

3. **Gas Settings:**
   - Buy Gas (Gwei) ← NEW
   - Sell Gas (Gwei) ← NEW

4. **Slippage Settings:**
   - Buy Slippage (%) ← NEW
   - Sell Slippage (%) ← NEW

5. **Token Filters:**
   - Max Market Cap ($) ← NEW
   - Max Token Age (seconds) ← CHANGED FROM HOURS

6. **Remove:**
   - Min Liquidity field ← REMOVED

### Example ConfigEditor Form Structure

```jsx
{/* Take Profit */}
<div>
  <label>Take Profit Target (%)</label>
  <input value={takeProfitPercent} />
  
  <label>Sell What % of Bag</label>
  <input value={takeProfitBagPercent} />
</div>

{/* Buy Settings */}
<div>
  <label>Buy Amount (BNB) - Fixed</label>
  <input value={buyAmountBnb} step="0.001" />
  
  <label>Buy Gas (Gwei)</label>
  <input value={buyGasGwei} />
  
  <label>Buy Slippage (%)</label>
  <input value={buySlippagePercent} />
</div>

{/* Sell Settings */}
<div>
  <label>Sell Gas (Gwei)</label>
  <input value={sellGasGwei} />
  
  <label>Sell Slippage (%)</label>
  <input value={sellSlippagePercent} />
</div>

{/* Token Filters */}
<div>
  <label>Max Market Cap (USD) - 0 = Unlimited</label>
  <input value={maxMarketCapUsd} />
  
  <label>Max Token Age (Seconds) - 0 = Unlimited</label>
  <input value={maxTokenAgeSeconds} />
</div>
```

---

## ✅ Backend Complete

All backend changes are done:
- ✅ Config model updated
- ✅ Filter methods updated
- ✅ Tracker updated
- ✅ Logs updated
- ✅ Backwards compatibility maintained

---

## 🔄 Site Refresh on Wallet Switch

**Implemented:** ✅

When wallet switches:
```javascript
socket.on('walletSwitch', (data) => {
  console.log('🔄 WALLET SWITCHED!');
  fetchInitialData(); // Refreshes entire site
});
```

---

## 🚀 Deploy

```bash
git add .
git commit -m "Add new filter system with fixed buy amount, separate gas/slippage, market cap filter"
git push origin main
```

**Backend is complete and ready!**

---

## 📋 TODO: Frontend ConfigEditor UI

Update `frontend/src/components/ConfigEditor.jsx` with new form fields:
1. Show takeProfitBagPercent input
2. Rename maxBuyAmountBnb → buyAmountBnb
3. Add buyGasGwei and sellGasGwei inputs
4. Add buySlippagePercent and sellSlippagePercent inputs
5. Add maxMarketCapUsd input
6. Change maxTokenAgeHours → maxTokenAgeSeconds
7. Remove minLiquidityUsd input

Form data is already updated in state, just need to add the UI elements!

---

## 🎉 Summary

**Completed:**
- ✅ Fixed buy amount system
- ✅ Separate gas fees (buy/sell)
- ✅ Separate slippage (buy/sell)
- ✅ Take profit bag percentage
- ✅ Max market cap filter
- ✅ Token age in seconds
- ✅ Removed min liquidity
- ✅ Site refreshes on wallet switch
- ✅ All backend logic updated
- ✅ Backwards compatibility maintained

**Your bot now has more precise, flexible filters!** 🚀
