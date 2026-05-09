'use client';

import { useAnalyticsStore } from '@/stores/analyticsStore';
import { useEffect, useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import { OperationHeatmaps } from './OperationHeatmaps';
import { OverviewMetrics } from './OverviewMetrics';
import { PerformanceCharts } from './PerformanceCharts';
import { WeaknessPanel } from './WeaknessPanel';

export function AnalyticsDashboard() {
  const { fetchAll, isLoading, overview, heatmapData, weaknesses, dailyTrends } = useAnalyticsStore();
  const [sessionTrends, setSessionTrends] = useState<any[]>([]);
  const [showSessions, setShowSessions] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDateRangeChange = async (startDate: string, endDate: string) => {
    try {
      const params = new URLSearchParams({ type: 'sessions' });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/analytics?${params}`);
      const { data } = await response.json();
      setSessionTrends(data);
      setShowSessions(true);
    } catch (error) {
      console.error('Failed to fetch session trends:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      {overview && <OverviewMetrics data={overview} />}
      
      <DateRangePicker onRangeChange={handleDateRangeChange} />
      
      {showSessions && sessionTrends.length > 0 && (
        <PerformanceCharts trends={sessionTrends} onDateRangeChange={handleDateRangeChange} />
      )}
      
      {!showSessions && dailyTrends.length > 0 && (
        <PerformanceCharts trends={dailyTrends} onDateRangeChange={handleDateRangeChange} />
      )}

      <OperationHeatmaps userId="default" />

      <WeaknessPanel insights={weaknesses} />
    </div>
  );
}
