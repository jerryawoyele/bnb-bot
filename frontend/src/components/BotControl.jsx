import { useState } from 'react';
import { Play, Square, Zap, Wallet } from 'lucide-react';

export default function BotControl({ botStatus, onStart, onStop, onStartAuto }) {
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRunning = botStatus?.isRunning || false;
  const isDetecting = botStatus?.mode === 'detecting';
  const isTracking = botStatus?.mode === 'tracking';

  const handleStartManual = async () => {
    if (!walletAddress) {
      setError('Please enter a wallet address');
      return;
    }

    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid wallet address format');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onStart(walletAddress);
      setWalletAddress('');
    } catch (err) {
      setError(err.message || 'Failed to start bot');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAuto = async () => {
    setLoading(true);
    setError('');

    try {
      await onStartAuto();
    } catch (err) {
      setError(err.message || 'Failed to start bot');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError('');

    try {
      await onStop();
    } catch (err) {
      setError(err.message || 'Failed to stop bot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <Play className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Bot Control</h2>
        <span className={`badge ${isRunning ? 'badge-success' : 'badge-warning'}`}>
          {isRunning ? 'Running' : 'Stopped'}
        </span>
      </div>

      {/* Status Display */}
      {isRunning && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-primary/30">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Mode:</span>
              <span className="font-bold text-primary">
                {isDetecting ? '🔍 Detecting Wallet' : isTracking ? '📊 Tracking' : 'Active'}
              </span>
            </div>

            {isDetecting && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Trigger Wallet:</span>
                  <span className="text-xs font-mono">{botStatus?.triggerWallet}</span>
                </div>
                <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded text-sm text-yellow-400">
                  ⏱️ Monitoring for incoming transfer...
                  <p className="text-xs mt-1">Will auto-detect target wallet within 1 minute</p>
                </div>
              </>
            )}

            {isTracking && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Watching:</span>
                <span className="text-xs font-mono text-success">{botStatus?.watchedWallet}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Bot Wallet:</span>
              <span className="text-xs font-mono">{botStatus?.botWallet}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Controls */}
      {!isRunning ? (
        <div className="space-y-4">
          {/* Auto Detection Mode */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-blue-600/10 border border-primary/30 rounded-lg">
            <div className="flex items-start space-x-3 mb-3">
              <Zap className="w-5 h-5 text-primary mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-primary mb-1">Smart Detection Mode</h3>
                <p className="text-sm text-gray-400">
                  Automatically detects target wallet by monitoring trigger address
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Trigger: <span className="font-mono">0xe2d60cfe...469775c</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleStartAuto}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              <Zap className="w-4 h-4 inline mr-2" />
              {loading ? 'Starting...' : 'Start Auto Detection'}
            </button>
          </div>

          {/* Manual Mode */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-start space-x-3 mb-3">
              <Wallet className="w-5 h-5 text-blue-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-blue-400 mb-1">Manual Mode</h3>
                <p className="text-sm text-gray-400">
                  Start with a specific wallet address
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="0x... (wallet address to watch)"
                value={walletAddress}
                onChange={(e) => {
                  setWalletAddress(e.target.value);
                  setError('');
                }}
                className="input w-full font-mono text-sm"
                disabled={loading}
              />
              <button
                onClick={handleStartManual}
                disabled={loading || !walletAddress}
                className="btn bg-blue-600 hover:bg-blue-700 text-white w-full"
              >
                <Play className="w-4 h-4 inline mr-2" />
                {loading ? 'Starting...' : 'Start with Wallet'}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded text-sm text-blue-400">
            <p className="font-bold mb-1">💡 How it works:</p>
            <ul className="text-xs space-y-1 text-gray-400">
              <li>• <strong>Auto Detection:</strong> Monitors trigger wallet for transfers</li>
              <li>• <strong>Manual:</strong> Directly watch a specific wallet</li>
              <li>• Bot will copy trades and apply filters automatically</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleStop}
            disabled={loading}
            className="btn btn-danger w-full"
          >
            <Square className="w-4 h-4 inline mr-2" />
            {loading ? 'Stopping...' : 'Stop Bot'}
          </button>

          {isDetecting && (
            <div className="text-center text-sm text-gray-400">
              <p>⏱️ Waiting for wallet detection...</p>
              <p className="text-xs mt-1">Bot will start tracking automatically when detected</p>
            </div>
          )}

          {isTracking && (
            <div className="text-center text-sm text-success">
              <p>✅ Bot is actively tracking</p>
              <p className="text-xs mt-1">Monitoring for trade opportunities</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
