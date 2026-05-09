'use client';

import { WeaknessInsight } from '@/types';

const SEVERITY_STYLE = {
  high: 'border-red-900/50 bg-red-950/20',
  medium: 'border-amber-900/50 bg-amber-950/20',
  low: 'border-zinc-700 bg-zinc-900',
};

const SEVERITY_BADGE = {
  high: 'bg-red-900/50 text-red-400',
  medium: 'bg-amber-900/50 text-amber-400',
  low: 'bg-zinc-800 text-zinc-500',
};

interface Props { insights: WeaknessInsight[] }

export function WeaknessPanel({ insights }: Props) {
  if (insights.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Weakness Detection</h2>
        <p className="text-zinc-600 text-sm">No weaknesses detected yet. Keep practicing!</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">
        Weakness Detection
      </h2>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`rounded-lg border p-4 space-y-1 ${SEVERITY_STYLE[insight.severity]}`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider font-bold ${SEVERITY_BADGE[insight.severity]}`}>
                {insight.severity}
              </span>
              <span className="text-zinc-200 font-bold text-sm">{insight.title}</span>
            </div>
            <p className="text-zinc-500 text-xs">{insight.description}</p>
            <p className="text-zinc-600 text-xs">💡 {insight.suggestion}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
