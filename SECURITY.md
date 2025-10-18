# 🔒 Security Guidelines

## Critical Security Rules

### 1. Private Key Protection

**NEVER:**
- ❌ Share your private key with anyone
- ❌ Commit `.env` file to git/GitHub
- ❌ Hardcode private keys in source code
- ❌ Store private keys in cloud services
- ❌ Send private keys via email/messaging apps
- ❌ Take screenshots showing private keys

**ALWAYS:**
- ✅ Use a dedicated wallet for the bot
- ✅ Keep `.env` in `.gitignore`
- ✅ Store private keys securely offline
- ✅ Use environment variables
- ✅ Regularly rotate wallet keys
- ✅ Keep only necessary funds in bot wallet

### 2. Wallet Setup

```bash
# Create a NEW dedicated wallet
node -e "const ethers = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Address:', w.address, '\nPrivate Key:', w.privateKey);"
```

**Recommended Setup:**
- Main Wallet → (holds most of your funds)
- Bot Wallet → (only trading funds, auto-refill as needed)

### 3. Fund Management

**Best Practices:**
- Start with minimal funds (0.1 BNB for testing)
- Set `MAX_BUY_AMOUNT_BNB` conservatively
- Never keep more than necessary in bot wallet
- Regularly withdraw profits to main wallet
- Monitor bot wallet balance

### 4. RPC Provider Security

**Choose Secure Providers:**
- Use reputable providers (NodeReal, QuickNode, Ankr)
- Never use untrusted/free public RPCs for production
- Protect your RPC API keys
- Use WSS (WebSocket Secure) endpoints
- Rotate API keys periodically

**Bad Example:**
```env
WS_RPC=ws://random-free-rpc.com/insecure  # ❌ HTTP, untrusted
```

**Good Example:**
```env
WS_RPC=wss://bsc-mainnet.nodereal.io/ws/v1/YOUR_KEY  # ✅ HTTPS, trusted
```

## Common Attack Vectors

### 1. Honeypot Tokens
**What:** Tokens you can buy but cannot sell

**Protection:**
- Set `MIN_LIQUIDITY_BNB` high (50+ BNB)
- Use `ALLOWED_ROUTERS` to whitelist known DEXs
- Monitor first trades carefully
- Use honeypot detection APIs (optional enhancement)

### 2. Rug Pulls
**What:** Developers drain liquidity after token launch

**Protection:**
- Set `MAX_TOKEN_AGE_HOURS` to avoid very new tokens
- Require high `MIN_LIQUIDITY_BNB`
- Watch for locked liquidity (manual check)
- Set low `MAX_BUY_AMOUNT_BNB`

### 3. Frontrunning (MEV Bots)
**What:** Bots see your transaction and front-run it

**Protection:**
- Use moderate slippage (1-3%)
- Trade during low-activity times
- Consider using private RPCs
- Use Flashbots or MEV protection (advanced)

### 4. Gas Price Manipulation
**What:** Network congestion causes excessive gas fees

**Protection:**
- Set `MAX_GAS_PRICE_GWEI` limit
- Monitor BSC gas prices: https://bscscan.com/gastracker
- Bot will skip trades when gas is too high

### 5. Phishing & Social Engineering
**What:** Attackers pose as support/developers

**Never:**
- ❌ Share your screen showing private keys
- ❌ Enter private key on any website
- ❌ Trust "support" asking for wallet access
- ❌ Click suspicious links from strangers
- ❌ Install unverified software claiming to "boost" bot

## Environment Variable Security

### .env File Protection

```bash
# Check .env is in .gitignore
cat .gitignore | grep .env

# Should output: .env
```

### File Permissions (Linux/Mac)

```bash
# Restrict .env to owner only
chmod 600 .env

# Verify
ls -la .env
# Output: -rw------- (only you can read/write)
```

### Windows Protection

1. Right-click `.env` file
2. Properties → Security
3. Edit → Remove all users except yourself
4. Apply

## Code Security

### Dependency Audit

```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities
npm audit fix
```

### Update Dependencies

```bash
# Update to latest secure versions
npm update
```

## Operational Security

### 1. System Security
- ✅ Use updated operating system
- ✅ Install antivirus/antimalware
- ✅ Enable firewall
- ✅ Don't run bot on public WiFi
- ✅ Use VPN for additional privacy

### 2. Access Control
- ✅ Use strong passwords
- ✅ Enable 2FA on exchange accounts
- ✅ Don't leave bot running on shared computers
- ✅ Lock screen when away

### 3. Monitoring
- ✅ Check bot logs regularly
- ✅ Monitor wallet balance
- ✅ Review trades on BSCScan
- ✅ Set up balance alerts (Telegram)

### 4. Backup
- ✅ Backup `.env` to encrypted storage
- ✅ Keep private key in hardware wallet backup
- ✅ Document your configuration
- ✅ Save wallet recovery phrases securely

## Incident Response

### If Private Key is Compromised:

1. **IMMEDIATELY:**
   - Stop the bot (Ctrl+C)
   - Transfer all funds to new wallet
   - Create new bot wallet
   - Update `.env` with new private key

2. **Investigate:**
   - Check recent transactions
   - Review logs for unauthorized access
   - Scan system for malware

3. **Prevent:**
   - Never reuse compromised key
   - Review security practices
   - Enable additional monitoring

### If Bot Behaves Unexpectedly:

1. **Stop the bot immediately**
2. Check logs for errors
3. Verify configuration in `.env`
4. Review recent trades on BSCScan
5. Check wallet balance
6. Restart with conservative settings

## Regular Security Checklist

### Daily:
- [ ] Check bot is running correctly
- [ ] Review executed trades
- [ ] Verify wallet balance

### Weekly:
- [ ] Audit trade performance
- [ ] Check for unusual activity
- [ ] Review filter effectiveness
- [ ] Update blacklisted tokens if needed

### Monthly:
- [ ] Rotate RPC API keys
- [ ] Update dependencies (`npm update`)
- [ ] Review security logs
- [ ] Backup configuration

### Quarterly:
- [ ] Consider rotating bot wallet
- [ ] Review and update security practices
- [ ] Audit code for vulnerabilities
- [ ] Update to latest bot version

## Emergency Contacts

### If You Lose Access to Funds:
- BSC Support: https://www.bnbchain.org/en/community
- PancakeSwap Support: https://docs.pancakeswap.finance/contact-us

### Report Scams:
- BSCScan: https://bscscan.com/contactus
- BSC Community: https://www.bnbchain.org/en

## Additional Resources

- **BSC Security Tips:** https://academy.binance.com/en/articles/how-to-secure-your-cryptocurrency
- **Ethereum Security Best Practices:** https://consensys.github.io/smart-contract-best-practices/
- **DeFi Safety Guide:** https://academy.binance.com/en/articles/what-is-defi

---

**Remember: Security is not a feature, it's a requirement.**

Your funds are only as safe as your security practices. Take these guidelines seriously and never compromise on security for convenience.

🔒 Stay safe, trade smart!
