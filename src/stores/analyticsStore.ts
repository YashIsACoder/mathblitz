import { create } from 'zustand';
import { AnalyticsOverview, HeatmapCell, WeaknessInsight } from '@/types';

interface AnalyticsState {
  overview: AnalyticsOverview | null;
  heatmapData: HeatmapCell[];
  weaknesses: WeaknessInsight[];
  dailyTrends: { date: string; score: number; accuracy: number; avgLatency: number }[];
  sessionHistory: { id: string; score: number; accuracy: number; date: string; duration: number }[];
  isLoading: boolean;
  lastFetched: number | null;

  fetchAll: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  overview: null,
  heatmapData: [],
  weaknesses: [],
  dailyTrends: [],
  sessionHistory: [],
  isLoading: false,
  lastFetched: null,

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const [overview, heatmap, weakness] = await Promise.all([
        fetch('/api/analytics?type=overview').then(r => r.json()),
        fetch('/api/analytics?type=heatmap').then(r => r.json()),
        fetch('/api/weakness').then(r => r.json()),
      ]);
      set({
        overview: overview.data,
        heatmapData: heatmap.data,
        weaknesses: weakness.insights,
        dailyTrends: overview.dailyTrends,
        sessionHistory: overview.sessionHistory,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
