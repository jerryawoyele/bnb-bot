import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const rpcUrl = process.env.WS_RPC || 'wss://bsc.publicnode.com';

console.log('\n🧪 Testing BSC WebSocket Connection\n');
console.log(`Endpoint: ${rpcUrl}`);
console.log('Connecting...\n');

async function testConnection() {
  try {
    const provider = new ethers.WebSocketProvider(rpcUrl);
    
    // Add timeout
    const timeout = setTimeout(() => {
      console.error('❌ Connection timeout after 10 seconds');
      process.exit(1);
    }, 10000);
    
    await provider.ready;
    clearTimeout(timeout);
    
    console.log('✅ Connected successfully!');
    
    // Get network info
    const network = await provider.getNetwork();
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Get latest block
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Latest block: ${blockNumber}`);
    
    // Get gas price
    const feeData = await provider.getFeeData();
    const gasPriceGwei = parseFloat(ethers.formatUnits(feeData.gasPrice, 'gwei'));
    console.log(`⛽ Current gas price: ${gasPriceGwei.toFixed(2)} Gwei`);
    
    console.log('\n✅ All tests passed! Your RPC endpoint is working.\n');
    
    provider.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error(`Error: ${error.message}\n`);
    console.error('💡 Troubleshooting:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify WS_RPC in .env file');
    console.error('   3. Make sure API key is correct');
    console.error('   4. Try a different RPC endpoint');
    console.error('\n📖 See RPC_ENDPOINTS.md for working endpoints\n');
    process.exit(1);
  }
}

testConnection();
