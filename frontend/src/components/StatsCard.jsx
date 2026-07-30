import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

export default function StatsCard({ title, value, icon: Icon, color, trend }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.startsWith('+') ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={clsx(
                'text-xs font-medium',
                trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
              )}>
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
