// PancakeSwap Router v2 ABI (Essential functions only)
export const PANCAKE_ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] memory path) external view returns (uint[] memory amounts)',
  'function factory() external pure returns (address)',
  'function WETH() external pure returns (address)',
];

// PancakeSwap Factory ABI
export const PANCAKE_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function allPairs(uint) external view returns (address pair)',
  'function allPairsLength() external view returns (uint)',
];

// PancakeSwap Pair ABI
export const PANCAKE_PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function totalSupply() external view returns (uint)',
];

// ERC20 Token ABI
export const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address recipient, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// Router function signatures (for decoding)
export const ROUTER_SIGNATURES = {
  'swapExactETHForTokens': '0x7ff36ab5',
  'swapExactTokensForETH': '0x18cbafe5',
  'swapExactTokensForTokens': '0x38ed1739',
  'swapETHForExactTokens': '0xfb3bdb41',
  'swapTokensForExactETH': '0x4a25d94a',
  'swapTokensForExactTokens': '0x8803dbee',
  'swapExactETHForTokensSupportingFeeOnTransferTokens': '0xb6f9de95',
  'swapExactTokensForETHSupportingFeeOnTransferTokens': '0x791ac947',
  'swapExactTokensForTokensSupportingFeeOnTransferTokens': '0x5c11d795',
};

// Get function name from signature
export function getFunctionName(signature) {
  const sig = signature.toLowerCase();
  for (const [name, hash] of Object.entries(ROUTER_SIGNATURES)) {
    if (hash.toLowerCase() === sig) {
      return name;
    }
  }
  return null;
}
