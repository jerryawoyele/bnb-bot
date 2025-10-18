import { useState } from 'react';
import { X, Save } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ConfigEditor({ config, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    // Trading Mode
    copyBuyOnly: config?.copyBuyOnly ?? true,
    copySell: config?.copySell ?? false,
    autoTakeProfitEnabled: config?.autoTakeProfitEnabled ?? true,
    takeProfitPercent: config?.takeProfitPercent ?? 100,
    
    // Risk Management
    maxBuyAmountBnb: config?.maxBuyAmountBnb ?? 0.5,
    slippagePercent: config?.slippagePercent ?? 2,
    maxGasPriceGwei: config?.maxGasPriceGwei ?? 10,
    minLiquidityUsd: config?.minLiquidityUsd ?? 10000,
    maxTokenAgeHours: config?.maxTokenAgeHours ?? 72,
    
    // Filters
    oneTimeBuyPerToken: config?.oneTimeBuyPerToken ?? true,
    autoFollowEnabled: config?.autoFollowEnabled ?? true,
    minTransferAmountBnb: config?.minTransferAmountBnb ?? 0.1,
    
    // Performance
    fastMode: config?.fastMode ?? true,
    gasMultiplier: config?.gasMultiplier ?? 1.2,
    
    // Blacklist
    blacklistedTokens: config?.blacklistedTokens?.join(', ') ?? '',
    allowedRouters: config?.allowedRouters?.join(', ') ?? '0x10ED43C718714eb63d5aA57B78B54704E256024E'
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Process arrays
      const processedData = {
        ...formData,
        blacklistedTokens: formData.blacklistedTokens
          .split(',')
          .map(t => t.trim())
          .filter(t => t),
        allowedRouters: formData.allowedRouters
          .split(',')
          .map(r => r.trim())
          .filter(r => r)
      };

      const response = await axios.put(`${API_URL}/api/config`, processedData);
      
      if (response.data.success) {
        onSaved(response.data.config);
        onClose();
      } else {
        setError('Failed to save configuration');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Edit Configuration</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="m-4 p-3 bg-red-900/20 border border-red-600/30 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Trading Mode */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-primary">Trading Mode</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.copyBuyOnly}
                  onChange={(e) => handleChange('copyBuyOnly', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Copy Buy Orders Only</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.copySell}
                  onChange={(e) => handleChange('copySell', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Copy Sell Orders</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.autoTakeProfitEnabled}
                  onChange={(e) => handleChange('autoTakeProfitEnabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Auto Take Profit</span>
              </label>

              {formData.autoTakeProfitEnabled && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Take Profit Percent (%)</label>
                  <input
                    type="number"
                    value={formData.takeProfitPercent}
                    onChange={(e) => handleChange('takeProfitPercent', parseFloat(e.target.value))}
                    className="input w-full"
                    min="0"
                    step="10"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Risk Management */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-primary">Risk Management</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Buy Amount (BNB)</label>
                <input
                  type="number"
                  value={formData.maxBuyAmountBnb}
                  onChange={(e) => handleChange('maxBuyAmountBnb', parseFloat(e.target.value))}
                  className="input w-full"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Slippage Tolerance (%)</label>
                <input
                  type="number"
                  value={formData.slippagePercent}
                  onChange={(e) => handleChange('slippagePercent', parseFloat(e.target.value))}
                  className="input w-full"
                  min="0"
                  max="50"
                  step="0.5"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Gas Price (Gwei)</label>
                <input
                  type="number"
                  value={formData.maxGasPriceGwei}
                  onChange={(e) => handleChange('maxGasPriceGwei', parseFloat(e.target.value))}
                  className="input w-full"
                  min="1"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Liquidity (USD)</label>
                <input
                  type="number"
                  value={formData.minLiquidityUsd}
                  onChange={(e) => handleChange('minLiquidityUsd', parseFloat(e.target.value))}
                  className="input w-full"
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Token Age (Hours)</label>
                <input
                  type="number"
                  value={formData.maxTokenAgeHours}
                  onChange={(e) => handleChange('maxTokenAgeHours', parseFloat(e.target.value))}
                  className="input w-full"
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-primary">Filters</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.oneTimeBuyPerToken}
                  onChange={(e) => handleChange('oneTimeBuyPerToken', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>One-Time Buy Per Token</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.autoFollowEnabled}
                  onChange={(e) => handleChange('autoFollowEnabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Auto Follow Enabled</span>
              </label>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Transfer Amount (BNB)</label>
                <input
                  type="number"
                  value={formData.minTransferAmountBnb}
                  onChange={(e) => handleChange('minTransferAmountBnb', parseFloat(e.target.value))}
                  className="input w-full"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Performance */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-primary">Performance</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.fastMode}
                  onChange={(e) => handleChange('fastMode', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Fast Mode</span>
              </label>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Gas Multiplier</label>
                <input
                  type="number"
                  value={formData.gasMultiplier}
                  onChange={(e) => handleChange('gasMultiplier', parseFloat(e.target.value))}
                  className="input w-full"
                  min="1"
                  max="3"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Blacklist */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-primary">Blacklist & Whitelist</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Blacklisted Tokens (comma-separated addresses)
                </label>
                <textarea
                  value={formData.blacklistedTokens}
                  onChange={(e) => handleChange('blacklistedTokens', e.target.value)}
                  className="input w-full font-mono text-xs"
                  rows="3"
                  placeholder="0x..., 0x..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Allowed Routers (comma-separated addresses)
                </label>
                <textarea
                  value={formData.allowedRouters}
                  onChange={(e) => handleChange('allowedRouters', e.target.value)}
                  className="input w-full font-mono text-xs"
                  rows="2"
                  placeholder="0x10ED43C718714eb63d5aA57B78B54704E256024E"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="btn bg-gray-700 hover:bg-gray-600"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
