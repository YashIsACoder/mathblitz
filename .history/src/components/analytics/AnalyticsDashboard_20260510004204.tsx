'use client';

import { useAnalyticsStore } from '@/stores/analyticsStore';
import { useEffect, useState } from 'react';
import { MultiplicationHeatmap } from './MultiplicationHeatmap';
import { OverviewMetrics } from './OverviewMetrics';
import { PerformanceCharts } from './PerformanceCharts';
import { WeaknessPanel } from './WeaknessPanel';

export function AnalyticsDashboard() {
  const { fetchAll, isLoading, overview, heatmapData, weaknesses, dailyTrends } = useAnalyticsStore();
  const [heatmapMode, setHeatmapMode] = useState<'latency' | 'accuracy'>('latency');

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading analytics...</span>
      </div>
    );
  }

  const handleDateRangeChange = () => {
    // implement date range change handler
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      {overview && <OverviewMetrics data={overview} />}
      
      <DateRangePicker onRangeChange={handleDateRangeChange} />

      <SettingsPerformance />
      <OperationHeatmaps userId="default" />
      <WeaknessPanel insights={weaknesses} />
      {dailyTrends.length > 0 && <PerformanceCharts trends={dailyTrends} />}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">
            Multiplication Heatmap
          </h2>
          <div className="flex gap-1">
            {(['latency', 'accuracy'] as const).map(m => (
              <button
                key={m}
                onClick={() => setHeatmapMode(m)}
                className={`px-3 py-1 rounded text-xs uppercase tracking-wider ${
                  heatmapMode === m ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <MultiplicationHeatmap data={heatmapData} mode={heatmapMode} />
        <div className="flex gap-4 text-xs text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-900/60 inline-block" />
            Fast / Good
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-900/60 inline-block" />
            Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-900/60 inline-block" />
            Slow / Weak
          </span>
        </div>
      </section>

      <WeaknessPanel insights={weaknesses} />
    </div>
  );
}
