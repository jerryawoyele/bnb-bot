# ✅ Wallet Following Scenarios - How It Works

Your bot already handles all the scenarios you requested! Here's how it works:

---

## 🎯 Three Main Scenarios

### **Scenario 1: Wallet Transfers BNB Out Only**

```
Bot watching: Wallet A
     ↓
Wallet A transfers 0.5 BNB → Wallet B
     ↓
✅ Bot switches to Wallet B
     ↓
Bot now watching: Wallet B
```

**What happens:**
- Bot detects BNB_TRANSFER transaction
- Checks if amount >= minTransferAmountBnb (default 0.1 BNB)
- Switches to new wallet
- Clears bought tokens list
- Continues monitoring new wallet

---

### **Scenario 2: Wallet Buys Token Only**

```
Bot watching: Wallet A
     ↓
Wallet A buys Token X with 0.2 BNB
     ↓
✅ Bot copies trade (buys Token X)
     ↓
Bot still watching: Wallet A
```

**What happens:**
- Bot detects SWAP transaction (BUY)
- Checks if first time buying this token
- Applies filters (gas, token age, etc.)
- Executes copy trade with fixed buyAmountBnb
- Stays on same wallet

---

### **Scenario 3: Wallet Buys Token AND Transfers BNB Out** ⭐

```
Bot watching: Wallet A
     ↓
Wallet A buys Token X with 0.2 BNB
     ↓
✅ Bot copies trade (buys Token X)
     ↓
Wallet A transfers 0.5 BNB → Wallet B
     ↓
✅ Bot switches to Wallet B
     ↓
Bot now watching: Wallet B
(Already has Token X position)
```

**What happens:**
1. **First transaction (Buy):**
   - Bot detects SWAP (BUY) transaction
   - Copies trade immediately
   - Records position in Token X
   - Still watching Wallet A

2. **Second transaction (Transfer):**
   - Bot detects BNB_TRANSFER transaction
   - Switches to Wallet B
   - Clears bought tokens list for fresh start
   - Now watches Wallet B for new opportunities

**Result:** Bot has position in Token X AND follows to Wallet B! ✅

---

## 🔄 How Transactions Are Processed

### Block-by-Block Monitoring

```javascript
WebSocket listens for new blocks
     ↓
For each block, check transactions
     ↓
Filter transactions from watched wallet
     ↓
Process each transaction sequentially:
  1. Analyze type (SWAP, BNB_TRANSFER, etc.)
  2. If SWAP → Handle copy trade
  3. If BNB_TRANSFER → Handle wallet switch
     ↓
Continue monitoring new wallet
```

### Sequential Processing

**Important:** Transactions are processed in order as they appear in blocks.

**Example:**
```
Block 12345:
  - Tx 1: Wallet A buys Token X → Bot copies ✅
  
Block 12346:
  - Tx 2: Wallet A transfers BNB → Bot switches ✅
```

**Both actions complete successfully!**

---

## 📊 Real-World Example

### Complete Flow

```
Time: 10:00:00
Bot watching: 0xWALLET_A

Time: 10:00:05
0xWALLET_A buys PEPE token
Bot log:
  📡 Detected SWAP from watched wallet
  💱 Swap detected: BUY
  ✅ First time buying 0xPEPE - proceeding!
  🎯 Executing copy trade...
  ✅ Copy trade executed successfully!

Bot status:
  - Watching: 0xWALLET_A
  - Position: PEPE (100 tokens)

Time: 10:00:15
0xWALLET_A transfers 1 BNB to 0xWALLET_B
Bot log:
  📡 Detected BNB_TRANSFER from watched wallet
  💸 BNB transfer detected: 1 BNB to 0xWALLET_B
  ✅ Transfer amount meets threshold
  🔄 WALLET SWITCH
     Old: 0xWALLET_A
     New: 0xWALLET_B
  🔄 Cleared bought tokens list for new wallet
  📡 Broadcasting wallet switch to all clients

Bot status:
  - Watching: 0xWALLET_B
  - Position: PEPE (100 tokens) ← Still has this!
  - Ready to copy new trades from 0xWALLET_B

Time: 10:00:30
0xWALLET_B buys DOGE token
Bot log:
  📡 Detected SWAP from watched wallet
  💱 Swap detected: BUY
  ✅ First time buying 0xDOGE - proceeding!
  🎯 Executing copy trade...
  ✅ Copy trade executed successfully!

Bot status:
  - Watching: 0xWALLET_B
  - Positions: PEPE (100 tokens), DOGE (50 tokens)
```

---

## 🎮 Key Features

### 1. **Independent Transaction Processing**
- Each transaction processed separately
- Buy doesn't affect transfer logic
- Transfer doesn't affect buy logic
- Both can execute in same session

### 2. **State Management**
- Positions tracked separately from wallet following
- Bought tokens list clears on wallet switch
- Can have positions from multiple wallets

### 3. **No Interference**
- Copying a trade doesn't prevent wallet switching
- Switching wallets doesn't cancel positions
- Both actions complete independently

---

## 💡 Why It Works

### The Secret: Sequential Processing

```javascript
// Transaction 1: BUY
if (this.decoder.isSwapTransaction(analysis)) {
  await this.handleSwapTransaction(analysis, tx);
  // ✅ Trade copied, position recorded
}

// Transaction 2: TRANSFER (separate tx, separate call)
else if (analysis.type === 'BNB_TRANSFER') {
  await this.handleBnbTransfer(analysis, tx);
  // ✅ Wallet switched, ready for new trades
}
```

**Each transaction is handled independently!**

---

## 🧪 Test Scenarios

### Test 1: Buy Then Transfer
```
1. Wallet A buys Token X
   → Bot copies ✅
   
2. Wallet A sends BNB to Wallet B
   → Bot switches ✅
   
3. Check: Bot has Token X AND watches Wallet B ✅
```

### Test 2: Transfer Then Buy
```
1. Wallet A sends BNB to Wallet B
   → Bot switches to Wallet B ✅
   
2. Wallet B buys Token Y
   → Bot copies Token Y ✅
   
3. Check: Bot watches Wallet B with Token Y position ✅
```

### Test 3: Multiple Buys Then Transfer
```
1. Wallet A buys Token X
   → Bot copies ✅
   
2. Wallet A buys Token Y
   → Bot skips (already bought once) ❌
   
3. Wallet A sends BNB to Wallet B
   → Bot switches ✅
   
4. Wallet B buys Token Y
   → Bot copies (new wallet, fresh start) ✅
   
5. Check: Bot has X and Y, watches Wallet B ✅
```

### Test 4: Buy, Transfer, Buy Chain
```
1. Wallet A buys Token X
   → Bot copies ✅
   
2. Wallet A → BNB → Wallet B
   → Bot switches to B ✅
   
3. Wallet B buys Token Y
   → Bot copies ✅
   
4. Wallet B → BNB → Wallet C
   → Bot switches to C ✅
   
5. Wallet C buys Token Z
   → Bot copies ✅
   
Result: Bot has X, Y, Z and watches Wallet C ✅
```

---

## 📋 Position Management

### How Positions Work

**Positions persist across wallet switches:**
```
Wallet A: Buy PEPE → Position: PEPE
Switch to Wallet B → Position: PEPE (still there)
Wallet B: Buy DOGE → Positions: PEPE, DOGE
Switch to Wallet C → Positions: PEPE, DOGE (both still there)
```

**Take Profit works on all positions:**
```
If PEPE price increases 100% → Auto sell (regardless of which wallet)
If DOGE price increases 100% → Auto sell (regardless of which wallet)
```

---

## 🔧 Configuration

### Required Settings

**Enable Auto-Follow:**
```javascript
autoFollowEnabled: true
```

**Set Minimum Transfer Amount:**
```javascript
minTransferAmountBnb: 0.1  // Only switch if >= 0.1 BNB transferred
```

**One-Time Buy (Always Enabled):**
- Bot only buys each token once per wallet
- Cleared on wallet switch
- Fresh start with new wallet

---

## 🎯 Summary

### Your Requirements vs Reality

✅ **Wallet transfers BNB out → Follow to next account**
- Working! Bot detects BNB transfers and switches wallets

✅ **Wallet buys token → Copytrade the wallet**
- Working! Bot copies all buy trades immediately

✅ **Wallet buys token AND transfers BNB → Do both**
- Working! Bot copies the trade, then switches wallets
- Keeps the position from first wallet
- Ready to copy trades from new wallet

---

## 🚀 No Changes Needed!

**Your bot already handles all three scenarios perfectly!**

The sequential transaction processing ensures:
1. Each buy is copied
2. Each transfer switches wallets
3. Positions are maintained across switches
4. Bot continues following the chain indefinitely

**It just works!** 🎉

---

## 📝 Logs You'll See

### Buy + Transfer Scenario

```
📡 Detected SWAP from watched wallet: 0x123...
💱 Swap detected: BUY
   Token Out: 0xPEPE...
✅ First time buying 0xPEPE - proceeding with copy trade!
🔍 Applying filters...
✅ All filters passed
🎯 Executing copy trade...
✅ Trade executed successfully!

[Few seconds later...]

📡 Detected BNB_TRANSFER from watched wallet: 0x456...
💸 BNB transfer detected: 1 BNB to 0xWALLET_B...
✅ Transfer amount 1 BNB meets threshold 0.1 BNB

🔄 WALLET SWITCH
   Old Wallet: 0xWALLET_A...
   New Wallet: 0xWALLET_B...
   Reason: BNB transfer of 1 BNB detected
   Bot will now copy trades from new wallet

🔄 Cleared bought tokens list for new wallet
📡 Broadcasting wallet switch to all clients
```

---

**Everything you requested is already implemented and working! 🎊**
