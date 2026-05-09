'use client';

import { useEffect, useState } from 'react';

interface AutomaticityData {
  categories: {
    automatic: number;
    comfortable: number;
    computed: number;
    struggled: number;
  };
  percentages: {
    automatic: number;
    comfortable: number;
    computed: number;
    struggled: number;
  };
  byOperation: Record<string, {
    automatic: number;
    comfortable: number;
    computed: number;
    struggled: number;
    total: number;
  }>;
  total: number;
}

export function AutomaticityAnalysis({ startDate, endDate }: { startDate?: string | null; endDate?: string | null }) {
  const [data, setData] = useState<AutomaticityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = '/api/analytics?type=automaticity';
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await fetch(url);
        const { data: automaticityData } = await response.json();
        setData(automaticityData);
      } catch (error) {
        console.error('Failed to fetch automaticity analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading automaticity analysis...</span>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="text-center text-zinc-500 text-sm py-8">
        No data available for automaticity analysis
      </div>
    );
  }

  const categoryColors = {
    automatic: 'bg-emerald-900/60 text-emerald-300',
    comfortable: 'bg-teal-900/60 text-teal-300',
    computed: 'bg-amber-900/60 text-amber-300',
    struggled: 'bg-red-900/60 text-red-300',
  };

  const categoryLabels = {
    automatic: '< 700ms (Automatic)',
    comfortable: '700-1400ms (Comfortable)',
    computed: '1400-3000ms (Computed)',
    struggled: '> 3000ms (Struggled)',
  };

  const operationLabels = {
    add: 'Addition',
    sub: 'Subtraction',
    mul: 'Multiplication',
    div: 'Division',
  };

  return (
    <section className="space-y-6">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Automaticity Analysis</h2>

      {/* Overall distribution */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">Response Speed Distribution ({data.total} attempts)</p>
        <div className="space-y-3">
          {Object.entries(data.percentages).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <span className="text-xs text-zinc-500 w-32 truncate">{categoryLabels[key as keyof typeof categoryLabels]}</span>
              <div className="flex-1 bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${categoryColors[key as keyof typeof categoryColors].split(' ')[0]}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400 font-mono w-12 text-right">{value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* By operation */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <p className="text-xs text-zinc-600 mb-4 uppercase tracking-wider">By Operation</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(data.byOperation).map(([op, opData]) => (
            <div key={op} className="space-y-2">
              <p className="text-sm font-bold text-zinc-300">{operationLabels[op as keyof typeof operationLabels]} ({opData.total})</p>
              <div className="space-y-1.5">
                {Object.entries(opData).filter(([key]) => key !== 'total').map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-zinc-800 rounded overflow-hidden">
                      <div
                        className={`h-full ${categoryColors[key as keyof typeof categoryColors].split(' ')[0]}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
        <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Insights</p>
        <ul className="space-y-2 text-xs text-zinc-400">
          {data.percentages.automatic > 50 && (
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>Strong automaticity: {data.percentages.automatic.toFixed(1)}% of responses are automatic</span>
            </li>
          )}
          {data.percentages.struggled > 20 && (
            <li className="flex items-start gap-2">
              <span className="text-red-400">•</span>
              <span>High struggle rate: {data.percentages.struggled.toFixed(1)}% of responses exceed 3 seconds</span>
            </li>
          )}
          {Object.entries(data.byOperation).some(([_, opData]) => opData.struggled > 30) && (
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span>Some operations show higher struggle rates - review specific operation breakdown</span>
            </li>
          )}
          {data.percentages.computed > 40 && (
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span>Many responses require computation ({data.percentages.computed.toFixed(1)}%) - consider focused practice</span>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
