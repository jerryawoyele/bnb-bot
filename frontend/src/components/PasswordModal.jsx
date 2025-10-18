import { useState } from 'react';
import { X, Lock } from 'lucide-react';

export default function PasswordModal({ isOpen, onClose, onConfirm, action, loading }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Please enter password');
      return;
    }

    try {
      await onConfirm(password);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Invalid password');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Lock className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold">Authorization Required</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-300 mb-4">
          Enter password to {action}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="input w-full"
              placeholder="Enter password"
              disabled={loading}
              autoFocus
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="btn bg-gray-700 hover:bg-gray-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !password}
            >
              {loading ? 'Verifying...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
