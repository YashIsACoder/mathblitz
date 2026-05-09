'use client';

import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis,
} from 'recharts';

interface SessionTrend { 
  timestamp: string; 
  score: number; 
  accuracy: number; 
  avgLatency: number;
  mode: string;
  duration: number | null;
}

interface Props { 
  trends: SessionTrend[];
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export function PerformanceCharts({ trends, onDateRangeChange }: Props) {
  const formatted = trends.map(t => ({
    ...t,
    accuracy: Math.round(t.accuracy * 100),
    avgLatency: parseFloat((t.avgLatency / 1000).toFixed(2)),
    timestamp: new Date(t.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
  }));

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Performance Over Time</h2>
        <div className="text-xs text-zinc-500">
          {trends.length} session{trends.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
        <p className="text-xs text-zinc-600 mb-3 uppercase tracking-wider">Session Scores</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fill: '#52525b', fontSize: 11 }} 
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fill: '#52525b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6 }}
              labelStyle={{ color: '#a1a1aa' }}
              formatter={(value, name) => {
                if (name === 'score') return [value, 'Score'];
                if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                if (name === 'avgLatency') return [`${value}s`, 'Avg Latency'];
                return [value, name];
              }}
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
              <LineChart data={formatted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis 
                  dataKey="timestamp" 
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
    </section>
  );
}
