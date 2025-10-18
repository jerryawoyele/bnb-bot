import { useState, useEffect } from 'react';
import { Eye, Target, Zap, Clock, Edit2, Check, X } from 'lucide-react';
import WalletAddress from './WalletAddress';

export default function StatusCard({ status, config, onChangeWallet }) {
  const [editing, setEditing] = useState(false);
  const [newWallet, setNewWallet] = useState('');
  const [currentUptime, setCurrentUptime] = useState(0);

  // Update uptime every second for real-time display
  useEffect(() => {
    if (status?.uptime) {
      setCurrentUptime(status.uptime);
      
      const interval = setInterval(() => {
        setCurrentUptime((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status?.uptime]);

  if (!status || !config) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      onChangeWallet(newWallet);
      setEditing(false);
      setNewWallet('');
    } else {
      alert('Invalid wallet address');
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Bot Status</h2>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
          <span className="text-success font-medium">Running</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Watched Wallet */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-primary" />
              <span className="text-sm text-gray-400">Watching</span>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="text-gray-400 hover:text-primary transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="text"
                value={newWallet}
                onChange={(e) => setNewWallet(e.target.value)}
                placeholder="0x..."
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm font-mono"
              />
              <div className="flex space-x-2">
                <button type="submit" className="flex-1 btn btn-success py-1 text-xs">
                  <Check className="w-3 h-3 inline mr-1" />
                  Save
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditing(false);
                    setNewWallet('');
                  }}
                  className="flex-1 btn btn-danger py-1 text-xs"
                >
                  <X className="w-3 h-3 inline mr-1" />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <WalletAddress address={status.watchedWallet} className="text-sm" />
          )}
        </div>

        {/* Trading Mode */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-5 h-5 text-success" />
            <span className="text-sm text-gray-400">Mode</span>
          </div>
          <p className="font-bold text-lg">{status.config?.mode || 'BUY_ONLY'}</p>
          {config.takeProfitEnabled && (
            <p className="text-xs text-gray-400 mt-1">
              TP: {config.takeProfitPercent}%
            </p>
          )}
        </div>

        {/* Fast Mode */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-warning" />
            <span className="text-sm text-gray-400">Speed</span>
          </div>
          <p className="font-bold text-lg">
            {config.fastMode ? (
              <span className="text-warning">Fast Mode</span>
            ) : (
              <span className="text-gray-400">Normal</span>
            )}
          </p>
          {config.fastMode && (
            <p className="text-xs text-gray-400 mt-1">
              {config.gasMultiplier}x Gas
            </p>
          )}
        </div>

        {/* Uptime */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Uptime</span>
          </div>
          <p className="font-bold text-lg">{formatUptime(currentUptime)}</p>
        </div>
      </div>
    </div>
  );
}
