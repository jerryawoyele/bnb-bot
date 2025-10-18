import { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, Download } from 'lucide-react';

export default function LogsView({ socket }) {
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [newLogFlash, setNewLogFlash] = useState(false);
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for initial logs from database
    socket.on('initialLogs', (initialLogs) => {
      console.log(`📥 Loaded ${initialLogs.length} logs from database`);
      setLogs(initialLogs);
      // Scroll to bottom after loading initial logs
      setTimeout(() => {
        if (logsEndRef.current) {
          logsEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      }, 100);
    });

    // Listen for new log events (real-time)
    socket.on('log', (log) => {
      setLogs((prev) => {
        const newLogs = [...prev, log].slice(-500); // Keep last 500 logs
        return newLogs;
      });
      
      // Flash indicator for new log
      setNewLogFlash(true);
      setTimeout(() => setNewLogFlash(false), 300);
    });

    return () => {
      socket.off('initialLogs');
      socket.off('log');
    };
  }, [socket]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    setAutoScroll(isAtBottom);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] [${log.level}] ${log.message}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLogColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
        return 'text-danger';
      case 'WARN':
        return 'text-warning';
      case 'INFO':
        return 'text-success';
      case 'DEBUG':
        return 'text-gray-400';
      default:
        return 'text-gray-300';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Real-Time Logs</h2>
          <span className="badge badge-info">{logs.length} logs</span>
          {newLogFlash && (
            <span className="text-xs text-success animate-pulse">● New</span>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-gray-400">Auto-scroll</span>
          </label>

          <button
            onClick={downloadLogs}
            className="btn bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-2 px-3"
            disabled={logs.length === 0}
          >
            <Download className="w-4 h-4 inline mr-1" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={clearLogs}
            className="btn btn-danger text-xs sm:text-sm py-2 px-3"
            disabled={logs.length === 0}
          >
            <Trash2 className="w-4 h-4 inline mr-1" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      <div
        ref={logsContainerRef}
        onScroll={handleScroll}
        className="bg-black rounded-lg p-4 overflow-y-auto font-mono text-xs sm:text-sm"
        style={{ 
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          height: 'calc(100vh - 280px)',
          minHeight: '400px'
        }}
      >
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <Terminal className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Waiting for logs...</p>
            <p className="text-xs mt-2">Logs will appear here in real-time</p>
          </div>
        ) : (
          logs.map((log, index) => {
            const isNewest = index === logs.length - 1 && newLogFlash;
            const key = log.id || `${log.timestamp}-${index}`;
            
            return (
              <div 
                key={key} 
                className={`py-1 hover:bg-gray-900/50 transition-all ${
                  isNewest ? 'bg-primary/10 animate-pulse' : ''
                }`}
              >
                <span className="text-gray-500">[{formatTimestamp(log.timestamp)}]</span>
                <span className={`ml-2 font-bold ${getLogColor(log.level)}`}>
                  [{log.level?.toUpperCase()}]
                </span>
                <span className="ml-2 text-gray-300">{log.message}</span>
                {log.data && (
                  <pre className="ml-8 mt-1 text-xs text-gray-400 overflow-x-auto">
                    {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
