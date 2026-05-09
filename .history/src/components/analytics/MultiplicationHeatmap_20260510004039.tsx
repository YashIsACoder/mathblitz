'use client';

import { HeatmapCell } from '@/types';
import { useMemo } from 'react';

interface Props {
  data: HeatmapCell[];
  mode: 'latency' | 'accuracy';
}

export function MultiplicationHeatmap({ data, mode }: Props) {
  const lookup = useMemo(() => {
    const m = new Map<string, HeatmapCell>();
    for (const cell of data) {
      m.set(`${cell.a}:${cell.b}`, cell);
      m.set(`${cell.b}:${cell.a}`, cell);
    }
    return m;
  }, [data]);

  const quartiles = useMemo(() => {
    const values = data.filter(c => mode === 'latency' ? c.avgLatency !== null : c.accuracy !== null);
    const numericValues = mode === 'latency' 
      ? values.map(c => c.avgLatency!)
      : values.map(c => c.accuracy!);
    
    if (numericValues.length === 0) {
      return { q1: 0, q2: 0, q3: 0 };
    }

    const sorted = numericValues.sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q2 = sorted[Math.floor(sorted.length * 0.5)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    
    return { q1, q2, q3 };
  }, [data, mode]);

  const cellColor = (cell: HeatmapCell | undefined): string => {
    if (!cell || cell.count === 0) return 'bg-zinc-900 text-zinc-700';
    
    if (mode === 'latency' && cell.avgLatency !== null) {
      const val = cell.avgLatency;
      if (val <= quartiles.q1) return 'bg-emerald-900/60 text-emerald-300';
      if (val <= quartiles.q2) return 'bg-teal-900/60 text-teal-300';
      if (val <= quartiles.q3) return 'bg-amber-900/60 text-amber-300';
      return 'bg-red-900/60 text-red-300';
    }
    
    if (mode === 'accuracy' && cell.accuracy !== null) {
      const val = cell.accuracy;
      if (val >= quartiles.q3) return 'bg-emerald-900/60 text-emerald-300';
      if (val >= quartiles.q2) return 'bg-teal-900/60 text-teal-300';
      if (val >= quartiles.q1) return 'bg-amber-900/60 text-amber-300';
      return 'bg-red-900/60 text-red-300';
    }
    
    return 'bg-zinc-800 text-zinc-400';
  };

  const cellValue = (cell: HeatmapCell | undefined): string => {
    if (!cell || cell.count === 0) return '–';
    if (mode === 'latency' && cell.avgLatency !== null)
      return `${(cell.avgLatency / 1000).toFixed(1)}s`;
    if (mode === 'accuracy' && cell.accuracy !== null)
      return `${Math.round(cell.accuracy * 100)}%`;
    return '?';
  };

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `2rem repeat(12, minmax(0, 1fr))` }}
      >
        <div />
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="text-center text-xs text-zinc-600 pb-1 font-bold">
            {i + 1}
          </div>
        ))}

        {Array.from({ length: 12 }, (_, rowIdx) => {
          const a = rowIdx + 1;
          return [
            <div key={`label-${a}`} className="flex items-center justify-center text-xs text-zinc-600 font-bold">
              {a}
            </div>,
            ...Array.from({ length: 12 }, (_, colIdx) => {
              const b = colIdx + 1;
              const cell = lookup.get(`${a}:${b}`);
              const product = a * b;
              return (
                <div
                  key={`${a}:${b}`}
                  title={`${a} × ${b} = ${product} | ${cellValue(cell)} | ${cell?.count ?? 0} attempts`}
                  className={`aspect-square rounded-sm flex flex-col items-center justify-center cursor-default transition-colors ${cellColor(cell)}`}
                >
                  <span className="text-[10px] font-bold tabular-nums leading-none">
                    {cellValue(cell)}
                  </span>
                </div>
              );
            }),
          ];
        })}
      </div>
    </div>
  );
}
