import { useState } from 'react';
import { Bot, Wifi, WifiOff, Home, Settings, FileText, Menu, X, Play, History } from 'lucide-react';

export default function Header({ status, connected, activeTab, onTabChange }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'control', label: 'Control', icon: Play },
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'sessions', label: 'Sessions', icon: History },
    { id: 'config', label: 'Config', icon: Settings },
    { id: 'logs', label: 'Logs', icon: FileText }
  ];

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Bot className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-primary">BNB Copy-Trading Bot</h1>
              <p className="text-sm text-gray-400 hidden sm:block">Real-time Dashboard</p>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Navigation Tabs - Desktop */}
            <div className="hidden lg:flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-black'
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Hamburger Menu - Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden btn bg-gray-900 hover:bg-gray-700 p-2"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-400" />
              ) : (
                <Menu className="w-6 h-6 text-gray-400" />
              )}
            </button>

            {/* Connection Status */}
            <div className="hidden md:flex items-center space-x-2">
              {connected ? (
                <>
                  <Wifi className="w-5 h-5 text-success" />
                  <span className="text-success text-sm font-medium">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-danger" />
                  <span className="text-danger text-sm font-medium">Disconnected</span>
                </>
              )}
            </div>

            {/* Bot Wallet */}
            {status && (
              <div className="hidden xl:block">
                <p className="text-xs text-gray-400">Bot Wallet</p>
                <p className="text-sm font-mono">
                  {status.botWallet?.slice(0, 6)}...{status.botWallet?.slice(-4)}
                </p>
              </div>
            )}

            {/* Balance */}
            {status && (
              <div className="bg-gray-900 px-3 md:px-4 py-2 rounded-lg">
                <p className="text-xs text-gray-400">Balance</p>
                <p className="text-sm md:text-lg font-bold text-primary font-mono">
                  {parseFloat(status.balance || 0).toFixed(4)} BNB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-black'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
            
            {/* Connection Status - Mobile Only */}
            <div className="md:hidden flex items-center space-x-2 px-4 py-3 bg-gray-900 rounded-lg">
              {connected ? (
                <>
                  <Wifi className="w-5 h-5 text-success" />
                  <span className="text-success text-sm font-medium">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-danger" />
                  <span className="text-danger text-sm font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
