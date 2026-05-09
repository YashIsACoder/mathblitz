'use client';

import { useAnalyticsStore } from '@/stores/analyticsStore';
import { useEffect } from 'react';
import { DateRangePicker } from './DateRangePicker';
import { OverviewMetrics } from './OverviewMetrics';
import { WeaknessPanel } from './WeaknessPanel';
import { SettingsPerformance } from './SettingsPerformance';
import { OperationHeatmaps } from './OperationHeatmaps';

export function AnalyticsDashboard() {
  const { fetchAll, isLoading, overview, weaknesses } = useAnalyticsStore();

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
