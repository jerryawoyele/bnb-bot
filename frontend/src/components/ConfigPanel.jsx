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
        { label: 'Max Buy Amount', value: `${config.maxBuyAmountBnb} BNB` },
        { label: 'Slippage', value: `${config.slippagePercent}%` },
      ]
    },
    {
      title: 'Take Profit',
      icon: Zap,
      items: [
        { label: 'Auto Take Profit', value: config.autoTakeProfitEnabled ? 'Enabled' : 'Disabled', enabled: config.autoTakeProfitEnabled },
        { label: 'Take Profit Target', value: `${config.takeProfitPercent}%` },
      ]
    },
    {
      title: 'Safety Filters',
      icon: Shield,
      items: [
        { label: 'Min Liquidity', value: `$${config.minLiquidityUsd?.toLocaleString()}` },
        { label: 'Max Token Age', value: `${config.maxTokenAgeHours}h` },
        { label: 'One-Time Buy', value: config.oneTimeBuyPerToken ? 'Enabled' : 'Disabled', enabled: config.oneTimeBuyPerToken },
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
