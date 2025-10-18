import { TrendingUp, TrendingDown, Filter, Package, DollarSign, RefreshCw } from 'lucide-react';

export default function StatsGrid({ stats }) {
  if (!stats) return null;

  const statItems = [
    {
      label: 'Trades Executed',
      value: stats.tradesExecuted || 0,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'Trades Failed',
      value: stats.tradesFailed || 0,
      icon: TrendingDown,
      color: 'text-danger',
      bgColor: 'bg-danger/10'
    },
    {
      label: 'Trades Filtered',
      value: stats.tradesFiltered || 0,
      icon: Filter,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'Open Positions',
      value: stats.openPositions || 0,
      icon: Package,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Take Profits',
      value: stats.takeProfitExecuted || 0,
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Wallet Switches',
      value: stats.walletSwitches || 0,
      icon: RefreshCw,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((item) => (
        <div key={item.label} className="card">
          <div className={`${item.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
            <item.icon className={`w-6 h-6 ${item.color}`} />
          </div>
          <p className="text-2xl font-bold mb-1">{item.value}</p>
          <p className="text-sm text-gray-400">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
