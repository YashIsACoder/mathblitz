'use client';

'use client';

import { useGameStore } from '@/stores/gameStore';
import { Operation } from '@/types';
import { useEffect, useState } from 'react';

const OPS: { key: Operation; label: string }[] = [
  { key: 'add', label: '+' },
  { key: 'sub', label: '−' },
  { key: 'mul', label: '×' },
  { key: 'div', label: '÷' },
];

interface Props {
  onStart: () => void;
}

interface LocalGameConfig {
  operations: Operation[];
  mode: 'timer' | 'endless' | 'target';
  minValue: number;
  maxValue: number;
  mulTableTarget: number | null;
  durationSeconds?: number;
  targetScore?: number;
}

export function GameConfig({ onStart }: Props) {
  const { config, setConfig } = useGameStore();
  const [localConfig, setLocalConfig] = useState<LocalGameConfig>(config as LocalGameConfig);

  // Load saved config on mount
  useEffect(() => {
    const saved = localStorage.getItem('mathblitz-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setLocalConfig(parsed);
      setConfig(parsed);
    }
  }, [setConfig]);

  const handleConfigChange = (newConfig: Partial<LocalGameConfig>) => {
    const updated = { ...localConfig, ...newConfig };
    setLocalConfig(updated);
    setConfig(updated);
    // Save to localStorage
    localStorage.setItem('mathblitz-settings', JSON.stringify(updated));
  };

  const handleStartGame = () => {
    setConfig(localConfig);
    onStart();
  };

  const toggleOp = (op: Operation) => {
    const ops = localConfig.operations.includes(op)
      ? localConfig.operations.filter(o => o !== op)
      : [...localConfig.operations, op];
    if (ops.length > 0) handleConfigChange({ operations: ops });
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
              className={`px-3 py-2 rounded border text-xs transition-colors ${
                localConfig.operations.includes(key)
                  ? 'border-zinc-300 bg-zinc-800 text-zinc-100'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
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
          {(['timer', 'endless', 'target'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => handleConfigChange({ mode })}
              className={`px-3 py-2 rounded border text-xs transition-colors ${
                localConfig.mode === mode
                  ? 'border-zinc-300 bg-zinc-800 text-zinc-100'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {localConfig.mode === 'timer' && (
        <div className="space-y-2">
          <label className="text-zinc-500 uppercase tracking-widest text-xs">Duration</label>
          <div className="flex gap-2">
            {[30, 60, 120, 180].map(seconds => (
              <button
                key={seconds}
                onClick={() => handleConfigChange({ durationSeconds: seconds })}
                className={`px-3 py-2 rounded border text-xs transition-colors ${
                  localConfig.durationSeconds === seconds
                    ? 'border-zinc-300 bg-zinc-800 text-zinc-100'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>
      )}

      {localConfig.mode === 'target' && (
        <div className="space-y-2">
          <label className="text-zinc-500 uppercase tracking-widest text-xs">Target Score</label>
          <div className="flex gap-2">
            {[20, 30, 50, 100].map(score => (
              <button
                key={score}
                onClick={() => handleConfigChange({ targetScore: score })}
                className={`px-3 py-2 rounded border text-xs transition-colors ${
                  localConfig.targetScore === score
                    ? 'border-zinc-300 bg-zinc-800 text-zinc-100'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-zinc-500 uppercase tracking-widest text-xs">Range</label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={localConfig.minValue}
              onChange={(e) => handleConfigChange({ minValue: parseInt(e.target.value) || 1 })}
              className="w-16 px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-100 text-sm"
              min="1"
              max="20"
            />
            <span className="text-zinc-400">to</span>
            <input
              type="number"
              value={localConfig.maxValue}
              onChange={(e) => handleConfigChange({ maxValue: parseInt(e.target.value) || 1 })}
              className="w-16 px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-100 text-sm"
              min="1"
              max="20"
            />
          </div>
          <button
            onClick={() => handleConfigChange({ minValue: 1, maxValue: 20 })}
            className="px-3 py-1 rounded border border-zinc-700 text-zinc-500 hover:border-zinc-600 text-xs"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-zinc-500 uppercase tracking-widest text-xs">Multiplication Table</label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={localConfig.mulTableTarget || ''}
              onChange={(e) => handleConfigChange({ mulTableTarget: parseInt(e.target.value) || null })}
              className="w-16 px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-100 text-sm"
              min="2"
              max="12"
              placeholder="All"
            />
            <button
              onClick={() => handleConfigChange({ mulTableTarget: null })}
              className="px-3 py-1 rounded border border-zinc-700 text-zinc-500 hover:border-zinc-600 text-xs"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
