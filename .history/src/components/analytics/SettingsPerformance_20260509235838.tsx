'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

interface SettingGroup {
  key: string;
  sessions: any[];
  config: any;
}

export function SettingsPerformance() {
  const [data, setData] = useState<SettingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/analytics?type=settings');
        const { data: settingsData } = await response.json();
        setData(settingsData);
        if (settingsData.length > 0) {
          setSelectedGroup(settingsData[0].key);
        }
      } catch (error) {
        console.error('Failed to fetch settings performance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatSettingLabel = (config: any) => {
    const modeLabel = config.mode === 'timer' ? `${config.durationSeconds}s` : config.mode;
    const ops = config.operations.join(', ');
    return `${modeLabel} | ${ops} | ${config.minValue}-${config.maxValue}`;
  };

  const selectedData = data.find(g => g.key === selectedGroup)?.sessions || [];

  const formattedData = selectedData.map((s: any) => ({
    ...s,
    accuracy: Math.round(s.accuracy * 100),
    avgLatency: parseFloat((s.avgLatency / 1000).toFixed(2)),
    date: new Date(s.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-zinc-600 text-sm animate-pulse">Loading settings performance...</span>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Performance by Settings</h2>

      <div className="space-y-3">
        <label className="text-zinc-500 uppercase tracking-widest text-xs">Select Configuration</label>
        <div className="flex flex-wrap gap-2">
          {data.map(group => (
            <button
              key={group.key}
              onClick={() => setSelectedGroup(group.key)}
              className={`px-3 py-2 rounded border text-xs transition-colors ${
                selectedGroup === group.key
                  ? 'border-zinc-300 bg-zinc-800 text-zinc-100'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
              }`}
            >
              {formatSettingLabel(group.config)}
            </button>
          ))}
        </div>
      </div>

      {selectedData.length > 0 ? (
        <>
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 mb-3 uppercase tracking-wider">Score Over Time</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#52525b', fontSize: 11 }} 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#52525b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6 }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Line type="monotone" dataKey="score" stroke="#a3e635" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'accuracy', label: 'Accuracy (%)', stroke: '#34d399' },
              { key: 'avgLatency', label: 'Avg Latency (s)', stroke: '#f97316' },
            ].map(({ key, label, stroke }) => (
              <div key={key} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                <p className="text-xs text-zinc-600 mb-3 uppercase tracking-wider">{label}</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#52525b', fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: '#52525b', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6 }}
                      labelStyle={{ color: '#a1a1aa' }}
                      formatter={(value, name) => {
                        if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                        if (name === 'avgLatency') return [`${value}s`, 'Avg Latency'];
                        return [value, name];
                      }}
                    />
                    <Line type="monotone" dataKey={key} stroke={stroke} strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center text-zinc-500 text-sm py-8">
          No data available for this configuration
        </div>
      )}
    </section>
  );
}
