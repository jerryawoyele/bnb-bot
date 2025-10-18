# 🌐 BSC RPC Endpoints

## Working WebSocket Endpoints (Updated 2025)

### ✅ Free Public RPCs (No API Key Required)

**1. Public Node (Recommended for Testing)**
```
wss://bsc.publicnode.com
```
- ✅ No registration required
- ✅ WebSocket support
- ⚠️ Rate limited
- ⚠️ Not recommended for production

**2. BNB Chain Official**
```
wss://bsc-ws-node.nariox.org:443
```
- ✅ Free
- ⚠️ Can be unstable
- ⚠️ Often overloaded

**3. Moralis (Free Tier)**
```
wss://speedy-nodes-nyc.moralis.io/YOUR_API_KEY/bsc/mainnet/ws
```
- Sign up: https://moralis.io/
- Free tier: 40M compute units/month

### 🚀 Premium RPC Providers (Recommended)

**1. NodeReal (Best Choice)**
```
wss://bsc-mainnet.nodereal.io/ws/v1/YOUR_API_KEY
```
- Sign up: https://nodereal.io/
- Free tier: 5M API calls/day
- Excellent reliability
- WebSocket support

**2. Ankr**
```
wss://rpc.ankr.com/bsc/YOUR_API_KEY
```
- Sign up: https://www.ankr.com/
- Free tier: 500M requests/month
- Good performance

**3. QuickNode**
```
wss://YOUR_ENDPOINT.bsc.quiknode.pro/YOUR_API_KEY/
```
- Sign up: https://www.quicknode.com/
- Free trial available
- Very fast
- Premium features

**4. GetBlock**
```
wss://bsc.getblock.io/YOUR_API_KEY/mainnet/
```
- Sign up: https://getblock.io/
- Free tier: 40K requests/day

**5. Chainstack**
```
wss://ws-nd-YOUR_ID.p2pify.com/YOUR_API_KEY
```
- Sign up: https://chainstack.com/
- Free tier available

## 🛠️ How to Use

### 1. For Free Public RPC (Quick Testing)

Edit your `.env` file:
```env
WS_RPC=wss://bsc.publicnode.com
```

⚠️ **Warning**: Public RPCs are rate-limited and unreliable. Only use for testing!

### 2. For Production (Get API Key)

**Option A: NodeReal (Recommended)**

1. Visit https://nodereal.io/
2. Sign up for free account
3. Create a new project
4. Copy your WebSocket endpoint
5. Update `.env`:
```env
WS_RPC=wss://bsc-mainnet.nodereal.io/ws/v1/abc123yourkey
```

**Option B: Ankr**

1. Visit https://www.ankr.com/
2. Sign up and create API key
3. Update `.env`:
```env
WS_RPC=wss://rpc.ankr.com/bsc/abc123yourkey
```

## 🧪 Testing Your RPC

Test connection before running the bot:

**Windows PowerShell:**
```powershell
# Test with websocat (install: choco install websocat)
websocat wss://bsc.publicnode.com
```

**Or test with Node.js:**
```javascript
// test-rpc.js
import { ethers } from 'ethers';

const rpcUrl = 'wss://bsc.publicnode.com'; // Your RPC URL

async function testConnection() {
  try {
    console.log('Testing connection to:', rpcUrl);
    const provider = new ethers.WebSocketProvider(rpcUrl);
    await provider.ready;
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Connected! Current block:', blockNumber);
    provider.destroy();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
```

Run: `node test-rpc.js`

## 🔍 Checking RPC Status

- **BSC Status**: https://www.bnbchain.org/en/status
- **NodeReal Status**: https://status.nodereal.io/
- **Ankr Status**: https://status.ankr.com/

## ⚡ Performance Comparison

| Provider | Speed | Reliability | Free Tier | Rate Limit |
|----------|-------|-------------|-----------|------------|
| **NodeReal** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 5M calls/day | High |
| **Ankr** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 500M/month | Medium |
| **QuickNode** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Trial | High |
| **Public Node** | ⭐⭐⭐ | ⭐⭐⭐ | Unlimited | Low |
| **Moralis** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 40M CU | Medium |

## 💡 Recommendations

### For Testing (1-2 days)
```env
WS_RPC=wss://bsc.publicnode.com
```

### For Production (Serious Trading)
```env
WS_RPC=wss://bsc-mainnet.nodereal.io/ws/v1/YOUR_KEY
```

### For High Frequency Trading
- Use QuickNode or dedicated node
- Consider running your own BSC node

## 🚨 Troubleshooting

### Error: "getaddrinfo EAI_AGAIN"
- **Cause**: DNS resolution failed
- **Fix**: 
  1. Check internet connection
  2. Try different RPC endpoint
  3. Check if endpoint is down
  4. Use IP address instead of domain (if available)

### Error: "Connection timeout"
- **Cause**: RPC endpoint not responding
- **Fix**:
  1. Endpoint might be down
  2. Check firewall/antivirus
  3. Try different endpoint

### Error: "Too many requests"
- **Cause**: Rate limit exceeded
- **Fix**:
  1. Get API key from provider
  2. Upgrade to paid plan
  3. Switch to different provider

### Error: "Invalid response"
- **Cause**: Wrong chain or endpoint
- **Fix**:
  1. Make sure using BSC endpoint (not Ethereum)
  2. Verify WebSocket URL format
  3. Check API key is correct

## 📊 Current Recommended Setup (Dec 2025)

**Best for most users:**
```env
# Primary (NodeReal - Free tier)
WS_RPC=wss://bsc-mainnet.nodereal.io/ws/v1/YOUR_API_KEY

# Backup (Ankr - if NodeReal is down)
# WS_RPC=wss://rpc.ankr.com/bsc/YOUR_API_KEY

# Emergency (Public - if both above fail)
# WS_RPC=wss://bsc.publicnode.com
```

---

**Updated**: Oct 2025  
**Next Review**: Check endpoints quarterly as providers change
