'use client';

import { useEffect, useState } from 'react';

interface ErrorPatternData {
  totalMistakes: number;
  byOperation: Record<string, { count: number; total: number; errorRate: number }>;
  byTag: Record<string, { count: number; avgLatency: number }>;
  byNumberRange: Record<string, { count: number; avgLatency: number }>;
  insights: string[];
}

export function ErrorPatternAnalysis({ startDate, endDate }: { startDate?: string | null; endDate?: string | null }) {
  const [data, setData] = useState<ErrorPatternData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = '/api/analytics?type=error-patterns';
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetch(url);
        const { data: errorPatternData } = await response.json();
        setData(errorPatternData);
      } catch (error) {
        console.error('Failed to fetch error pattern analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading error pattern analysis...</span>
      </div>
    );
  }

  if (!data || data.totalMistakes === 0) {
    return (
      <div className="text-center text-zinc-500 text-sm py-8">
        No mistakes recorded yet - complete more sessions to see error patterns
      </div>
    );
  }

  const operationLabels = {
    add: 'Addition',
    sub: 'Subtraction',
    mul: 'Multiplication',
    div: 'Division',
  };

  const topTags = Object.entries(data.byTag)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const topRanges = Object.entries(data.byNumberRange)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  return (
    <section className="space-y-6">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Error Pattern Analysis</h2>

      {/* Total mistakes */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Total Mistakes</p>
        <p className="text-3xl font-bold text-zinc-100">{data.totalMistakes}</p>
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

      {/* By operation */}
      {Object.keys(data.byOperation).length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">By Operation</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(data.byOperation).map(([op, opData]) => (
              <div key={op} className="p-3 bg-zinc-800/50 rounded">
                <p className="text-sm font-bold text-zinc-300">{operationLabels[op as keyof typeof operationLabels]}</p>
                <p className="text-2xl font-bold text-red-400">{opData.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By cognitive tag */}
      {topTags.length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">Most Common Mistake Patterns</p>
          <div className="space-y-2">
            {topTags.map(([tag, tagData]) => (
              <div key={tag} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded">
                <span className="text-sm text-zinc-300">{tag.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>{tagData.count} mistakes</span>
                  <span>{tagData.avgLatency.toFixed(0)}ms avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By number range */}
      {topRanges.length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">Most Difficult Number Combinations</p>
          <div className="space-y-2">
            {topRanges.map(([range, rangeData]) => (
              <div key={range} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded">
                <span className="text-sm text-zinc-300">{range}</span>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>{rangeData.count} mistakes</span>
                  <span>{rangeData.avgLatency.toFixed(0)}ms avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
