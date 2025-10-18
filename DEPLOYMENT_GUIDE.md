# 🚀 Deployment Guide - Host Bot Online

Complete guide for deploying your BNB Copy-Trading Bot to the cloud with MongoDB

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [MongoDB Atlas Setup](#mongodb-atlas-setup)
3. [Backend Deployment (Railway/Render)](#backend-deployment)
4. [Frontend Deployment (Vercel/Netlify)](#frontend-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Testing Deployment](#testing-deployment)
7. [Domain Setup](#domain-setup)
8. [Maintenance](#maintenance)

---

## ✅ Prerequisites

### Required Accounts (All Free Tier Available)
- [ ] **MongoDB Atlas** - Database hosting (https://www.mongodb.com/atlas)
- [ ] **Railway** or **Render** - Backend hosting (recommended for Node.js)
- [ ] **Vercel** or **Netlify** - Frontend hosting
- [ ] **GitHub** account - For deployment

### What You'll Deploy
```
┌──────────────────────────────────┐
│   Frontend (Vercel/Netlify)      │  ← Dashboard UI
│   https://your-bot.vercel.app    │
└─────────┬────────────────────────┘
          │
          ↓
┌──────────────────────────────────┐
│   Backend (Railway/Render)       │  ← Bot + API
│   https://your-bot.up.railway.app│
└─────────┬────────────────────────┘
          │
          ↓
┌──────────────────────────────────┐
│   MongoDB Atlas                  │  ← Database
│   Cloud Database                 │
└──────────────────────────────────┘
```

---

## 🗄️ MongoDB Atlas Setup

### Step 1: Create MongoDB Account
1. Go to https://www.mongodb.com/atlas
2. Sign up (free)
3. Choose **Free M0** cluster

### Step 2: Create Database
1. Click **"Build a Database"**
2. Select **M0 (Free)** tier
3. Choose **Cloud Provider**: AWS
4. Select **Region**: Closest to you
5. Cluster Name: `bnb-bot`
6. Click **"Create"**

### Step 3: Configure Database Access
1. Go to **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **Username/Password** auth
4. Username: `botuser`
5. Password: Generate strong password (save it!)
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

### Step 4: Configure Network Access
1. Go to **"Network Access"**
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ This is needed for Railway/Render to connect
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **"Database"** → Click **"Connect"**
2. Choose **"Connect your application"**
3. Driver: **Node.js** / Version: **5.5 or later**
4. Copy connection string:
   ```
   mongodb+srv://botuser:<password>@bnb-bot.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name: `/bnb-copy-bot` before the `?`
   ```
   mongodb+srv://botuser:yourpassword@bnb-bot.xxxxx.mongodb.net/bnb-copy-bot?retryWrites=true&w=majority
   ```
7. **Save this!** You'll need it for environment variables

---

## 🖥️ Backend Deployment

### Option A: Railway (Recommended - Easier)

#### Step 1: Prepare GitHub Repository
1. Initialize Git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create GitHub repository
3. Push code:
   ```bash
   git remote add origin https://github.com/yourusername/bnb-bot.git
   git push -u origin main
   ```

#### Step 2: Deploy to Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your `bnb-bot` repository
6. Railway auto-detects Node.js ✅

#### Step 3: Configure Environment Variables
1. Go to your project → **Variables** tab
2. Add these variables:

```env
# Blockchain RPC
WS_RPC=wss://bsc.publicnode.com
HTTP_RPC=https://bsc-dataseed1.binance.org/

# Your private key (CRITICAL!)
PRIVATE_KEY=your_private_key_here

# PancakeSwap
PANCAKE_ROUTER=0x10ED43C718714eb63d5aA57B78B54704E256024E
WBNB=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c

# Trading settings
COPY_BUY_ONLY=true
COPY_SELL=false
AUTO_TAKE_PROFIT_ENABLED=true
TAKE_PROFIT_PERCENT=100
MAX_BUY_AMOUNT_BNB=0.5
SLIPPAGE_PERCENT=2
MIN_LIQUIDITY_USD=10000
MAX_TOKEN_AGE_HOURS=72
ONE_TIME_BUY_PER_TOKEN=true
AUTO_FOLLOW_ENABLED=true
MIN_TRANSFER_AMOUNT_BNB=0.1
FAST_MODE=true
GAS_MULTIPLIER=1.2
LOG_LEVEL=info

# MongoDB (paste your connection string)
MONGODB_URI=mongodb+srv://botuser:password@bnb-bot.xxxxx.mongodb.net/bnb-copy-bot?retryWrites=true&w=majority

# Port (Railway auto-assigns)
PORT=3001
API_PORT=3001

# Frontend URL (update after deploying frontend)
FRONTEND_URL=https://your-bot.vercel.app
```

#### Step 4: Deploy
1. Railway auto-deploys on push ✅
2. Get your backend URL: `https://your-bot.up.railway.app`
3. Test: Open `https://your-bot.up.railway.app/api/health`
   - Should see: `{"status":"ok","dbConnected":true}`

---

### Option B: Render

#### Step 1: Push to GitHub
Same as Railway Step 1

#### Step 2: Deploy to Render
1. Go to https://render.com
2. Sign up (free tier available)
3. Click **"New +"** → **"Web Service"**
4. Connect GitHub repository
5. Configure:
   - **Name**: `bnb-copy-bot`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### Step 3: Add Environment Variables
1. Go to **Environment** tab
2. Add all variables from Railway example above

#### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Get URL: `https://bnb-copy-bot.onrender.com`

---

## 🎨 Frontend Deployment

### Option A: Vercel (Recommended)

#### Step 1: Build Frontend Locally
```bash
cd frontend
npm install
npm run build
```

#### Step 2: Deploy to Vercel
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **"Add New"** → **"Project"**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### Step 3: Environment Variables
1. Add environment variable:
   ```
   VITE_API_URL=https://your-bot.up.railway.app
   ```
   (Use your Railway/Render URL)

#### Step 4: Deploy
1. Click **"Deploy"**
2. Get URL: `https://your-bot.vercel.app`
3. **Update backend FRONTEND_URL** environment variable with this URL

---

### Option B: Netlify

#### Step 1: Build Frontend
```bash
cd frontend
npm install
npm run build
```

#### Step 2: Deploy to Netlify
1. Go to https://netlify.com
2. Sign up
3. Drag & drop `frontend/dist` folder
   OR
4. Connect GitHub and auto-deploy

#### Step 3: Environment Variables
1. Go to **Site settings** → **Environment variables**
2. Add:
   ```
   VITE_API_URL=https://your-bot.up.railway.app
   ```

#### Step 4: Configure Build
1. **Build command**: `cd frontend && npm run build`
2. **Publish directory**: `frontend/dist`

---

## ⚙️ Environment Configuration

### Complete .env Setup

**Backend (.env on Railway/Render):**
```env
# === CRITICAL SETTINGS ===
PRIVATE_KEY=your_actual_private_key_here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bnb-copy-bot

# === RPC ENDPOINTS ===
WS_RPC=wss://bsc.publicnode.com
HTTP_RPC=https://bsc-dataseed1.binance.org/

# === CONTRACTS ===
PANCAKE_ROUTER=0x10ED43C718714eb63d5aA57B78B54704E256024E
WBNB=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c

# === TRADING SETTINGS ===
COPY_BUY_ONLY=true
COPY_SELL=false
AUTO_TAKE_PROFIT_ENABLED=true
TAKE_PROFIT_PERCENT=100
MAX_BUY_AMOUNT_BNB=0.5
SLIPPAGE_PERCENT=2
MIN_LIQUIDITY_USD=10000
MAX_TOKEN_AGE_HOURS=72
ONE_TIME_BUY_PER_TOKEN=true
AUTO_FOLLOW_ENABLED=true
MIN_TRANSFER_AMOUNT_BNB=0.1
FAST_MODE=true
GAS_MULTIPLIER=1.2
LOG_LEVEL=info

# === API SETTINGS ===
PORT=3001
API_PORT=3001
FRONTEND_URL=https://your-bot.vercel.app
```

**Frontend (Vercel/Netlify):**
```env
VITE_API_URL=https://your-bot.up.railway.app
```

---

## 🧪 Testing Deployment

### 1. Test MongoDB Connection
```bash
# From your backend logs (Railway/Render)
✅ MongoDB connected successfully
```

### 2. Test Backend API
Open browser:
```
https://your-bot.up.railway.app/api/health
```

Should see:
```json
{
  "status": "ok",
  "timestamp": 1703046324123,
  "dbConnected": true
}
```

### 3. Test Frontend
1. Open `https://your-bot.vercel.app`
2. Should see connection screen
3. Should connect to backend
4. Try starting bot

### 4. Test Bot Control
1. Go to **Control** tab
2. Click **"Start Auto Detection"**
3. Check logs for activity
4. Verify in MongoDB: Sessions should be created

---

## 🌐 Custom Domain (Optional)

### For Frontend (Vercel)
1. Go to **Settings** → **Domains**
2. Add custom domain: `bot.yourdomain.com`
3. Update DNS records (Vercel provides instructions)
4. SSL certificate auto-provisioned ✅

### For Backend (Railway)
1. Go to **Settings** → **Networking** → **Custom Domain**
2. Add domain: `api.yourdomain.com`
3. Update DNS CNAME record
4. SSL certificate auto-provisioned ✅

### Update Environment Variables
After adding custom domains:
- **Backend**: Update `FRONTEND_URL` to `https://bot.yourdomain.com`
- **Frontend**: Update `VITE_API_URL` to `https://api.yourdomain.com`

---

## 🔐 Security Best Practices

### 1. Private Key Security
- ⚠️ **NEVER** commit `.env` to Git
- Use environment variables on hosting platform
- Rotate keys if exposed
- Use separate wallet for bot (not main wallet)

### 2. MongoDB Security
- ✅ Strong password
- ✅ Network access limited (if possible)
- ✅ Regular backups
- ✅ Monitor unusual activity

### 3. API Security
- CORS configured (FRONTEND_URL only)
- Rate limiting (optional)
- HTTPS enforced

### 4. Monitoring
- Check Railway/Render logs regularly
- Monitor MongoDB usage
- Set up alerts for errors

---

## 📊 Monitoring & Maintenance

### Railway Dashboard
- **Logs**: View real-time logs
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: Version history

### MongoDB Atlas
- **Metrics**: Database operations
- **Performance**: Query performance
- **Storage**: Data size tracking

### Backup Strategy
1. **MongoDB**: Auto-backups in Atlas (free tier)
2. **Code**: GitHub repository
3. **Sessions**: Export via API

---

## 💰 Costs

### Free Tier Limits

**MongoDB Atlas (M0 Free)**
- 512 MB storage
- Shared RAM
- Enough for ~10,000 sessions

**Railway (Free)**
- $5 credit/month
- ~500 hours
- 1 GB RAM
- More than enough for bot

**Vercel (Free)**
- Unlimited bandwidth
- 100 GB/month
- Perfect for dashboard

**Total Cost: $0/month** (within free tiers)

### If You Exceed Free Tier

**Railway (Hobby Plan): $5/month**
- Unlimited hours
- 8 GB RAM
- Priority support

**MongoDB (M2): $9/month**
- 2 GB storage
- Dedicated cluster
- Better performance

---

## 🐛 Troubleshooting

### Backend Won't Start
**Check:**
1. All environment variables set
2. MongoDB connection string correct
3. PRIVATE_KEY is valid
4. Logs for specific error

### Frontend Can't Connect
**Check:**
1. VITE_API_URL correct
2. Backend is running
3. CORS settings (FRONTEND_URL matches)
4. Browser console for errors

### Bot Not Trading
**Check:**
1. Bot is started (Control tab)
2. Wallet has BNB balance
3. RPC endpoint working
4. Logs for filter reasons

### MongoDB Connection Failed
**Check:**
1. Connection string format
2. Password URL-encoded (special chars)
3. IP whitelist (0.0.0.0/0 for cloud)
4. User has correct permissions

---

## 📝 Deployment Checklist

Before going live:

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string obtained
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Backend deployed (Railway/Render)
- [ ] All environment variables set on backend
- [ ] Backend health check passes
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Frontend environment variable set (VITE_API_URL)
- [ ] Frontend connects to backend
- [ ] Bot wallet has BNB for gas
- [ ] Tested bot start/stop
- [ ] Verified session creation in MongoDB
- [ ] Logs are working
- [ ] Smart detection tested (if using)

---

## 🎉 You're Live!

Your bot is now hosted online and accessible from anywhere!

**What You Can Do:**
✅ Start/stop bot from web dashboard  
✅ Monitor trades in real-time  
✅ View historical sessions  
✅ Access from any device  
✅ Data persists in MongoDB  
✅ 24/7 uptime (cloud hosted)  

**Next Steps:**
1. Bookmark your dashboard URL
2. Set up mobile access
3. Monitor performance
4. Adjust trading parameters
5. Review sessions regularly

---

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **GitHub Issues**: Create issues for bug reports

---

## 🔄 Updates & Maintenance

### Updating Code
```bash
# Local changes
git add .
git commit -m "Update feature"
git push origin main

# Railway/Render auto-deploys ✅
# Vercel auto-deploys ✅
```

### Database Maintenance
- MongoDB Atlas handles backups
- Export sessions periodically
- Monitor storage usage

### Scaling
When you outgrow free tiers:
1. **Upgrade Railway**: $5/month
2. **Upgrade MongoDB**: $9/month (M2 cluster)
3. **Keep Vercel free**: Generous limits

---

**🚀 Your bot is now production-ready and accessible worldwide!**
