'use client';

import { useEffect, useState } from 'react';

interface ConsistencyData {
  overallScore: number;
  overallStdDev: number;
  overallCV: number;
  byOperation: Record<string, {
    mean: number;
    stdDev: number;
    cv: number;
    score: number;
    count: number;
  }>;
}

export function ConsistencyScore({ startDate, endDate }: { startDate?: string | null; endDate?: string | null }) {
  const [data, setData] = useState<ConsistencyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = '/api/analytics?type=consistency';
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetch(url);
        const { data: consistencyData } = await response.json();
        setData(consistencyData);
      } catch (error) {
        console.error('Failed to fetch consistency score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading consistency score...</span>
      </div>
    );
  }

  if (!data || data.overallScore === 0) {
    return (
      <div className="text-center text-zinc-500 text-sm py-8">
        No data available for consistency score
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-teal-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-900/30';
    if (score >= 60) return 'bg-teal-900/30';
    if (score >= 40) return 'bg-amber-900/30';
    return 'bg-red-900/30';
  };

  const operationLabels = {
    add: 'Addition',
    sub: 'Subtraction',
    mul: 'Multiplication',
    div: 'Division',
  };

  return (
    <section className="space-y-6">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Consistency Score</h2>

      {/* Overall score */}
      <div className={`bg-zinc-900 rounded-lg border border-zinc-800 p-6 ${getScoreBg(data.overallScore)}`}>
        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Overall Consistency Score</p>
        <p className={`text-4xl font-bold ${getScoreColor(data.overallScore)}`}>{data.overallScore.toFixed(0)}/100</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
          <span>Std Dev: {data.overallStdDev.toFixed(0)}ms</span>
          <span>CV: {data.overallCV.toFixed(1)}%</span>
        </div>
      </div>

      {/* By operation */}
      {Object.keys(data.byOperation).length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">By Operation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(data.byOperation).map(([op, opData]) => (
              <div key={op} className={`p-4 rounded ${getScoreBg(opData.score)}`}>
                <p className="text-sm font-bold text-zinc-300">{operationLabels[op as keyof typeof operationLabels]}</p>
                <p className={`text-2xl font-bold ${getScoreColor(opData.score)}`}>{opData.score.toFixed(0)}/100</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                  <span>Mean: {opData.mean.toFixed(0)}ms</span>
                  <span>Std Dev: {opData.stdDev.toFixed(0)}ms</span>
                </div>
                <div className="mt-2 text-xs text-zinc-600">
                  CV: {opData.cv.toFixed(1)}% ({opData.count} attempts)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Insights</p>
        <ul className="space-y-2 text-xs text-zinc-400">
          {data.overallScore >= 80 && (
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>Excellent consistency: Your response times are very stable</span>
            </li>
          )}
          {data.overallScore >= 60 && data.overallScore < 80 && (
            <li className="flex items-start gap-2">
              <span className="text-teal-400">•</span>
              <span>Good consistency: Your response times are reasonably stable with some variation</span>
            </li>
          )}
          {data.overallScore >= 40 && data.overallScore < 60 && (
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span>Moderate consistency: Your response times show significant variation</span>
            </li>
          )}
          {data.overallScore < 40 && (
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>Low consistency: Your response times vary significantly - consider focused practice</span>
            </li>
          )}
          {Object.values(data.byOperation).some(op => op.score < 50) && (
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span>Some operations show lower consistency - review operation breakdown</span>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
