'use client';

import { HeatmapCell } from '@/types';
import { useEffect, useState } from 'react';

interface OperationData {
  [key: string]: HeatmapCell[];
}

export function OperationHeatmaps({ userId }: { userId: string }) {
  const [data, setData] = useState<OperationData>({});
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'latency' | 'accuracy'>('latency');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const operations = ['add', 'sub', 'mul', 'div'];
        const promises = operations.map(op => 
          fetch(`/api/analytics?type=operation&operation=${op}`)
            .then(res => res.json())
            .then(res => ({ operation: op, data: res.data }))
        );
        
        const results = await Promise.all(promises);
        const operationData: OperationData = {};
        results.forEach(result => {
          operationData[result.operation] = result.data;
        });
        setData(operationData);
      } catch (error) {
        console.error('Failed to fetch operation heatmaps:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading || !isClient) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading operation heatmaps...</span>
      </div>
    );
  }

  const operations = [
    { key: 'add', symbol: '+', label: 'Addition' },
    { key: 'sub', symbol: '−', label: 'Subtraction' },
    { key: 'mul', symbol: '×', label: 'Multiplication' },
    { key: 'div', symbol: '÷', label: 'Division' },
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Operation Heatmaps</h2>

      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-zinc-500">
          {mode === 'latency' ? 'Response Time' : 'Accuracy'} by quartile
        </div>
        <div className="flex gap-1">
          {(['latency', 'accuracy'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded text-xs uppercase tracking-wider ${
                mode === m ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {operations.map(op => (
          <div key={op.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-300">{op.symbol}</span>
              <span className="text-sm text-zinc-500">{op.label}</span>
            </div>
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <FlexibleHeatmap data={data[op.key] || []} mode={mode} operation={op.key} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-xs text-zinc-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-900/60 inline-block" />
          Q1 (Best)
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
          Q4 (Worst)
        </span>
      </div>
    </section>
  );
}

function FlexibleHeatmap({ data, mode, operation }: { data: HeatmapCell[]; mode: 'latency' | 'accuracy'; operation: string }) {
  const isMultiplication = operation === 'mul';
  
  if (data.length === 0) {
    return (
      <div className="text-center text-zinc-500 text-sm py-8">
        No data available for this operation
      </div>
    );
  }

  const quartiles = (() => {
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
  })();

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

  // For multiplication, use the standard 12x12 grid
  if (isMultiplication) {
    const lookup = new Map<string, HeatmapCell>();
    for (const cell of data) {
      lookup.set(`${cell.a}:${cell.b}`, cell);
      lookup.set(`${cell.b}:${cell.a}`, cell);
    }

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

  // For other operations, show a simplified grid based on actual data
  const lookup = new Map<string, HeatmapCell>();
  for (const cell of data) {
    lookup.set(`${cell.a}:${cell.b}`, cell);
  }

  const uniqueA = Array.from(new Set(data.map(c => c.a))).sort((a, b) => a - b);
  const uniqueB = Array.from(new Set(data.map(c => c.b))).sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `2rem repeat(${uniqueB.length}, minmax(0, 1fr))` }}
      >
        <div />
        {uniqueB.map(b => (
          <div key={b} className="text-center text-xs text-zinc-600 pb-1 font-bold">
            {b}
          </div>
        ))}

        {uniqueA.map(a => [
          <div key={`label-${a}`} className="flex items-center justify-center text-xs text-zinc-600 font-bold">
            {a}
          </div>,
          ...uniqueB.map(b => {
            const cell = lookup.get(`${a}:${b}`);
            const result = operation === 'add' ? a + b : operation === 'sub' ? a - b : operation === 'div' ? a / b : a * b;
            return (
              <div
                key={`${a}:${b}`}
                title={`${a} ${operation === 'add' ? '+' : operation === 'sub' ? '-' : operation === 'div' ? '÷' : '×'} ${b} = ${result} | ${cellValue(cell)} | ${cell?.count ?? 0} attempts`}
                className={`aspect-square rounded-sm flex flex-col items-center justify-center cursor-default transition-colors ${cellColor(cell)}`}
              >
                <span className="text-[10px] font-bold tabular-nums leading-none">
                  {cellValue(cell)}
                </span>
              </div>
            );
          }),
        ])}
      </div>
    </div>
  );
}
