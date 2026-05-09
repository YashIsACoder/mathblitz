'use client';

import { useEffect, useState } from 'react';

interface FatigueData {
  overallTrend: 'declining' | 'improving' | 'neutral';
  latencyTrend: number | null;
  accuracyTrend: number | null;
  bySession: Array<{
    sessionId: string;
    duration: number;
    latencyChange: number;
    accuracyChange: number;
    firstHalfAvgLatency: number;
    secondHalfAvgLatency: number;
    firstHalfAccuracy: number;
    secondHalfAccuracy: number;
  }>;
  insights: string[];
}

export function FatigueAnalysis({ startDate, endDate }: { startDate?: string | null; endDate?: string | null }) {
  const [data, setData] = useState<FatigueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = '/api/analytics?type=fatigue';
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetch(url);
        const { data: fatigueData } = await response.json();
        setData(fatigueData);
      } catch (error) {
        console.error('Failed to fetch fatigue analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading fatigue analysis...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-zinc-500 text-sm py-8">
        No data available for fatigue analysis
      </div>
    );
  }

  const getTrendColor = (trend: string) => {
    if (trend === 'declining') return 'text-red-400 bg-red-900/30';
    if (trend === 'improving') return 'text-emerald-400 bg-emerald-900/30';
    return 'text-zinc-400 bg-zinc-900/30';
  };

  const formatDuration = (ms: number) => {
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <section className="space-y-6">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Fatigue Analysis</h2>

      {/* Overall trend */}
      <div className={`bg-zinc-900 rounded-lg border border-zinc-800 p-6 ${getTrendColor(data.overallTrend).split(' ')[1]}`}>
        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Overall Performance Trend</p>
        <p className={`text-2xl font-bold ${getTrendColor(data.overallTrend).split(' ')[0]}`}>
          {data.overallTrend.charAt(0).toUpperCase() + data.overallTrend.slice(1)}
        </p>
        {data.latencyTrend !== null && data.accuracyTrend !== null && (
          <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
            <span>Speed: {data.latencyTrend > 0 ? '+' : ''}{data.latencyTrend.toFixed(1)}%</span>
            <span>Accuracy: {data.accuracyTrend > 0 ? '+' : ''}{data.accuracyTrend.toFixed(1)}%</span>
          </div>
        )}
      </div>

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

      {/* Session breakdown */}
      {data.bySession.length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">Session Breakdown</p>
          <div className="space-y-3">
            {data.bySession.slice(0, 10).map((session, index) => (
              <div key={index} className="p-3 bg-zinc-800/50 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500">Duration: {formatDuration(session.duration)}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={session.latencyChange > 0 ? 'text-red-400' : 'text-emerald-400'}>
                      Speed: {session.latencyChange > 0 ? '+' : ''}{session.latencyChange.toFixed(1)}%
                    </span>
                    <span className={session.accuracyChange < 0 ? 'text-red-400' : 'text-emerald-400'}>
                      Accuracy: {session.accuracyChange > 0 ? '+' : ''}{session.accuracyChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500">
                  <div>
                    <span className="text-zinc-600">First half:</span> {session.firstHalfAvgLatency.toFixed(0)}ms, {(session.firstHalfAccuracy * 100).toFixed(0)}% acc
                  </div>
                  <div>
                    <span className="text-zinc-600">Second half:</span> {session.secondHalfAvgLatency.toFixed(0)}ms, {(session.secondHalfAccuracy * 100).toFixed(0)}% acc
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.insights.length === 0 && data.bySession.length === 0 && (
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
          <p className="text-xs text-zinc-400">Not enough session data for fatigue analysis. Complete more sessions to see trends.</p>
        </div>
      )}
    </section>
  );
}
