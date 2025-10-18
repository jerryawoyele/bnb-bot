import { useState } from 'react';
import { Settings, Shield, Zap, DollarSign, Filter as FilterIcon, Edit } from 'lucide-react';
import ConfigEditor from './ConfigEditor';

export default function ConfigPanel({ config, onConfigUpdated }) {
  const [showEditor, setShowEditor] = useState(false);
  
  if (!config) return <div className="card"><p className="text-gray-400">Loading configuration...</p></div>;

  const configSections = [
    {
      title: 'Trading Settings',
      icon: DollarSign,
      items: [
        { label: 'Copy Buy Only', value: config.copyBuyOnly ? 'Enabled' : 'Disabled', enabled: config.copyBuyOnly },
        { label: 'Copy Sell', value: config.copySell ? 'Enabled' : 'Disabled', enabled: config.copySell },
        { label: 'Buy Amount', value: `${config.buyAmountBnb || config.maxBuyAmountBnb || 0.01} BNB` },
        { label: 'Buy Slippage', value: `${config.buySlippagePercent || config.slippagePercent || 2}%` },
        { label: 'Sell Slippage', value: `${config.sellSlippagePercent || config.slippagePercent || 2}%` },
      ]
    },
    {
      title: 'Take Profit',
      icon: Zap,
      items: [
        { label: 'Auto Take Profit', value: config.autoTakeProfitEnabled ? 'Enabled' : 'Disabled', enabled: config.autoTakeProfitEnabled },
        { label: 'Price Target', value: `${config.takeProfitPercent}%` },
        { label: 'Sell % of Bag', value: `${config.takeProfitBagPercent || 100}%` },
      ]
    },
    {
      title: 'Safety Filters',
      icon: Shield,
      items: [
        { label: 'Buy Gas', value: `${config.buyGasGwei || config.maxGasPriceGwei || 10} Gwei` },
        { label: 'Sell Gas', value: `${config.sellGasGwei || config.maxGasPriceGwei || 10} Gwei` },
        { label: 'Max Market Cap', value: config.maxMarketCapUsd > 0 ? `$${config.maxMarketCapUsd.toLocaleString()}` : 'Unlimited' },
        { label: 'Max Token Age', value: config.maxTokenAgeSeconds > 0 ? `${config.maxTokenAgeSeconds}s` : 'Unlimited' },
      ]
    },
    {
      title: 'Performance',
      icon: FilterIcon,
      items: [
        { label: 'Fast Mode', value: config.fastMode ? 'Enabled' : 'Disabled', enabled: config.fastMode },
        { label: 'Gas Multiplier', value: `${config.gasMultiplier}x` },
        { label: 'Auto-Follow', value: config.autoFollowEnabled ? 'Enabled' : 'Disabled', enabled: config.autoFollowEnabled },
      ]
    }
  ];

  const handleConfigSaved = (newConfig) => {
    if (onConfigUpdated) {
      onConfigUpdated(newConfig);
    }
  };

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Configuration</h2>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="btn btn-primary"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {configSections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center space-x-2 mb-4">
              <section.icon className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">{section.title}</h3>
            </div>
            
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.label} className="bg-gray-900 p-3 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">{item.label}</p>
                  <p className={`font-bold ${
                    item.enabled !== undefined 
                      ? item.enabled 
                        ? 'text-success' 
                        : 'text-gray-400'
                      : 'text-white'
                  }`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            <strong>Info:</strong> Configuration is stored in MongoDB and persists across all sessions.
          </p>
        </div>
      </div>

      {showEditor && (
        <ConfigEditor
          config={config}
          onClose={() => setShowEditor(false)}
          onSaved={handleConfigSaved}
        />
      )}
    </>
  );
}
