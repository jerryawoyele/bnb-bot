# 📊 Dashboard Setup Guide

## Overview

A beautiful, real-time React dashboard for monitoring and controlling your BNB Copy-Trading Bot.

### Features ✨

- **Real-time Updates** - WebSocket connection for live data
- **Position Tracking** - Monitor all open positions with live P&L
- **Trade History** - View recent trades as they happen
- **Bot Controls** - Change watched wallet, manual sells
- **Configuration Display** - View all bot settings
- **Modern UI** - Dark theme with Tailwind CSS
- **Responsive** - Works on desktop, tablet, and mobile

---

## 🚀 Quick Start

### 1. Install Backend Dependencies

```bash
cd "C:\Users\Jerry A\Desktop\BNB Bot"
npm install
```

This installs the API server dependencies (Express, Socket.IO, CORS).

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

This installs React, Vite, Tailwind CSS, and UI libraries.

### 3. Start the Backend (Bot + API)

```bash
cd "C:\Users\Jerry A\Desktop\BNB Bot"
npm start
```

This starts:
- ✅ The copy-trading bot
- ✅ API server on `http://localhost:3001`
- ✅ WebSocket server for real-time updates

### 4. Start the Frontend

Open a NEW terminal:

```bash
cd "C:\Users\Jerry A\Desktop\BNB Bot\frontend"
npm run dev
```

This starts the React dev server on `http://localhost:3000`

### 5. Open in Browser

Visit: **http://localhost:3000**

---

## 📱 Dashboard Features

### Header
- **Connection Status** - See if bot is connected
- **Bot Wallet** - Your bot's address
- **Balance** - Current BNB balance

### Status Card
- **Watched Wallet** - Address being copied (click edit to change)
- **Trading Mode** - BUY_ONLY or BUY_SELL
- **Speed Mode** - Fast mode status
- **Uptime** - How long bot has been running

### Statistics Grid
- Trades Executed
- Trades Failed  
- Trades Filtered
- Open Positions
- Take Profits Executed
- Wallet Switches

### Open Positions
- View all current holdings
- See profit/loss percentage
- Buy price and current value
- Manual sell button for each position
- Links to BSCScan

### Recent Trades
- Real-time trade feed
- Success/fail status
- Transaction links
- Error messages

### Configuration Panel
- Trading Settings
- Take Profit Settings
- Safety Filters
- Performance Settings

---

## 🎨 Screenshots

### Desktop View
```
┌─────────────────────────────────────────────────────┐
│  🤖 BNB Copy-Trading Bot    [●] Connected  0.52 BNB │
├─────────────────────────────────────────────────────┤
│                                                      │
│  👁️ Watching: 0x123...789  🎯 BUY_ONLY  ⚡ Fast    │
│                                                      │
│  📊 Stats                                            │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┐       │
│  │  15  │  2   │  8   │  3   │  5   │  0   │       │
│  │Exec'd│Failed│Filtr'd│Open│Take P│Switch│       │
│  └──────┴──────┴──────┴──────┴──────┴──────┘       │
│                                                      │
│  📦 Open Positions        📋 Recent Trades          │
│  ┌──────────────────┐    ┌──────────────────┐      │
│  │ Token: 0x123...  │    │ ↗ BUY  ✓         │      │
│  │ +125.5% 💰       │    │ Token: 0xabc...  │      │
│  │ Buy: 0.5 BNB     │    │ 0.5 BNB          │      │
│  │ [Sell Position]  │    │ 2 mins ago       │      │
│  └──────────────────┘    └──────────────────┘      │
│                                                      │
│  ⚙️ Configuration                                    │
│  Trading │ Take Profit │ Safety │ Performance       │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 API Endpoints

The bot exposes these REST endpoints:

### GET Endpoints
- `GET /api/health` - Health check
- `GET /api/status` - Bot status and config
- `GET /api/stats` - Trading statistics
- `GET /api/positions` - Open positions
- `GET /api/config` - Configuration
- `GET /api/wallet/balance` - Wallet balance

### POST Endpoints
- `POST /api/wallet/watch` - Change watched wallet
  ```json
  { "address": "0x..." }
  ```
- `POST /api/positions/:tokenAddress/sell` - Manual sell

### WebSocket Events
- `connect` - Connection established
- `stats` - Stats update (every 5s)
- `positions` - Positions update (every 10s)
- `trade` - New trade executed
- `transaction` - Transaction detected
- `takeProfit` - Take profit executed
- `walletChanged` - Watched wallet changed

---

## 🛠️ Development

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx           # Top navigation
│   │   ├── StatusCard.jsx       # Bot status display
│   │   ├── StatsGrid.jsx        # Statistics grid
│   │   ├── PositionsTable.jsx   # Open positions
│   │   ├── RecentTrades.jsx     # Trade feed
│   │   └── ConfigPanel.jsx      # Configuration display
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Tailwind styles
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
└── postcss.config.js            # PostCSS configuration
```

### Backend API Structure
```
server/
└── api.js                       # Express + Socket.IO server
```

### Adding New Features

**1. Add API Endpoint:**
```javascript
// server/api.js
this.app.get('/api/your-endpoint', (req, res) => {
  res.json({ data: 'your data' });
});
```

**2. Add Frontend Component:**
```jsx
// frontend/src/components/YourComponent.jsx
export default function YourComponent() {
  return <div>Your Component</div>;
}
```

**3. Connect WebSocket:**
```javascript
// frontend/src/App.jsx
socket.on('your-event', (data) => {
  console.log('Received:', data);
});
```

---

## 🐛 Troubleshooting

### Dashboard won't connect
**Problem:** "Connecting to Bot..." message stuck

**Solutions:**
1. Make sure bot is running: `npm start`
2. Check API server started on port 3001
3. Verify no firewall blocking port 3001
4. Check browser console for errors (F12)

### CORS Errors
**Problem:** `Access-Control-Allow-Origin` errors

**Solution:** API server already configured for CORS. If still seeing errors:
1. Make sure frontend is on port 3000
2. Check API server is on port 3001
3. Restart both servers

### WebSocket Disconnects
**Problem:** Connection keeps dropping

**Solution:**
1. Check internet connection
2. Restart backend server
3. Check for rate limiting on RPC

### Positions Not Showing
**Problem:** Open positions card is empty

**Solution:**
1. Make sure bot has executed buy trades
2. Check console logs for errors
3. Verify bot is recording positions

### Styles Not Loading
**Problem:** Dashboard looks broken/unstyled

**Solution:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📦 Production Build

### Build Frontend
```bash
cd frontend
npm run build
```

This creates `frontend/dist/` with optimized production files.

### Serve Production Build
```bash
npm run preview
```

Or use a production server like:
- **Nginx** - Serve static files
- **Netlify** - Deploy frontend
- **Vercel** - Deploy frontend

### Environment Variables

Create `frontend/.env`:
```env
VITE_API_URL=http://your-server:3001
```

---

## 🌐 Deploy to Production

### Option 1: Same Server

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Serve from Express:
```javascript
// Add to server/api.js
this.app.use(express.static('frontend/dist'));
```

3. Access at: `http://your-server:3001`

### Option 2: Separate Hosting

**Backend (Bot + API):**
- Deploy to VPS (DigitalOcean, Vultr, etc.)
- Run with PM2: `pm2 start src/index.js`
- Expose port 3001

**Frontend:**
- Build: `npm run build`
- Deploy to Netlify/Vercel
- Set `VITE_API_URL` to your backend URL

---

## 🔒 Security Notes

1. **Never expose your private key** through the API
2. **Use HTTPS** in production
3. **Add authentication** for public deployment
4. **Rate limit** API endpoints
5. **Validate all inputs** from frontend

---

## 🎨 Customization

### Change Colors
Edit `frontend/tailwind.config.js`:
```javascript
colors: {
  primary: '#your-color',
  secondary: '#your-color',
  success: '#your-color',
  danger: '#your-color',
}
```

### Add New Stats
Edit `StatsGrid.jsx`:
```javascript
{
  label: 'Your Stat',
  value: stats.yourStat || 0,
  icon: YourIcon,
  color: 'text-your-color',
  bgColor: 'bg-your-color/10'
}
```

---

## 📊 API Response Examples

### GET /api/status
```json
{
  "running": true,
  "watchedWallet": "0x123...",
  "botWallet": "0xabc...",
  "balance": "0.5234",
  "uptime": 3600,
  "config": {
    "mode": "BUY_ONLY",
    "takeProfitEnabled": true,
    "takeProfitPercent": 100,
    "fastMode": true,
    "oneTimeBuy": true
  }
}
```

### GET /api/positions
```json
[
  {
    "token": "0x123...",
    "buyPrice": 0.000123,
    "buyAmountBnb": 0.5,
    "tokenAmount": "4065040.65",
    "txHash": "0xabc...",
    "timestamp": 1234567890
  }
]
```

---

## 🆘 Support

- **Bot Issues:** Check main `README.md`
- **Dashboard Issues:** Check browser console (F12)
- **API Issues:** Check bot logs
- **WebSocket Issues:** Check network tab in browser

---

## 📝 Quick Commands Reference

```bash
# Install backend deps
npm install

# Install frontend deps
cd frontend && npm install

# Start backend (bot + API)
npm start

# Start frontend (dev mode)
cd frontend && npm run dev

# Build frontend (production)
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview

# Start with PM2
pm2 start src/index.js --name copy-bot

# View logs
pm2 logs copy-bot
```

---

**Your professional dashboard is ready! 🎉**

Access at **http://localhost:3000** after starting both backend and frontend.
