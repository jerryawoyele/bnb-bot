import { TrendingUp, ExternalLink, DollarSign } from 'lucide-react';

export default function PositionsTable({ positions, onSell }) {
  if (!positions || positions.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Open Positions</h2>
        <div className="text-center py-12 text-gray-400">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No open positions</p>
          <p className="text-sm mt-2">Positions will appear here after buying tokens</p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Open Positions</h2>
        <span className="badge badge-info">{positions.length} Active</span>
      </div>

      <div className="space-y-3">
        {positions.map((position) => {
          const profitPercent = ((position.currentValue - position.buyAmountBnb) / position.buyAmountBnb) * 100;
          const isProfit = profitPercent >= 0;

          return (
            <div
              key={position.token}
              className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-mono text-sm">
                      {position.token.slice(0, 6)}...{position.token.slice(-4)}
                    </p>
                    <a
                      href={`https://bscscan.com/address/${position.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-400">{formatTime(position.timestamp)}</p>
                </div>

                <div className={`text-right ${isProfit ? 'text-success' : 'text-danger'}`}>
                  <div className="flex items-center space-x-1 justify-end mb-1">
                    <TrendingUp className={`w-4 h-4 ${isProfit ? '' : 'rotate-180'}`} />
                    <span className="font-bold">{profitPercent?.toFixed(2) || '0.00'}%</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {((position.currentValue - position.buyAmountBnb) || 0).toFixed(4)} BNB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Buy Price</p>
                  <p className="font-mono">{position.buyAmountBnb?.toFixed(4)} BNB</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Amount</p>
                  <p className="font-mono">{position.tokenAmount ? parseFloat(position.tokenAmount).toFixed(2) : '0'}</p>
                </div>
              </div>

              <button
                onClick={() => onSell(position.token)}
                className="w-full btn btn-danger text-sm"
              >
                <DollarSign className="w-4 h-4 inline mr-1" />
                Sell Position
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Package({ className }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  );
}
