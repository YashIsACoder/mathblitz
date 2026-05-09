'use client';

import { useEffect, useState } from 'react';

interface RecoveryData {
  avgLatencyAfterError: number | null;
  avgLatencyAfterCorrect: number | null;
  errorRateAfterError: number | null;
  errorRateAfterCorrect: number | null;
  recoveryScore: number | null;
  insights: string[];
}

export function RecoveryAfterError({ startDate, endDate }: { startDate?: string | null; endDate?: string | null }) {
  const [data, setData] = useState<RecoveryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = '/api/analytics?type=recovery';
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetch(url);
        const { data: recoveryData } = await response.json();
        setData(recoveryData);
      } catch (error) {
        console.error('Failed to fetch recovery analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading recovery analysis...</span>
      </div>
    );
  }

  if (!data || data.recoveryScore === null) {
    return (
      <div className="text-center text-zinc-500 text-sm py-8">
        Not enough data for recovery analysis - complete more sessions
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-900/30';
    if (score >= 50) return 'text-teal-400 bg-teal-900/30';
    if (score >= 30) return 'text-amber-400 bg-amber-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  return (
    <section className="space-y-6">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Recovery After Error</h2>

      {/* Recovery score */}
      <div className={`bg-zinc-900 rounded-lg border border-zinc-800 p-6 ${getScoreColor(data.recoveryScore).split(' ')[1]}`}>
        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Recovery Score</p>
        <p className={`text-4xl font-bold ${getScoreColor(data.recoveryScore).split(' ')[0]}`}>{data.recoveryScore.toFixed(0)}/100</p>
      </div>

      {/* Latency comparison */}
      {data.avgLatencyAfterError !== null && data.avgLatencyAfterCorrect !== null && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">Latency After Previous Outcome</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-800/50 rounded">
              <p className="text-xs text-zinc-500 mb-1">After Error</p>
              <p className="text-2xl font-bold text-zinc-100">{data.avgLatencyAfterError.toFixed(0)}ms</p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded">
              <p className="text-xs text-zinc-500 mb-1">After Correct</p>
              <p className="text-2xl font-bold text-zinc-100">{data.avgLatencyAfterCorrect.toFixed(0)}ms</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-500 text-center">
            {data.avgLatencyAfterError > data.avgLatencyAfterCorrect * 1.1 && 'You slow down after errors'}
            {data.avgLatencyAfterError < data.avgLatencyAfterCorrect * 0.9 && 'You speed up after errors'}
            {Math.abs(data.avgLatencyAfterError - data.avgLatencyAfterCorrect) / data.avgLatencyAfterCorrect < 0.1 && 'Latency is consistent regardless of outcome'}
          </div>
        </div>
      )}

      {/* Error rate comparison */}
      {data.errorRateAfterError !== null && data.errorRateAfterCorrect !== null && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">Error Rate After Previous Outcome</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-800/50 rounded">
              <p className="text-xs text-zinc-500 mb-1">After Error</p>
              <p className="text-2xl font-bold text-red-400">{(data.errorRateAfterError * 100).toFixed(0)}%</p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded">
              <p className="text-xs text-zinc-500 mb-1">After Correct</p>
              <p className="text-2xl font-bold text-emerald-400">{(data.errorRateAfterCorrect * 100).toFixed(0)}%</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-500 text-center">
            {data.errorRateAfterError > data.errorRateAfterCorrect * 1.3 && 'Error cascade detected'}
            {data.errorRateAfterError < data.errorRateAfterCorrect * 0.7 && 'Good recovery from errors'}
            {Math.abs(data.errorRateAfterError - data.errorRateAfterCorrect) / data.errorRateAfterCorrect < 0.3 && 'Error rate is consistent regardless of outcome'}
          </div>
        </div>
      )}

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
    </section>
  );
}
