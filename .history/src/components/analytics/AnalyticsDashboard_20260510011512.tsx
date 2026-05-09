'use client';

import { useAnalyticsStore } from '@/stores/analyticsStore';
import { useEffect, useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import { OperationHeatmaps } from './OperationHeatmaps';
import { OverviewMetrics } from './OverviewMetrics';
import { SettingsPerformance } from './SettingsPerformance';
import { WeaknessPanel } from './WeaknessPanel';

export function AnalyticsDashboard() {
  const { fetchAll, isLoading, overview, weaknesses } = useAnalyticsStore();
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading analytics...</span>
      </div>
    );
  }

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      {overview && <OverviewMetrics data={overview} />}
      
      <DateRangePicker onRangeChange={handleDateRangeChange} />

      <SettingsPerformance startDate={dateRange.startDate} endDate={dateRange.endDate} />
      <OperationHeatmaps userId="default" />
      <WeaknessPanel insights={weaknesses} />
    </div>
  );
}
