import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function WalletAddress({ address, short = false, className = '' }) {
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr) => {
    if (short) {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    // For mobile: split into two lines
    const mid = Math.floor(addr.length / 2);
    return (
      <span className="block sm:inline">
        <span className="block sm:inline">{addr.slice(0, mid)}</span>
        <span className="block sm:inline">{addr.slice(mid)}</span>
      </span>
    );
  };

  return (
    <span className={`inline-flex items-center gap-2 font-mono text-sm ${className}`}>
      {formatAddress(address)}
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
        title="Copy address"
      >
        {copied ? (
          <Check className="w-3 h-3 text-success" />
        ) : (
          <Copy className="w-3 h-3 text-gray-400" />
        )}
      </button>
    </span>
  );
}
