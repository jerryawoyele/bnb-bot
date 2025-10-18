import { useState, useEffect } from 'react';
import { Repeat, Clock, ArrowRight } from 'lucide-react';
import WalletAddress from './WalletAddress';

export default function WalletSwitches({ socket, currentWallet }) {
  const [switches, setSwitches] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for wallet switch events
    socket.on('walletSwitch', (data) => {
      console.log('📥 Wallet switch received:', data);
      
      // Add new switch to the beginning of the array
      setSwitches(prev => [{
        oldWallet: data.oldWallet,
        newWallet: data.newWallet,
        reason: data.reason,
        timestamp: data.timestamp || new Date().toISOString()
      }, ...prev]);
    });

    return () => {
      socket.off('walletSwitch');
    };
  }, [socket]);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Show recent switches (last 5) or all if expanded
  const displayedSwitches = expanded ? switches : switches.slice(0, 5);

  if (switches.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Repeat className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Wallet Switches</h3>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
            {switches.length}
          </span>
        </div>
        <p className="text-sm text-gray-400">No wallet switches yet</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Repeat className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Wallet Switches</h3>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
            {switches.length}
          </span>
        </div>
        {switches.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:text-primary-light transition-colors"
          >
            {expanded ? 'Show Less' : `Show All (${switches.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {displayedSwitches.map((switchData, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              index === 0 
                ? 'bg-primary/10 border-primary/30' 
                : 'bg-gray-900 border-gray-700'
            }`}
          >
            {/* Timestamp and Label */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">
                  {formatTime(switchData.timestamp)}
                </span>
              </div>
              {index === 0 && (
                <span className="text-xs bg-primary text-black px-2 py-0.5 rounded font-bold">
                  LATEST
                </span>
              )}
            </div>

            {/* Wallet Flow */}
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">From</p>
                <WalletAddress 
                  address={switchData.oldWallet} 
                  short={true}
                  copyable={true}
                />
              </div>
              
              <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
              
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">To</p>
                <WalletAddress 
                  address={switchData.newWallet} 
                  short={true}
                  copyable={true}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
              <span className="text-gray-500">Reason:</span> {switchData.reason}
            </div>
          </div>
        ))}
      </div>

      {switches.length > 5 && !expanded && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Showing 5 of {switches.length} switches
          </p>
        </div>
      )}
    </div>
  );
}
