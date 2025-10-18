import { useState, useEffect } from 'react';
import { History, Calendar, Clock, TrendingUp, Eye, Download } from 'lucide-react';
import axios from 'axios';
import WalletAddress from './WalletAddress';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function SessionViewer() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/sessions`);
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      setLoading(true);
      const [sessionRes, logsRes, tradesRes, positionsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/sessions/${sessionId}`),
        axios.get(`${API_URL}/api/sessions/${sessionId}/logs?limit=100`),
        axios.get(`${API_URL}/api/sessions/${sessionId}/trades`),
        axios.get(`${API_URL}/api/sessions/${sessionId}/positions`),
        axios.get(`${API_URL}/api/sessions/${sessionId}/stats`)
      ]);

      setSessionData({
        session: sessionRes.data.session,
        logs: logsRes.data.logs || [],
        trades: tradesRes.data.trades || [],
        positions: positionsRes.data.positions || [],
        stats: statsRes.data
      });

      setViewMode('detail');
    } catch (error) {
      console.error('Failed to fetch session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
    fetchSessionDetails(session.sessionId);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedSession(null);
    setSessionData(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'stopped':
        return 'badge-warning';
      case 'completed':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <History className="w-16 h-16 text-gray-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  // Detail View
  if (viewMode === 'detail' && sessionData) {
    const { session, logs, trades, positions, stats } = sessionData;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <button
            onClick={handleBackToList}
            className="btn btn-secondary mb-4"
          >
            ← Back to Sessions
          </button>

          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Session Details</h2>
              <p className="text-sm text-gray-400 font-mono break-all">{session.sessionId}</p>
            </div>
            <span className={`badge ${getStatusColor(session.status)} whitespace-nowrap`}>
              {session.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Started:</span>
                <span className="font-mono text-sm">{formatDate(session.startTime)}</span>
              </div>
              {session.endTime && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Ended:</span>
                  <span className="font-mono text-sm">{formatDate(session.endTime)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="font-bold">{formatDuration(session.startTime, session.endTime)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-gray-400 flex-shrink-0">Watched Wallet:</span>
                <WalletAddress address={session.watchedWallet} className="text-primary" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-gray-400 flex-shrink-0">Bot Wallet:</span>
                <WalletAddress address={session.botWallet} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-400">Trades</p>
            <p className="text-3xl font-bold text-primary">{stats.total_trades || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-400">Logs</p>
            <p className="text-3xl font-bold text-blue-400">{stats.total_logs || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-400">Open Positions</p>
            <p className="text-3xl font-bold text-success">{stats.open_positions || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-400">Closed</p>
            <p className="text-3xl font-bold text-gray-400">{stats.closed_positions || 0}</p>
          </div>
        </div>

        {/* Trades */}
        {trades.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Trades</h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Token</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 10).map((trade, idx) => (
                    <tr key={idx}>
                      <td className="text-xs">{formatDate(trade.timestamp)}</td>
                      <td>
                        <span className={`badge ${trade.type === 'BUY' ? 'badge-success' : 'badge-warning'}`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{trade.token.slice(0, 10)}...</td>
                      <td className="font-mono text-sm">{trade.amount}</td>
                      <td>
                        <span className={`badge ${trade.success ? 'badge-success' : 'badge-danger'}`}>
                          {trade.success ? '✓' : '✗'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Positions */}
        {positions.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Positions</h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Buy Price</th>
                    <th>Amount BNB</th>
                    <th>Status</th>
                    <th>P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.slice(0, 10).map((pos, idx) => (
                    <tr key={idx}>
                      <td className="font-mono text-xs">{pos.token.slice(0, 10)}...</td>
                      <td className="font-mono text-sm">{pos.buyPrice}</td>
                      <td className="font-mono text-sm">{pos.buyAmountBnb}</td>
                      <td>
                        <span className={`badge ${pos.closed ? 'badge-secondary' : 'badge-success'}`}>
                          {pos.closed ? 'Closed' : 'Open'}
                        </span>
                      </td>
                      <td className="font-mono text-sm">{pos.profitLoss || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Logs */}
        {logs.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Recent Logs ({logs.length})</h3>
            <div className="bg-black rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
              {logs.slice(0, 50).map((log, idx) => (
                <div key={idx} className="py-1">
                  <span className="text-gray-500">[{formatDate(log.timestamp)}]</span>
                  <span className={`ml-2 font-bold ${
                    log.level === 'error' ? 'text-danger' :
                    log.level === 'warn' ? 'text-warning' :
                    log.level === 'info' ? 'text-success' : 'text-gray-400'
                  }`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="ml-2 text-gray-300">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <History className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Previous Sessions</h2>
        <span className="badge badge-info">{sessions.length} total</span>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400">No sessions yet</p>
          <p className="text-sm text-gray-500 mt-2">Start the bot to create your first session</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.sessionId}
              className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => handleViewSession(session)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{formatDate(session.startTime)}</span>
                    <span className={`badge ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {formatDuration(session.startTime, session.endTime)}</span>
                  </div>
                </div>
                <button className="btn btn-sm btn-primary">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-3">
                <div className="flex flex-col sm:flex-row gap-1">
                  <span className="text-gray-500 flex-shrink-0">Watched: </span>
                  <WalletAddress address={session.watchedWallet} short className="text-gray-400" />
                </div>
                <div className="flex flex-col sm:flex-row gap-1">
                  <span className="text-gray-500 flex-shrink-0">Bot: </span>
                  <WalletAddress address={session.botWallet} short className="text-gray-400" />
                </div>
              </div>

              {session.stats && (
                <div className="flex items-center space-x-4 mt-3 text-xs">
                  <span className="text-primary">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    {session.stats.tradesExecuted || 0} trades
                  </span>
                  <span className="text-success">
                    {session.stats.openPositions || 0} open
                  </span>
                  <span className="text-blue-400">
                    {session.stats.takeProfitExecuted || 0} profits
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
