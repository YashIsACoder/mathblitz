'use client';

import { AnalyticsOverview } from '@/types';

interface Props { data: AnalyticsOverview }

export function OverviewMetrics({ data }: Props) {
  const metrics = [
    { label: 'Total Answered', value: data.totalAttempts.toLocaleString() },
    { label: 'Accuracy', value: `${(data.accuracy * 100).toFixed(1)}%` },
    { label: 'Avg Latency', value: `${(data.avgLatencyMs / 1000).toFixed(2)}s` },
    { label: 'Median Latency', value: `${(data.medianLatencyMs / 1000).toFixed(2)}s` },
    { label: 'Best Score', value: data.bestScore.toString() },
    { label: 'Q / Min', value: data.questionsPerMinute.toFixed(1) },
    { label: 'Current Streak', value: data.currentStreak.toString() },
    { label: 'Best Streak', value: data.longestStreak.toString() },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-2xl font-bold text-zinc-100 tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
