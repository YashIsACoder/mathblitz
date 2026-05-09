'use client';

import { useState } from 'react';
import { GameArea } from '@/components/play/GameArea';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export default function Home() {
  const [tab, setTab] = useState<'play' | 'analytics'>('play');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
        <span className="text-sm font-bold tracking-widest text-zinc-400 uppercase">
          MathBlitz
        </span>
        <div className="flex gap-1">
          {(['play', 'analytics'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-sm tracking-wider uppercase transition-all ${
                tab === t
                  ? 'bg-zinc-100 text-zinc-900 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </nav>

      <main className="pt-16">
        {tab === 'play' ? <GameArea /> : <AnalyticsDashboard />}
      </main>
    </div>
  );
}
