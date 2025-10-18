import axios from 'axios';
import { config } from './config.js';
import { logger } from './logger.js';

/**
 * Enhanced Telegram notification service
 * Always-active bot for trade alerts, watch alerts, and profit tracking
 */
export class NotificationService {
  constructor() {
    this.enabled = config.enableTelegramAlerts;
    this.botToken = config.telegramBotToken;
    this.chatId = config.telegramChatId;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.lastAlertTime = {};
  }

  /**
   * Send a message to Telegram with rate limiting
   */
  async sendMessage(message, alertType = 'general') {
    if (!this.enabled || !this.botToken || !this.chatId) {
      return;
    }

    // Rate limiting: prevent duplicate alerts within 2 seconds
    const now = Date.now();
    if (this.lastAlertTime[alertType] && (now - this.lastAlertTime[alertType]) < 2000) {
      return;
    }
    this.lastAlertTime[alertType] = now;

    try {
      await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    } catch (error) {
      logger.error('Failed to send Telegram notification:', error.message);
    }
  }

  /**
   * Send watch alert for ANY transaction from watched wallet
   */
  async notifyWatchAlert(txHash, from, to, value, txType, details = {}) {
    if (!config.sendWatchAlerts) {
      return;
    }

    let emoji = '📡';
    let typeText = txType;
    
    if (txType === 'DEX_SWAP') {
      emoji = '💱';
      typeText = details.swapType || 'SWAP';
    } else if (txType === 'BNB_TRANSFER') {
      emoji = '💸';
    }

    const message = `
${emoji} <b>WATCH ALERT: ${typeText}</b>

From: <code>${from.slice(0, 6)}...${from.slice(-4)}</code>
To: <code>${to.slice(0, 6)}...${to.slice(-4)}</code>
${value > 0 ? `Value: ${value.toFixed(4)} BNB` : ''}
${details.tokenOut ? `Token: <code>${details.tokenOut.slice(0, 8)}...</code>` : ''}
${details.amountInBnb ? `Amount: ${details.amountInBnb.toFixed(4)} BNB` : ''}

<a href="https://bscscan.com/tx/${txHash}">View on BSCScan</a>
    `.trim();

    await this.sendMessage(message, 'watch');
  }

  /**
   * Notify about a successful copy trade
   */
  async notifyTradeSuccess(type, token, amount, txHash, profitTarget = null) {
    if (!config.sendTradeAlerts) {
      return;
    }

    const message = `
🎯 <b>Copy Trade Executed</b>

Type: ${type}
Token: <code>${token.slice(0, 10)}...${token.slice(-6)}</code>
Amount: ${amount}
${profitTarget ? `🎯 Take Profit: ${profitTarget}%` : ''}

<a href="https://bscscan.com/tx/${txHash}">View Transaction</a>

✅ Success
    `.trim();

    await this.sendMessage(message, 'trade');
  }

  /**
   * Notify about a failed trade
   */
  async notifyTradeFailed(type, token, reason) {
    if (!config.sendTradeAlerts) {
      return;
    }

    const message = `
❌ <b>Trade Failed</b>

Type: ${type}
Token: <code>${token.slice(0, 10)}...</code>
Reason: ${reason}
    `.trim();

    await this.sendMessage(message, 'trade-fail');
  }

  /**
   * Notify when take profit target is reached
   */
  async notifyTakeProfit(token, buyValue, currentValue, profitPercent) {
    if (!config.sendProfitAlerts) {
      return;
    }

    const profitAmount = currentValue - buyValue;
    const message = `
🎯 <b>TAKE PROFIT TARGET REACHED!</b>

Token: <code>${token.slice(0, 10)}...${token.slice(-6)}</code>
Profit: <b>${profitPercent.toFixed(2)}%</b> 💰

Buy Value: ${buyValue.toFixed(4)} BNB
Current Value: ${currentValue.toFixed(4)} BNB
Profit: +${profitAmount.toFixed(4)} BNB

🤖 Executing sell order...
    `.trim();

    await this.sendMessage(message, 'profit-target');
  }

  /**
   * Notify when take profit sell is executed successfully
   */
  async notifyTakeProfitSuccess(token, profitPercent, profitAmount, txHash) {
    if (!config.sendProfitAlerts) {
      return;
    }

    const message = `
💰 <b>TAKE PROFIT SUCCESS!</b>

Token: <code>${token.slice(0, 10)}...${token.slice(-6)}</code>
Profit: <b>${profitPercent.toFixed(2)}%</b>
Amount: +${profitAmount.toFixed(4)} BNB

<a href="https://bscscan.com/tx/${txHash}">View Transaction</a>

✅ Sold at target!
    `.trim();

    await this.sendMessage(message, 'profit-success');
  }

  /**
   * Notify about wallet switch
   */
  async notifyWalletSwitch(oldWallet, newWallet, reason) {
    const message = `
🔄 <b>Wallet Switch</b>

From: <code>${oldWallet}</code>
To: <code>${newWallet}</code>
Reason: ${reason}
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * Notify when trade is filtered out
   */
  async notifyTradeFiltered(token, reason) {
    if (!config.sendTradeAlerts) {
      return;
    }

    const message = `
⚠️ <b>Trade Filtered</b>

Token: <code>${token.slice(0, 10)}...</code>
Reason: ${reason}

❌ Trade skipped
    `.trim();

    await this.sendMessage(message, 'filtered');
  }

  /**
   * Notify about bot startup
   */
  async notifyBotStartup(botAddress, watchedAddress, balance, mode) {
    const message = `
🚀 <b>Copy-Trading Bot Started</b>

Bot Wallet: <code>${botAddress.slice(0, 6)}...${botAddress.slice(-4)}</code>
Watching: <code>${watchedAddress.slice(0, 6)}...${watchedAddress.slice(-4)}</code>
Balance: ${balance.toFixed(4)} BNB

Mode: ${mode}
${config.autoTakeProfitEnabled ? `🎯 Take Profit: ${config.takeProfitPercent}%` : ''}
${config.oneTimeBuyPerToken ? '✅ One-time buy per token' : ''}

✅ Bot is now active and monitoring
    `.trim();

    await this.sendMessage(message, 'startup');
  }

  /**
   * Notify about critical errors
   */
  async notifyError(errorMessage) {
    const message = `
🚨 <b>Error Alert</b>

${errorMessage}

⚠️ Check bot logs immediately
    `.trim();

    await this.sendMessage(message);
  }
}
