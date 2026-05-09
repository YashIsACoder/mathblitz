'use client';

import { useEffect, useState } from 'react';

interface SwitchingCostData {
  switchingCosts: Record<string, { count: number; avgLatency: number; baselineLatency: number; cost: number }>;
  insights: string[];
}

export function OperationSwitchingCost({ startDate, endDate }: { startDate?: string | null; endDate?: string | null }) {
  const [data, setData] = useState<SwitchingCostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = '/api/analytics?type=switching-cost';
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetch(url);
        const { data: switchingCostData } = await response.json();
        setData(switchingCostData);
      } catch (error) {
        console.error('Failed to fetch operation switching cost:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading operation switching cost...</span>
      </div>
    );
  }

  if (!data || Object.keys(data.switchingCosts).length === 0) {
    return (
      <div className="text-center text-zinc-500 text-sm py-8">
        Not enough data for switching cost analysis - complete more sessions with mixed operations
      </div>
    );
  }

  const getCostColor = (cost: number) => {
    if (cost > 20) return 'text-red-400 bg-red-900/30';
    if (cost > 10) return 'text-amber-400 bg-amber-900/30';
    if (cost > 5) return 'text-yellow-400 bg-yellow-900/30';
    return 'text-emerald-400 bg-emerald-900/30';
  };

  const sortedTransitions = Object.entries(data.switchingCosts)
    .filter(([_, d]) => d.count >= 3)
    .sort((a, b) => b[1].cost - a[1].cost);

  return (
    <section className="space-y-6">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Operation Switching Cost</h2>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">Insights</p>
          <ul className="space-y-2 text-xs text-zinc-400">
            {data.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Switching costs breakdown */}
      {sortedTransitions.length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">Switching Costs by Transition</p>
          <div className="space-y-3">
            {sortedTransitions.map(([transition, costData]) => (
              <div key={transition} className={`p-4 rounded ${getCostColor(costData.cost).split(' ')[1]}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-zinc-300">{transition}</span>
                  <span className={`text-lg font-bold ${getCostColor(costData.cost).split(' ')[0]}`}>
                    +{costData.cost.toFixed(0)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500">
                  <div>
                    <span className="text-zinc-600">Avg latency:</span> {costData.avgLatency.toFixed(0)}ms
                  </div>
                  <div>
                    <span className="text-zinc-600">Baseline:</span> {costData.baselineLatency.toFixed(0)}ms
                  </div>
                  <div>
                    <span className="text-zinc-600">Count:</span> {costData.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All transitions */}
      {Object.keys(data.switchingCosts).length > sortedTransitions.length && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">All Transitions</p>
          <div className="space-y-2">
            {Object.entries(data.switchingCosts)
              .sort((a, b) => b[1].cost - a[1].cost)
              .map(([transition, costData]) => (
                <div key={transition} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded">
                  <span className="text-sm text-zinc-300">{transition}</span>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>{costData.count} times</span>
                    <span className={costData.cost > 10 ? 'text-red-400' : costData.cost > 5 ? 'text-amber-400' : 'text-emerald-400'}>
                      +{costData.cost.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
