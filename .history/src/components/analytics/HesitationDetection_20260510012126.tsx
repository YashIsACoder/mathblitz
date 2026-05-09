'use client';

import { useEffect, useState } from 'react';

interface HesitationData {
  globalAvgLatency: number;
  tagAnalysis: Array<{
    tag: string;
    avgLatency: number;
    count: number;
    operations: string[];
    deviation: number;
  }>;
  insights: Array<{
    pattern: string;
    avgLatency: number;
    deviation: number;
    operations: string[];
    message: string;
  }>;
}

export function HesitationDetection({ startDate, endDate }: { startDate?: string | null; endDate?: string | null }) {
  const [data, setData] = useState<HesitationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = '/api/analytics?type=hesitation';
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetch(url);
        const { data: hesitationData } = await response.json();
        setData(hesitationData);
      } catch (error) {
        console.error('Failed to fetch hesitation detection:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading hesitation detection...</span>
      </div>
    );
  }

  if (!data || data.globalAvgLatency === 0) {
    return (
      <div className="text-center text-zinc-500 text-sm py-8">
        No data available for hesitation detection
      </div>
    );
  }

  const getDeviationColor = (deviation: number) => {
    if (deviation > 0.5) return 'text-red-400';
    if (deviation > 0.3) return 'text-amber-400';
    if (deviation > 0.1) return 'text-yellow-400';
    return 'text-zinc-400';
  };

  const getDeviationBg = (deviation: number) => {
    if (deviation > 0.5) return 'bg-red-900/30';
    if (deviation > 0.3) return 'bg-amber-900/30';
    if (deviation > 0.1) return 'bg-yellow-900/30';
    return 'bg-zinc-900/30';
  };

  return (
    <section className="space-y-6">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Hesitation Detection</h2>

      {/* Global average */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Global Average Response Time</p>
        <p className="text-2xl font-bold text-zinc-100">{data.globalAvgLatency.toFixed(0)}ms</p>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">Detected Hesitation Patterns</p>
          <div className="space-y-3">
            {data.insights.map((insight, index) => (
              <div key={index} className={`p-3 rounded ${getDeviationBg(insight.deviation)}`}>
                <p className="text-sm text-zinc-300">{insight.message}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                  <span>Deviation: <span className={getDeviationColor(insight.deviation)} font-mono">+{(insight.deviation * 100).toFixed(0)}%</span></span>
                  <span>Operations: {insight.operations.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag analysis */}
      {data.tagAnalysis.length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">Pattern Analysis</p>
          <div className="space-y-2">
            {data.tagAnalysis.slice(0, 10).map((tag, index) => (
              <div key={index} className="flex items-center gap-4 text-sm">
                <span className="w-32 text-zinc-400 truncate">{tag.tag.replace(/_/g, ' ')}</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-zinc-500 w-20 text-right">{tag.avgLatency.toFixed(0)}ms</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${tag.deviation > 0.3 ? 'bg-red-500' : tag.deviation > 0.1 ? 'bg-amber-500' : 'bg-zinc-500'}`}
                      style={{ width: `${Math.min(Math.abs(tag.deviation) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`w-16 text-right font-mono ${getDeviationColor(tag.deviation)}`}>
                    {tag.deviation > 0 ? '+' : ''}{(tag.deviation * 100).toFixed(0)}%
                  </span>
                </div>
                <span className="text-zinc-500 text-xs w-16 text-right">{tag.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.insights.length === 0 && data.tagAnalysis.length === 0 && (
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
          <p className="text-xs text-zinc-400">No significant hesitation patterns detected. Your response times are consistent across different arithmetic patterns.</p>
        </div>
      )}
    </section>
  );
}
