'use client';

import { useGameStore } from '@/stores/gameStore';
import { Operation } from '@/types';

const OPS: { key: Operation; label: string }[] = [
  { key: 'add', label: '+' },
  { key: 'sub', label: '−' },
  { key: 'mul', label: '×' },
  { key: 'div', label: '÷' },
];

const TIMER_OPTIONS = [
  { seconds: 30, label: '30s' },
  { seconds: 60, label: '60s' },
  { seconds: 120, label: '2m' },
  { seconds: 300, label: '5m' },
];

export function GameConfig() {
  const { config, setConfig } = useGameStore();

  const toggleOp = (op: Operation) => {
    const ops = config.operations.includes(op)
      ? config.operations.filter(o => o !== op)
      : [...config.operations, op];
    if (ops.length > 0) setConfig({ operations: ops });
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-2">
        <label className="text-zinc-500 uppercase tracking-widest text-xs">Operations</label>
        <div className="flex gap-2">
          {OPS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleOp(key)}
              className={`flex-1 py-2 rounded border text-xl font-bold transition-all ${
                config.operations.includes(key)
                  ? 'border-zinc-300 text-zinc-100 bg-zinc-800'
                  : 'border-zinc-700 text-zinc-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-zinc-500 uppercase tracking-widest text-xs">Mode</label>
        <div className="flex gap-2">
          {(['timer', 'endless', 'target'] as const).map(m => (
            <button
              key={m}
              onClick={() => setConfig({ mode: m })}
              className={`flex-1 py-1.5 rounded border text-xs uppercase tracking-wider transition-all ${
                config.mode === m
                  ? 'border-zinc-300 text-zinc-100 bg-zinc-800'
                  : 'border-zinc-700 text-zinc-600'
              }`}
            >
              {m === 'timer' ? `${config.durationSeconds}s` : m}
            </button>
          ))}
        </div>
      </div>

      {config.mode === 'timer' && (
        <div className="space-y-2">
          <label className="text-zinc-500 uppercase tracking-widest text-xs">Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {TIMER_OPTIONS.map(({ seconds, label }) => (
              <button
                key={seconds}
                onClick={() => setConfig({ durationSeconds: seconds })}
                className={`py-1.5 rounded border text-xs uppercase tracking-wider transition-all ${
                  config.durationSeconds === seconds
                    ? 'border-zinc-300 text-zinc-100 bg-zinc-800'
                    : 'border-zinc-700 text-zinc-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Min', key: 'minValue' as const, min: 1, max: 50 },
          { label: 'Max', key: 'maxValue' as const, min: 2, max: 100 },
        ].map(({ label, key, min, max }) => (
          <div key={key} className="space-y-1">
            <label className="text-zinc-500 uppercase tracking-widest text-xs">{label}: {config[key]}</label>
            <input
              type="range"
              min={min}
              max={max}
              value={config[key]}
              onChange={e => setConfig({ [key]: parseInt(e.target.value) })}
              className="w-full accent-zinc-300"
            />
          </div>
        ))}
      </div>

      {config.operations.includes('mul') && (
        <div className="space-y-1">
          <label className="text-zinc-500 uppercase tracking-widest text-xs">
            Focus × Table (0 = all)
          </label>
          <select
            value={config.mulTableTarget ?? 0}
            onChange={e => setConfig({ mulTableTarget: parseInt(e.target.value) || null })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-zinc-300"
          >
            <option value={0}>All tables</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}× table</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
