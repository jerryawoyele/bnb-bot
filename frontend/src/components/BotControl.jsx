import { useState } from 'react';
import { Play, Square, Zap, Wallet } from 'lucide-react';
import WalletAddress from './WalletAddress';
import PasswordModal from './PasswordModal';

export default function BotControl({ botStatus, onStart, onStop, onStartAuto }) {
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordModal, setPasswordModal] = useState(null); // 'start' or 'stop'
  const [passwordLoading, setPasswordLoading] = useState(false);

  const isRunning = botStatus?.isRunning || false;
  const isDetecting = botStatus?.mode === 'detecting';
  const isTracking = botStatus?.mode === 'tracking';

  const handleStartClick = () => {
    if (!walletAddress) {
      setError('Please enter a wallet address');
      return;
    }

    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid wallet address format');
      return;
    }

    setPasswordModal('start');
  };

  const handleStartConfirm = async (password) => {
    setPasswordLoading(true);
    setError('');

    try {
      await onStart(walletAddress, password);
      setWalletAddress('');
      setPasswordModal(null);
    } catch (err) {
      setError(err.message || 'Failed to start bot');
      throw err;
    } finally {
      setPasswordLoading(false);
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

  const handleStopClick = () => {
    setPasswordModal('stop');
  };

  const handleStopConfirm = async (password) => {
    setPasswordLoading(true);
    setError('');

    try {
      await onStop(password);
      setPasswordModal(null);
    } catch (err) {
      setError(err.message || 'Failed to stop bot');
      throw err;
    } finally {
      setPasswordLoading(false);
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
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-success/30">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="font-bold text-success">
                ✅ Active & Monitoring
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">Watching:</span>
              <WalletAddress address={botStatus?.watchedWallet} className="text-xs text-success" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-gray-400 flex-shrink-0">Bot Wallet:</span>
              <WalletAddress address={botStatus?.botWallet} className="text-xs" />
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
          {/* Manual Mode */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Wallet className="w-4 h-4 inline mr-2" />
                Wallet Address to Watch
              </label>
              <input
                type="text"
                placeholder="0x... (enter wallet address)"
                value={walletAddress}
                onChange={(e) => {
                  setWalletAddress(e.target.value);
                  setError('');
                }}
                className="input w-full font-mono text-sm"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleStartClick}
              disabled={loading || !walletAddress}
              className="btn btn-primary w-full"
            >
              <Play className="w-4 h-4 inline mr-2" />
              {loading ? 'Starting Bot...' : 'Start Bot'}
            </button>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded text-sm text-blue-400">
            <p className="font-bold mb-1">💡 How it works:</p>
            <ul className="text-xs space-y-1 text-gray-400">
              <li>• Enter the wallet address you want to copy trades from</li>
              <li>• Bot will monitor and replicate their trades automatically</li>
              <li>• All safety filters and limits will be applied</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleStopClick}
            disabled={loading}
            className="btn btn-danger w-full"
          >
            <Square className="w-4 h-4 inline mr-2" />
            {loading ? 'Stopping...' : 'Stop Bot'}
          </button>

          <div className="text-center text-sm text-success">
            <p>✅ Bot is actively monitoring</p>
            <p className="text-xs mt-1 text-gray-400">Watching for trade opportunities</p>
          </div>
        </div>
      )}

      {/* Password Modal */}
      <PasswordModal
        isOpen={passwordModal !== null}
        onClose={() => setPasswordModal(null)}
        onConfirm={passwordModal === 'start' ? handleStartConfirm : handleStopConfirm}
        action={passwordModal === 'start' ? 'start the bot' : 'stop the bot'}
        loading={passwordLoading}
      />
    </div>
  );
}
