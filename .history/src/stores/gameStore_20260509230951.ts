import { checkAnswer, generateQuestion } from '@/engine/questionGenerator';
import { Attempt, GameConfig, Question } from '@/types';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const DEFAULT_CONFIG: GameConfig = {
  operations: ['add', 'sub', 'mul'],
  mode: 'timer',
  durationSeconds: 60,
  targetScore: 50,
  minValue: 2,
  maxValue: 12,
  allowNegatives: false,
  allowDecimals: false,
  mulTableTarget: null,
};

type GamePhase = 'idle' | 'playing' | 'finished';

interface GameState {
  phase: GamePhase;
  config: GameConfig;
  sessionId: string | null;
  currentQuestion: Question | null;
  score: number;
  totalAttempts: number;
  correctAttempts: number;
  timeLeft: number;
  startTime: number | null;
  questionStartTime: number | null;
  pendingAttempts: Attempt[];
  adaptiveWeights: Record<string, number>;

  startGame: () => void;
  submitAnswer: (typed: string) => { correct: boolean; latencyMs: number };
  skipQuestion: () => void;
  endGame: () => void;
  setConfig: (partial: Partial<GameConfig>) => void;
  updateAdaptiveWeights: (weights: Record<string, number>) => void;
  clearPendingAttempts: () => void;
  tick: () => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    phase: 'idle',
    config: DEFAULT_CONFIG,
    sessionId: null,
    currentQuestion: null,
    score: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    timeLeft: DEFAULT_CONFIG.durationSeconds,
    startTime: null,
    questionStartTime: null,
    pendingAttempts: [],
    adaptiveWeights: {},

    startGame: () => {
      const config = get().config;
      const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const firstQuestion = generateQuestion(config);
      
      // Create session in database
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: config.mode, config }),
      }).then(res => res.json()).then(({ sessionId: dbSessionId }) => {
        set(s => ({ sessionId: dbSessionId }));
      }).catch(() => {
        // Fallback to client-generated session ID if DB fails
        set(s => ({ sessionId }));
      });
      
      set({
        phase: 'playing',
        sessionId, // Temporary, will be updated with DB session ID
        currentQuestion: firstQuestion,
        score: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        timeLeft: config.durationSeconds,
        startTime: Date.now(),
        questionStartTime: Date.now(),
        pendingAttempts: [],
      });
    },

    submitAnswer: (typed: string) => {
      const state = get();
      if (state.phase !== 'playing' || !state.currentQuestion || !state.questionStartTime) {
        return { correct: false, latencyMs: 0 };
      }

      const now = Date.now();
      const latencyMs = now - state.questionStartTime;
      const correct = checkAnswer(state.currentQuestion, typed);

      const attempt: Attempt = {
        questionId: state.currentQuestion.id,
        lhs: state.currentQuestion.lhs,
        rhs: state.currentQuestion.rhs,
        operation: state.currentQuestion.operation,
        correctAnswer: state.currentQuestion.answer,
        typedAnswer: parseFloat(typed) || null,
        isCorrect: correct,
        latencyMs,
        timestamp: now,
        sessionId: state.sessionId!,
        metadata: state.currentQuestion.metadata,
      };

      const nextQuestion = generateQuestion(state.config, state.adaptiveWeights);

      set(s => ({
        currentQuestion: nextQuestion,
        questionStartTime: now,
        score: correct ? s.score + 1 : s.score,
        totalAttempts: s.totalAttempts + 1,
        correctAttempts: correct ? s.correctAttempts + 1 : s.correctAttempts,
        pendingAttempts: [...s.pendingAttempts, attempt],
      }));

      if (state.config.mode === 'target' && get().score >= state.config.targetScore) {
        get().endGame();
      }

      return { correct, latencyMs };
    },

    skipQuestion: () => {
      const state = get();
      if (state.phase !== 'playing') return;
      const nextQuestion = generateQuestion(state.config, state.adaptiveWeights);
      set({ currentQuestion: nextQuestion, questionStartTime: Date.now() });
    },

    endGame: () => {
      set({ phase: 'finished' });
    },

    setConfig: (partial) => {
      set(s => ({ config: { ...s.config, ...partial } }));
    },

    updateAdaptiveWeights: (weights) => {
      set({ adaptiveWeights: weights });
    },

    clearPendingAttempts: () => {
      set({ pendingAttempts: [] });
    },

    tick: () => {
      const state = get();
      if (state.phase !== 'playing' || state.config.mode !== 'timer') return;
      const newTimeLeft = state.timeLeft - 1;
      if (newTimeLeft <= 0) {
        set({ timeLeft: 0 });
        get().endGame();
      } else {
        set({ timeLeft: newTimeLeft });
      }
    },
  }))
);
