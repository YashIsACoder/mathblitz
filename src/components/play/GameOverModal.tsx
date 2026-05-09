'use client';

interface Props {
  score: number;
  total: number;
  correct: number;
  onRestart: () => void;
  onBack: () => void;
}

export function GameOverModal({ score, total, correct, onRestart }: Props) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="text-center space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <p className="text-zinc-500 text-sm uppercase tracking-widest">Session Complete</p>
        <p className="text-8xl font-bold text-zinc-100 tabular-nums">{score}</p>
        <p className="text-zinc-500">correct answers</p>
      </div>

      <div className="flex gap-8 justify-center text-center">
        <div>
          <p className="text-2xl font-bold text-zinc-300">{accuracy}%</p>
          <p className="text-xs text-zinc-600 uppercase tracking-wider">Accuracy</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-300">{total}</p>
          <p className="text-xs text-zinc-600 uppercase tracking-wider">Attempted</p>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={onRestart}
          className="px-8 py-3 bg-zinc-100 text-zinc-900 font-bold rounded hover:bg-white transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
