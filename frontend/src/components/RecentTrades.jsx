import { ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, ExternalLink, Activity } from 'lucide-react';

export default function RecentTrades({ trades }) {
  if (!trades || trades.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Recent Trades</h2>
        <div className="text-center py-12 text-gray-400">
          <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No trades yet</p>
          <p className="text-sm mt-2">Trades will appear here in real-time</p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Trades</h2>
        <span className="badge badge-info">{trades.length} Trades</span>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {trades.map((trade, index) => (
          <div
            key={`${trade.txHash}-${index}`}
            className={`p-3 rounded-lg border ${
              trade.success
                ? 'bg-success/5 border-success/20'
                : 'bg-danger/5 border-danger/20'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {trade.type === 'BUY' ? (
                  <ArrowUpRight className="w-5 h-5 text-success" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-danger" />
                )}
                <span className="font-bold">{trade.type}</span>
                {trade.success ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-danger" />
                )}
              </div>
              <span className="text-xs text-gray-400">{formatTime(trade.timestamp)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div>
                <p className="text-gray-400 text-xs">Token</p>
                <p className="font-mono text-xs">
                  {trade.token?.slice(0, 6)}...{trade.token?.slice(-4)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Amount</p>
                <p className="font-bold">{trade.amount} BNB</p>
              </div>
            </div>

            {trade.success && trade.txHash && (
              <a
                href={`https://bscscan.com/tx/${trade.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-xs text-primary hover:text-yellow-400 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>View on BSCScan</span>
              </a>
            )}

            {!trade.success && trade.error && (
              <p className="text-xs text-danger mt-2">{trade.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
