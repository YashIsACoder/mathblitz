'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Trend { date: string; score: number; accuracy: number; avgLatency: number }
interface Props { trends: Trend[] }

export function PerformanceCharts({ trends }: Props) {
  const formatted = trends.map(t => ({
    ...t,
    accuracy: Math.round(t.accuracy * 100),
    avgLatency: parseFloat((t.avgLatency / 1000).toFixed(2)),
    date: t.date.slice(5),
  }));

  return (
    <section className="space-y-6">
      <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Performance Over Time</h2>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
        <p className="text-xs text-zinc-600 mb-3 uppercase tracking-wider">Daily Score</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#52525b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6 }}
              labelStyle={{ color: '#a1a1aa' }}
            />
            <Line type="monotone" dataKey="score" stroke="#a3e635" strokeWidth={2} dot={false} />
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
              <LineChart data={formatted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#52525b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6 }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Line type="monotone" dataKey={key} stroke={stroke} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </section>
  );
}
