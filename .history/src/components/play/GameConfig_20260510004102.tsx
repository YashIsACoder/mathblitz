'use client';

import { useGameStore } from '@/stores/gameStore';
import { Operation } from '@/types';

const OPS: { key: Operation; label: string }[] = [
  { key: 'add', label: '+' },
  { key: 'sub', label: '−' },
  { key: 'mul', label: '×' },
  { key: 'div', label: '÷' },
];

interface Props {
  onStart: () => void;
}

interface GameConfig {
  operations: Operation[];
  mode: 'timer' | 'endless' | 'target';
  minValue: number;
  maxValue: number;
  mulTableTarget: number | null;
}

export function GameConfig({ onStart }: Props) {
  const { config, updateConfig } = useGameStore();
  const [localConfig, setLocalConfig] = useState<GameConfig>(config);

  // Load saved config on mount
  useEffect(() => {
    const saved = localStorage.getItem('mathblitz-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setLocalConfig(parsed);
      updateConfig(parsed);
    }
  }, [updateConfig]);

  const handleConfigChange = (newConfig: Partial<GameConfig>) => {
    setLocalConfig({ ...localConfig, ...newConfig });
    updateConfig({ ...localConfig, ...newConfig });
    // Save to localStorage
    localStorage.setItem('mathblitz-settings', JSON.stringify({ ...localConfig, ...newConfig }));
  };

  const handleStartGame = () => {
    updateConfig(localConfig);
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
              {m === 'timer' ? '60s' : m}
            </button>
          ))}
        </div>
      </div>

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
