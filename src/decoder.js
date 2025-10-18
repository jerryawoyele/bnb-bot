import { ethers } from 'ethers';
import { PANCAKE_ROUTER_ABI, ROUTER_SIGNATURES, getFunctionName } from './abis.js';
import { logger } from './logger.js';
import { config } from './config.js';

export class TransactionDecoder {
  constructor() {
    this.routerInterface = new ethers.Interface(PANCAKE_ROUTER_ABI);
  }

  /**
   * Analyze a transaction to determine its type and extract relevant data
   */
  analyzeTransaction(tx) {
    try {
      // Check if this is a simple BNB transfer
      if (!tx.data || tx.data === '0x' || tx.data.length <= 10) {
        if (tx.value && tx.value > 0n) {
          return {
            type: 'BNB_TRANSFER',
            from: tx.from,
            to: tx.to,
            value: tx.value,
            valueInBnb: parseFloat(ethers.formatEther(tx.value)),
          };
        }
        return { type: 'UNKNOWN' };
      }

      // Extract function signature (first 4 bytes)
      const signature = tx.data.slice(0, 10);
      const functionName = getFunctionName(signature);

      // Check if this is a router swap function
      if (functionName) {
        return this.decodeSwapTransaction(tx, functionName);
      }

      // Check if this is a token transfer
      if (signature.toLowerCase() === '0xa9059cbb') {
        return this.decodeTokenTransfer(tx);
      }

      return { type: 'UNKNOWN', signature };
    } catch (error) {
      logger.error('Error analyzing transaction:', error);
      return { type: 'ERROR', error: error.message };
    }
  }

  /**
   * Decode swap transactions from DEX routers
   */
  decodeSwapTransaction(tx, functionName) {
    try {
      const decoded = this.routerInterface.parseTransaction({
        data: tx.data,
        value: tx.value,
      });

      if (!decoded) {
        return { type: 'UNKNOWN' };
      }

      const result = {
        type: 'DEX_SWAP',
        functionName,
        router: tx.to,
        from: tx.from,
        value: tx.value || 0n,
        valueInBnb: tx.value ? parseFloat(ethers.formatEther(tx.value)) : 0,
      };

      // Extract parameters based on function type
      if (functionName.includes('swapExactETHForTokens')) {
        result.swapType = 'BUY'; // BNB -> Token
        result.amountIn = tx.value;
        result.amountInBnb = parseFloat(ethers.formatEther(tx.value));
        result.amountOutMin = decoded.args.amountOutMin;
        result.path = decoded.args.path;
        result.to = decoded.args.to;
        result.deadline = decoded.args.deadline;
        result.tokenIn = config.wbnb;
        result.tokenOut = result.path[result.path.length - 1];
      } else if (functionName.includes('swapExactTokensForETH')) {
        result.swapType = 'SELL'; // Token -> BNB
        result.amountIn = decoded.args.amountIn;
        result.amountOutMin = decoded.args.amountOutMin;
        result.amountOutMinBnb = parseFloat(ethers.formatEther(decoded.args.amountOutMin));
        result.path = decoded.args.path;
        result.to = decoded.args.to;
        result.deadline = decoded.args.deadline;
        result.tokenIn = result.path[0];
        result.tokenOut = config.wbnb;
      } else if (functionName.includes('swapExactTokensForTokens')) {
        result.swapType = 'SWAP'; // Token -> Token
        result.amountIn = decoded.args.amountIn;
        result.amountOutMin = decoded.args.amountOutMin;
        result.path = decoded.args.path;
        result.to = decoded.args.to;
        result.deadline = decoded.args.deadline;
        result.tokenIn = result.path[0];
        result.tokenOut = result.path[result.path.length - 1];
      } else {
        // Handle other swap types
        result.rawArgs = decoded.args;
      }

      return result;
    } catch (error) {
      logger.error('Error decoding swap transaction:', error);
      return { type: 'DECODE_ERROR', error: error.message };
    }
  }

  /**
   * Decode token transfer transactions
   */
  decodeTokenTransfer(tx) {
    try {
      // ERC20 transfer function: transfer(address to, uint256 amount)
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const decoded = abiCoder.decode(
        ['address', 'uint256'],
        '0x' + tx.data.slice(10)
      );

      return {
        type: 'TOKEN_TRANSFER',
        from: tx.from,
        to: decoded[0],
        tokenAddress: tx.to,
        amount: decoded[1],
      };
    } catch (error) {
      logger.error('Error decoding token transfer:', error);
      return { type: 'DECODE_ERROR', error: error.message };
    }
  }

  /**
   * Check if a transaction is a DEX swap
   */
  isSwapTransaction(txAnalysis) {
    return txAnalysis.type === 'DEX_SWAP' && txAnalysis.swapType;
  }

  /**
   * Check if a transaction is a transfer (BNB or token)
   */
  isTransferTransaction(txAnalysis) {
    return txAnalysis.type === 'BNB_TRANSFER' || txAnalysis.type === 'TOKEN_TRANSFER';
  }
}
