import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import Header from './components/Header';
import StatusCard from './components/StatusCard';
import StatsGrid from './components/StatsGrid';
import PositionsTable from './components/PositionsTable';
import RecentTrades from './components/RecentTrades';
import ConfigPanel from './components/ConfigPanel';
import LogsView from './components/LogsView';
import BotControl from './components/BotControl';
import SessionViewer from './components/SessionViewer';
import { Activity, Play, Square } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  // Get initial tab from URL or localStorage
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) return tabFromUrl;
    
    const savedTab = localStorage.getItem('activeTab');
    return savedTab || null; // null until bot status is known
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [status, setStatus] = useState(null);
  const [botStatus, setBotStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [positions, setPositions] = useState([]);
  const [recentTrades, setRecentTrades] = useState([]);
  const [config, setConfig] = useState(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to bot');
      setConnected(true);
      fetchInitialData();
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from bot');
      setConnected(false);
    });

    newSocket.on('stats', (data) => {
      setStats(data);
    });

    newSocket.on('positions', (data) => {
      setPositions(data);
    });

    newSocket.on('trade', (trade) => {
      setRecentTrades((prev) => [trade, ...prev].slice(0, 20));
    });

    newSocket.on('status', (data) => {
      setStatus(data);
    });

    newSocket.on('botStatus', (data) => {
      setBotStatus(data);
    });

    newSocket.on('balance', (balance) => {
      setStatus((prev) => prev ? { ...prev, balance } : null);
    });

    // Listen for wallet switches
    newSocket.on('walletSwitch', (data) => {
      console.log('🔄 WALLET SWITCHED!');
      console.log(`   Old: ${data.oldWallet}`);
      console.log(`   New: ${data.newWallet}`);
      console.log(`   Reason: ${data.reason}`);
      
      // Update bot status with new watched wallet across entire UI
      setBotStatus((prev) => ({
        ...prev,
        watchedWallet: data.newWallet
      }));
      
      // Show prominent notification
      const message = `🔄 Wallet Switch Detected!\n\nNow watching: ${data.newWallet}\n\n${data.reason}`;
      console.warn(message);
      
      // Optional: Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Bot Wallet Switched', {
          body: `Now watching: ${data.newWallet.slice(0, 10)}...`,
          icon: '/favicon.ico'
        });
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [botStatusRes, statsRes, positionsRes, configRes] = await Promise.all([
        axios.get(`${API_URL}/api/bot/status`),
        axios.get(`${API_URL}/api/stats`),
        axios.get(`${API_URL}/api/positions`),
        axios.get(`${API_URL}/api/config`)
      ]);

      const botStatusData = botStatusRes.data;
      setBotStatus(botStatusData);
      setStats(statsRes.data);
      setPositions(positionsRes.data);
      setConfig(configRes.data);
      
      // Set default tab based on bot status (only if not already set)
      setActiveTab(prev => {
        if (prev === null) {
          const defaultTab = botStatusData.isRunning ? 'home' : 'control';
          // Save to localStorage
          localStorage.setItem('activeTab', defaultTab);
          // Update URL
          const url = new URL(window.location);
          url.searchParams.set('tab', defaultTab);
          window.history.replaceState({}, '', url);
          return defaultTab;
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  // Update tab and persist to localStorage + URL
  const changeTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
  };

  const handleStartBot = async (walletAddress, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/bot/start`, { walletAddress, password });
      if (response.data.success) {
        await fetchInitialData();
      }
      return response.data;
    } catch (error) {
      console.error('Failed to start bot:', error);
      throw error;
    }
  };

  const handleStartBotAuto = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/bot/start/auto`);
      if (response.data.success) {
        await fetchInitialData();
      }
      return response.data;
    } catch (error) {
      console.error('Failed to start bot:', error);
      throw error;
    }
  };

  const handleStopBot = async (password) => {
    try {
      const response = await axios.post(`${API_URL}/api/bot/stop`, { password });
      if (response.data.success) {
        await fetchInitialData();
      }
      return response.data;
    } catch (error) {
      console.error('Failed to stop bot:', error);
      throw error;
    }
  };

  const handlePauseBot = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/bot/pause`);
      if (response.data.success) {
        await fetchInitialData();
      }
      return response.data;
    } catch (error) {
      console.error('Failed to pause bot:', error);
      throw error;
    }
  };

  const handleResumeBot = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/bot/resume`);
      if (response.data.success) {
        await fetchInitialData();
      }
      return response.data;
    } catch (error) {
      console.error('Failed to resume bot:', error);
      throw error;
    }
  };

  const handleSellPosition = async (tokenAddress) => {
    try {
      await axios.post(`${API_URL}/api/positions/${tokenAddress}/sell`);
    } catch (error) {
      console.error('Failed to sell position:', error);
      alert('Failed to sell position: ' + error.message);
    }
  };

  const handleChangeWallet = async (newAddress) => {
    try {
      await axios.post(`${API_URL}/api/wallet/watch`, { address: newAddress });
      fetchInitialData();
    } catch (error) {
      console.error('Failed to change wallet:', error);
      alert('Failed to change wallet: ' + error.message);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="card max-w-md w-full mx-4">
          <div className="text-center">
            <Activity className="w-16 h-16 text-primary animate-pulse mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connecting to Backend...</h2>
            <p className="text-gray-400 mb-6">Establishing connection to API server</p>
            
            <div className="space-y-2 text-sm text-left">
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <span className="text-gray-400">API Server:</span>
                <span className="font-mono text-xs">{API_URL}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <span className="text-gray-400">Status:</span>
                <span className="text-warning">Connecting...</span>
              </div>
            </div>

            <div className="mt-6 p-3 bg-blue-900/20 border border-blue-600/30 rounded text-sm text-blue-400">
              <p className="font-bold mb-1">⚠️ Backend Required</p>
              <p className="text-xs text-gray-400">
                Make sure the backend is running:
              </p>
              <code className="block mt-2 p-2 bg-black rounded text-xs">
                npm start
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header 
        status={status} 
        connected={connected}
        activeTab={activeTab}
        onTabChange={changeTab}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Bot Control Tab */}
        <div className={activeTab === 'control' ? 'block' : 'hidden'}>
          <BotControl 
            botStatus={botStatus}
            onStart={handleStartBot}
            onStop={handleStopBot}
            onStartAuto={handleStartBotAuto}
          />
        </div>

        {/* Home Tab */}
        <div className={activeTab === 'home' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 gap-6">
            {/* Bot Status Banner */}
            {botStatus && botStatus.isRunning && botStatus.watchedWallet && (
              <div className={`p-4 rounded-lg border-2 ${
                botStatus.isPaused
                  ? 'bg-warning/10 border-warning/50' 
                  : 'bg-success/10 border-success/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {botStatus.isPaused ? (
                      <Square className="w-6 h-6 text-warning" />
                    ) : (
                      <Play className="w-6 h-6 text-success" />
                    )}
                    <div>
                      <p className="font-bold">
                        {botStatus.isPaused ? '⏸️ Bot Paused' : '🟢 Bot Active'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {botStatus.isPaused ? 'Not processing transactions' : `📊 Tracking: ${botStatus.watchedWallet}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={botStatus.isPaused ? handleResumeBot : handlePauseBot}
                    className={`btn btn-sm ${botStatus.isPaused ? 'btn-success' : 'bg-warning hover:bg-yellow-600 text-black'}`}
                  >
                    {botStatus.isPaused ? '▶️ Resume Bot' : '⏸️ Pause Bot'}
                  </button>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <StatsGrid stats={stats} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Positions */}
              <PositionsTable 
                positions={positions} 
                onSell={handleSellPosition}
              />

              {/* Recent Trades */}
              <RecentTrades trades={recentTrades} />
            </div>
          </div>
        </div>

        {/* Sessions Tab */}
        <div className={activeTab === 'sessions' ? 'block' : 'hidden'}>
          <SessionViewer />
        </div>

        {/* Config Tab */}
        <div className={activeTab === 'config' ? 'block' : 'hidden'}>
          <ConfigPanel 
            config={config} 
            onConfigUpdated={(newConfig) => setConfig(newConfig)}
          />
        </div>

        {/* Logs Tab */}
        <div className={activeTab === 'logs' ? 'block' : 'hidden'}>
          <LogsView socket={socket} />
        </div>
      </main>
    </div>
  );
}

export default App;
