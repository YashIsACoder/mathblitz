'use client';

import { HeatmapCell } from '@/types';
import { useEffect, useState } from 'react';
import { MultiplicationHeatmap } from './MultiplicationHeatmap';

interface Props {
  userId: string;
}

export function OperationHeatmaps({ userId }: Props) {
  const [mode, setMode] = useState<'accuracy' | 'latency'>('accuracy');
  const [heatmaps, setHeatmaps] = useState<Record<string, HeatmapCell[]>>({});
  const [loading, setLoading] = useState(true);

  const operations = ['add', 'sub', 'mul', 'div'];
  const operationLabels: Record<string, string> = {
    add: 'Addition (+)',
    sub: 'Subtraction (−)',
    mul: 'Multiplication (×)',
    div: 'Division (÷)',
  };

  useEffect(() => {
    const fetchHeatmaps = async () => {
      setLoading(true);
      try {
        const promises = operations.map(op =>
          fetch(`/api/analytics?type=operation&operation=${op}`)
            .then(r => r.json())
            .then(data => ({ [op]: data.data }))
        );
        const results = await Promise.all(promises);
        const merged = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setHeatmaps(merged);
      } catch (error) {
        console.error('Failed to fetch heatmaps:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmaps();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading heatmaps...</span>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">
          Operation Heatmaps
        </h2>
        <div className="flex gap-1">
          {(['accuracy', 'latency'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded text-xs uppercase tracking-wider transition-colors ${
                mode === m 
                  ? 'bg-zinc-700 text-zinc-100' 
                  : 'text-zinc-600 hover:bg-zinc-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {operations.map(op => (
          <div key={op} className="space-y-3">
            <h3 className="text-zinc-300 text-sm font-semibold">
              {operationLabels[op]}
            </h3>
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <MultiplicationHeatmap data={heatmaps[op] || []} mode={mode} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-xs text-zinc-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-900/60 inline-block" />
          Q1 (Fastest / Best)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-teal-900/60 inline-block" />
          Q2
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-900/60 inline-block" />
          Q3
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-900/60 inline-block" />
          Q4 (Slowest / Weakest)
        </span>
      </div>
    </section>
  );
}
