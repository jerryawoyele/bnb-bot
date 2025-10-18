import { useState } from 'react';
import { X, Save } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ConfigEditor({ config, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    // Trading Mode
    copyBuyOnly: config?.copyBuyOnly ?? true,
    copySell: config?.copySell ?? false,
    
    // Take Profit Settings
    autoTakeProfitEnabled: config?.autoTakeProfitEnabled ?? true,
    takeProfitPercent: config?.takeProfitPercent ?? 100,
    takeProfitBagPercent: config?.takeProfitBagPercent ?? 100,
    
    // Buy Amount
    buyAmountBnb: config?.buyAmountBnb ?? config?.maxBuyAmountBnb ?? 0.01,
    
    // Gas Settings
    buyGasGwei: config?.buyGasGwei ?? config?.maxGasPriceGwei ?? 10,
    sellGasGwei: config?.sellGasGwei ?? config?.maxGasPriceGwei ?? 10,
    
    // Slippage Settings
    buySlippagePercent: config?.buySlippagePercent ?? config?.slippagePercent ?? 2,
    sellSlippagePercent: config?.sellSlippagePercent ?? config?.slippagePercent ?? 2,
    
    // Market Cap & Age Filters
    maxMarketCapUsd: config?.maxMarketCapUsd ?? 0,
    maxTokenAgeSeconds: config?.maxTokenAgeSeconds ?? (config?.maxTokenAgeHours ? config.maxTokenAgeHours * 3600 : 0),
    
    // Auto-Follow
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
                <div className="space-y-3 ml-7">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Price Increase Target (%)</label>
                    <input
                      type="number"
                      value={formData.takeProfitPercent}
                      onChange={(e) => handleChange('takeProfitPercent', parseFloat(e.target.value))}
                      className="input w-full"
                      min="0"
                      step="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">Sell when price increases by this %</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Sell % of Bag</label>
                    <input
                      type="number"
                      value={formData.takeProfitBagPercent}
                      onChange={(e) => handleChange('takeProfitBagPercent', parseFloat(e.target.value))}
                      className="input w-full"
                      min="1"
                      max="100"
                      step="5"
                    />
                    <p className="text-xs text-gray-500 mt-1">What % of position to sell (100 = all)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buy Settings */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-primary">💰 Buy Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Buy Amount (BNB) - Fixed</label>
                <input
                  type="number"
                  value={formData.buyAmountBnb}
                  onChange={(e) => handleChange('buyAmountBnb', parseFloat(e.target.value))}
                  className="input w-full"
                  min="0.001"
                  step="0.001"
                />
                <p className="text-xs text-gray-500 mt-1">Bot always buys with this exact amount</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Buy Gas (Gwei)</label>
                <input
                  type="number"
                  value={formData.buyGasGwei}
                  onChange={(e) => handleChange('buyGasGwei', parseFloat(e.target.value))}
                  className="input w-full"
                  min="1"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">Max gas price for buy transactions</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Buy Slippage (%)</label>
                <input
                  type="number"
                  value={formData.buySlippagePercent}
                  onChange={(e) => handleChange('buySlippagePercent', parseFloat(e.target.value))}
                  className="input w-full"
                  min="0.1"
                  max="50"
                  step="0.5"
                />
                <p className="text-xs text-gray-500 mt-1">Slippage tolerance for buys</p>
              </div>
            </div>
          </div>

          {/* Sell Settings */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-primary">💸 Sell Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sell Gas (Gwei)</label>
                <input
                  type="number"
                  value={formData.sellGasGwei}
                  onChange={(e) => handleChange('sellGasGwei', parseFloat(e.target.value))}
                  className="input w-full"
                  min="1"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">Max gas price for sell transactions</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Sell Slippage (%)</label>
                <input
                  type="number"
                  value={formData.sellSlippagePercent}
                  onChange={(e) => handleChange('sellSlippagePercent', parseFloat(e.target.value))}
                  className="input w-full"
                  min="0.1"
                  max="50"
                  step="0.5"
                />
                <p className="text-xs text-gray-500 mt-1">Slippage tolerance for sells</p>
              </div>
            </div>
          </div>

          {/* Token Filters */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-primary">🔍 Token Filters</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Market Cap (USD)</label>
                <input
                  type="number"
                  value={formData.maxMarketCapUsd}
                  onChange={(e) => handleChange('maxMarketCapUsd', parseFloat(e.target.value))}
                  className="input w-full"
                  min="0"
                  step="100000"
                />
                <p className="text-xs text-gray-500 mt-1">Only buy tokens below this market cap (0 = unlimited)</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Token Age (Seconds)</label>
                <input
                  type="number"
                  value={formData.maxTokenAgeSeconds}
                  onChange={(e) => handleChange('maxTokenAgeSeconds', parseFloat(e.target.value))}
                  className="input w-full"
                  min="0"
                  step="60"
                />
                <p className="text-xs text-gray-500 mt-1">Only buy tokens newer than this (0 = unlimited, 300 = 5min)</p>
              </div>
            </div>
          </div>

          {/* Auto-Follow Settings */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-primary">🔄 Auto-Follow Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.autoFollowEnabled}
                  onChange={(e) => handleChange('autoFollowEnabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Auto-Follow Wallet Transfers</span>
              </label>
              <p className="text-xs text-gray-500 ml-7">Follow BNB transfers to new wallets automatically</p>

              {formData.autoFollowEnabled && (
                <div className="ml-7">
                  <label className="block text-sm text-gray-400 mb-1">Min Transfer Amount (BNB)</label>
                  <input
                    type="number"
                    value={formData.minTransferAmountBnb}
                    onChange={(e) => handleChange('minTransferAmountBnb', parseFloat(e.target.value))}
                    className="input w-full"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Only switch if BNB transfer is above this amount</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-primary">⚡ Performance</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.fastMode}
                  onChange={(e) => handleChange('fastMode', e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Fast Mode (Higher Gas Priority)</span>
              </label>
              <p className="text-xs text-gray-500 ml-7">Use gas multiplier for faster transaction confirmations</p>

              {formData.fastMode && (
                <div className="ml-7">
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
                  <p className="text-xs text-gray-500 mt-1">Multiply gas by this amount (1.2 = 20% higher gas)</p>
                </div>
              )}
            </div>
          </div>

          {/* Blacklist */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-primary">🚫 Blacklist & Whitelist</h3>
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
