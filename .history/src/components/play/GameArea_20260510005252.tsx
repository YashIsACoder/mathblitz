'use client';

import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameStore } from '@/stores/gameStore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GameConfig } from './GameConfig';
import { GameOverModal } from './GameOverModal';

export function GameArea() {
  useGameLoop();

  const {
    phase, currentQuestion, score, totalAttempts,
    correctAttempts, timeLeft, config, startGame, submitAnswer, endGame, setConfig,
  } = useGameStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    if (phase === 'playing') inputRef.current?.focus();
  }, [phase, currentQuestion]);

  const handleKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && phase === 'playing') {
      if (inputValue.trim() === '') return;
      const { correct } = submitAnswer(inputValue);
      setFeedback(correct ? 'correct' : 'wrong');
      setInputValue('');
      setTimeout(() => setFeedback(null), 200);
    }
    if (e.key === 'Escape') endGame();
  }, [inputValue, phase, submitAnswer, endGame]);

  const accuracy = totalAttempts > 0
    ? Math.round((correctAttempts / totalAttempts) * 100)
    : 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      {phase === 'idle' && (
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-100">Ready?</h1>
            <p className="text-zinc-500 text-sm">Configure below, then press Start.</p>
          </div>
          <GameConfig />
          <button
            onClick={startGame}
            className="w-full py-4 bg-zinc-100 text-zinc-900 font-bold text-lg rounded tracking-wider hover:bg-white transition-colors"
          >
            START
          </button>
        </div>
      )}

      {phase === 'playing' && currentQuestion && (
        <div className="w-full max-w-lg text-center space-y-8">
          <div className="flex justify-between items-center text-sm text-zinc-500 font-mono">
            {config.mode === 'timer' && (
              <span className={`text-2xl font-bold tabular-nums ${timeLeft <= 10 ? 'text-red-400' : 'text-zinc-300'}`}>
                {timeLeft}s
              </span>
            )}
            <div className="flex gap-6 ml-auto">
              <span>Score <strong className="text-zinc-100">{score}</strong></span>
              <span>Acc <strong className="text-zinc-100">{accuracy}%</strong></span>
            </div>
          </div>

          <div
            className={`transition-colors duration-150 ${
              feedback === 'correct' ? 'text-green-400'
              : feedback === 'wrong' ? 'text-red-400'
              : 'text-zinc-100'
            }`}
          >
            <span className="text-6xl sm:text-8xl font-bold tracking-tight select-none">
              {currentQuestion.display} =
            </span>
          </div>

          <input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKey}
            className="w-full bg-transparent border-b-2 border-zinc-600 focus:border-zinc-300 text-center text-4xl font-bold text-zinc-100 outline-none py-2 transition-colors tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="?"
            autoComplete="off"
            autoFocus
          />

          <p className="text-zinc-600 text-xs">Press Enter to submit • Esc to quit</p>
        </div>
      )}

      {phase === 'finished' && (
        <GameOverModal
          score={score}
          total={totalAttempts}
          correct={correctAttempts}
          onRestart={startGame}
          onBack={() => {}}
        />
      )}
    </div>
  );
}
