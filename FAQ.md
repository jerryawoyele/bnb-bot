# ❓ Frequently Asked Questions (FAQ)

## General Questions

### Q: What is copy-trading?
**A:** Copy-trading means automatically replicating the trades of another wallet (leader). When they buy a token, your bot buys it too. When they sell, you sell.

### Q: Is this legal?
**A:** Yes, copy-trading on decentralized exchanges is legal. You're simply monitoring public blockchain data and executing your own trades. However, check your local regulations regarding cryptocurrency trading.

### Q: How much money do I need to start?
**A:** Minimum 0.1 BNB to start testing. Recommended 0.5+ BNB for actual trading. Start small and scale up.

### Q: Can I lose money?
**A:** Yes. All trading involves risk. You can lose money from:
- Bad trades (leader makes poor decisions)
- Honeypot tokens (can't sell)
- Rug pulls (liquidity removed)
- Gas fees (even failed transactions cost gas)
- Frontrunning by MEV bots

## Technical Questions

### Q: Why WebSocket and not HTTP?
**A:** WebSocket provides real-time updates. HTTP requires constant polling, which is slower and less efficient. Speed matters in copy-trading.

### Q: What's the difference between PancakeSwap v2 and v3?
**A:** 
- **v2**: Original version, most widely used, simpler
- **v3**: Newer, concentrated liquidity, more complex

This bot is configured for v2 by default. V3 support can be added.

### Q: How fast does the bot execute trades?
**A:** Typically 1-3 seconds after leader's transaction is detected. Speed depends on:
- WebSocket latency
- Gas price you're willing to pay
- Network congestion
- Filter processing time

### Q: Can I copy multiple wallets at once?
**A:** Current version watches one wallet at a time. You can run multiple instances with different `.env` files, or modify the code to support multiple wallets.

### Q: What happens if the bot loses connection?
**A:** The bot will throw an error and stop. Consider implementing auto-reconnect logic or monitoring services.

## Configuration Questions

### Q: What's a good slippage setting?
**A:**
- **1-2%**: Conservative, lower risk, some trades may fail
- **3-5%**: Balanced, most trades succeed
- **5-10%**: Aggressive, higher success rate but vulnerable to frontrunning

BSC typically requires 2-5% for new tokens.

### Q: How do I find good wallets to copy?
**A:** Look for:
- Consistently profitable wallets
- High win rates (check on BSCScan)
- Reasonable trade sizes
- Active trading on legitimate DEXs
- Follow "smart money" addresses shared in communities

**Resources:**
- DexScreener top traders
- BSCScan whale tracker
- Crypto Twitter/Telegram groups
- On-chain analytics platforms

### Q: Should I enable auto-follow?
**A:**
- **Enable** if: You trust the leader's strategy, want to follow their full portfolio
- **Disable** if: You only want to copy a specific wallet, concerned about security

### Q: What's a safe MAX_BUY_AMOUNT_BNB?
**A:**
- **Testing**: 0.01-0.05 BNB
- **Conservative**: 0.1-0.5 BNB
- **Moderate**: 0.5-1.0 BNB
- **Aggressive**: 1.0+ BNB (only if you know what you're doing)

Never risk more than you can afford to lose per trade.

## Trading Questions

### Q: Why did my trade fail?
**A:** Common reasons:
1. **Slippage too low**: Increase `SLIPPAGE_PERCENT`
2. **Insufficient BNB**: Add more funds to bot wallet
3. **Gas price too high**: Network congestion, wait or increase `MAX_GAS_PRICE_GWEI`
4. **Honeypot token**: Can't sell, add to blacklist
5. **Insufficient liquidity**: Token pool too small

### Q: What's a honeypot and how do I avoid it?
**A:** Honeypot = Token you can buy but not sell (scam).

**Protection:**
- Set high `MIN_LIQUIDITY_BNB` (50+)
- Use `ALLOWED_ROUTERS` (whitelist trusted DEXs)
- Check token contract before trading
- Use honeypot checker tools
- Start with small amounts

### Q: The bot bought a token but I can't sell it. What now?
**A:** Likely a honeypot. 
1. Add token to `BLACKLISTED_TOKENS`
2. Try selling manually with high slippage
3. If still fails, consider the funds lost
4. Report token as scam on BSCScan
5. Improve your filters to prevent future honeypots

### Q: How do I sell tokens the bot bought?
**A:** The bot will automatically sell when the leader sells. To sell manually:
1. Stop the bot
2. Use PancakeSwap directly with your bot wallet
3. Or modify the code to add manual sell functionality

### Q: Can I set the bot to only buy or only sell?
**A:** Yes, modify `handleSwapTransaction` in `tracker.js`:
```javascript
// Only copy BUY trades
if (analysis.swapType !== 'BUY') {
  return;
}
```

## Performance Questions

### Q: What's a good win rate?
**A:** Depends on strategy:
- **60%+** trades profitable = Excellent
- **50-60%** = Good
- **40-50%** = Average
- **<40%** = Poor, reconsider leader wallet

Remember: One big win can offset multiple small losses.

### Q: How do I track my profits?
**A:** Currently:
- Check wallet on BSCScan
- Review transaction history
- Calculate manually

Future enhancement: Built-in profit tracking database.

### Q: Should I leave the bot running 24/7?
**A:**
- **Pros**: Never miss a trade, fully automated
- **Cons**: System/network issues, security concerns

**Best practice**: Run during leader's active hours, monitor regularly.

## Security Questions

### Q: Is my private key safe?
**A:** Your private key is stored locally in `.env` file. It never leaves your computer unless:
- You commit it to GitHub (don't!)
- Your system is compromised (use antivirus)
- You share it (never!)

See `SECURITY.md` for detailed guidelines.

### Q: Can the bot get hacked?
**A:** Possible attack vectors:
- Compromised system (malware)
- Leaked private key
- Vulnerable dependencies
- Malicious RPC provider

**Protection**: Follow security best practices in `SECURITY.md`

### Q: What if I accidentally commit my .env file?
**A:**
1. **IMMEDIATELY** transfer all funds to new wallet
2. Remove .env from git history
3. Rotate all API keys
4. Create new bot wallet
5. Update .env with new credentials

## Troubleshooting

### Q: Bot says "Configuration errors"
**A:** Check your `.env` file:
- All required fields filled?
- Valid wallet addresses?
- RPC URL correct?
- Private key 64 characters (no 0x prefix)?

### Q: Bot connects but detects no transactions
**A:** Possible issues:
- Watched wallet is not trading
- Watched wallet only uses DEXs you haven't whitelisted
- WebSocket connection dropped
- Bot started between trades

**Solution**: Wait, verify wallet is active, check logs.

### Q: "Insufficient funds" error
**A:** 
1. Check bot wallet balance on BSCScan
2. Add more BNB
3. Reduce `MAX_BUY_AMOUNT_BNB`
4. Remember: You need BNB for trade + gas

### Q: Trades execute slowly
**A:** Possible causes:
- Slow RPC provider (switch providers)
- Low gas price (increase `MAX_GAS_PRICE_GWEI`)
- Network congestion (wait or increase gas)
- Complex filters (optimize filter checks)

### Q: Bot stops after few hours
**A:** Common causes:
- WebSocket timeout (implement reconnection)
- Uncaught error (check logs)
- System sleep/hibernation (disable)
- Memory leak (restart periodically)

## Advanced Questions

### Q: Can I add my own filters?
**A:** Yes! Edit `src/filters.js` and add your custom filter:
```javascript
async checkCustomFilter(tradeData) {
  // Your logic here
  return { passed: true/false, reason: 'explanation' };
}
```

Then call it in `applyFilters()`.

### Q: How do I add Telegram notifications?
**A:** 
1. Create Telegram bot with @BotFather
2. Get your chat ID
3. Update `.env`:
```env
ENABLE_TELEGRAM_ALERTS=true
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```
4. Notifications are in `src/notifications.js` (integrate with tracker)

### Q: Can I use this on other chains (Ethereum, Polygon)?
**A:** Yes, with modifications:
1. Change RPC endpoints to target chain
2. Update router addresses (Uniswap for Ethereum, QuickSwap for Polygon)
3. Adjust gas settings for chain
4. Update WBNB to WETH/WMATIC

### Q: How do I backtest a wallet's performance?
**A:** Use blockchain explorers:
1. Visit BSCScan
2. Enter wallet address
3. Filter by "Token Transfers" 
4. Analyze historical trades
5. Calculate historical profit/loss

Or build custom analytics with blockchain APIs.

### Q: Can I add a UI/dashboard?
**A:** Yes! Potential enhancements:
- Web dashboard (React/Vue)
- Trade history visualization
- Real-time statistics
- Manual trade controls
- Multi-wallet management

This requires additional development.

## Support & Community

### Q: Where can I get help?
**A:** 
- Read documentation: `README.md`, `SECURITY.md`, `QUICKSTART.md`
- Check logs for error messages
- Review this FAQ
- Search GitHub issues (if applicable)

### Q: Can I contribute improvements?
**A:** Yes! Contributions welcome:
- Bug fixes
- New features
- Documentation improvements
- Security enhancements

### Q: Is there a Telegram/Discord group?
**A:** This is a self-hosted bot. Community features depend on the project's distribution.

## Legal & Disclaimer

### Q: Is this financial advice?
**A:** No. This is educational software. Always do your own research (DYOR).

### Q: Who's responsible if I lose money?
**A:** You are. The bot is provided "as-is" without warranty. See `LICENSE` file.

### Q: Can I sell this bot to others?
**A:** Check the `LICENSE` file. MIT license allows commercial use, but you must include the original copyright notice.

---

## Quick Answers Summary

| Question | Quick Answer |
|----------|--------------|
| Minimum BNB needed | 0.1 BNB (0.5+ recommended) |
| Best slippage | 2-5% |
| Safe max buy | 0.1-0.5 BNB |
| Execution speed | 1-3 seconds |
| Can lose money? | Yes, all trading has risk |
| Private key safe? | Yes, if you follow security practices |
| Multiple wallets? | Run multiple instances or modify code |
| Works on other chains? | Yes, with modifications |

---

**Still have questions?** 

Check the code comments in `src/` directory for technical details, or read the full documentation in `README.md`.

**Remember**: Start small, test thoroughly, and never risk more than you can afford to lose! 🚀
