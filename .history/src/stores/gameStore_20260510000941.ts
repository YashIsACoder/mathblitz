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

const STORAGE_KEY = 'mathblitz-settings';

// Load saved config from localStorage
const loadSavedConfig = (): GameConfig => {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
};

// Helper functions for analytics
function calculateCarryCount(lhs: number, rhs: number, operation: string): number {
  if (operation !== 'add') return 0;
  let count = 0;
  let a = lhs;
  let b = rhs;
  while (b > 0) {
    const sum = (a % 10) + (b % 10);
    if (sum >= 10) count++;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return count;
}

function calculateBorrowCount(lhs: number, rhs: number, operation: string): number {
  if (operation !== 'sub') return 0;
  let count = 0;
  let a = lhs;
  let b = rhs;
  while (b > 0) {
    if ((a % 10) < (b % 10)) count++;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return count;
}

function calculateDifficultyScore(lhs: number, rhs: number, operation: string): number {
  const magnitude = Math.log10(lhs + rhs + 1);
  const operationFactor = { add: 1, sub: 1.1, mul: 1.5, div: 1.6 }[operation] || 1;
  return magnitude * operationFactor;
}

function generateCognitiveTags(lhs: number, rhs: number, operation: string): string[] {
  const tags: string[] = [];
  
  if (operation === 'mul') {
    tags.push('multiplication');
    if (lhs === 7 || rhs === 7) tags.push('multiplication_by_7');
    if (lhs === 8 || rhs === 8) tags.push('multiplication_by_8');
    if (lhs === 9 || rhs === 9) tags.push('multiplication_by_9');
    if (lhs === rhs) tags.push('multiplication_same_number');
  } else if (operation === 'add') {
    tags.push('addition');
    const carryCount = calculateCarryCount(lhs, rhs, operation);
    if (carryCount > 0) tags.push('carry_heavy_addition');
    if (carryCount >= 2) tags.push('multi_carry_addition');
  } else if (operation === 'sub') {
    tags.push('subtraction');
    const borrowCount = calculateBorrowCount(lhs, rhs, operation);
    if (borrowCount > 0) tags.push('borrow_heavy_subtraction');
    if (borrowCount >= 2) tags.push('multi_borrow_subtraction');
  } else if (operation === 'div') {
    tags.push('division');
    if (rhs === 7 || rhs === 8 || rhs === 9) tags.push('division_by_7_8_9');
  }
  
  return tags;
}

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
  setPhase: (phase: GamePhase) => void;
  setConfig: (partial: Partial<GameConfig>) => void;
  updateAdaptiveWeights: (weights: Record<string, number>) => void;
  clearPendingAttempts: () => void;
  tick: () => void;
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    phase: 'idle',
    config: loadSavedConfig(),
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

    startGame: async () => {
      const config = get().config;
      const firstQuestion = generateQuestion(config);
      
      // Create session in database first
      let sessionId: string;
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: config.mode, config }),
        });
        const { sessionId: dbSessionId } = await response.json();
        sessionId = dbSessionId;
      } catch (error) {
        console.error('Failed to create session:', error);
        // Fallback to client-generated session ID
        sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      }
      
      set({
        phase: 'playing',
        sessionId,
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

      set((s: GameState) => ({
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
      const state = get();
      if (state.sessionId) {
        fetch('/api/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sessionId: state.sessionId, 
            score: state.score, 
            endedAt: Date.now() 
          }),
        }).catch(() => {
          // Silently fail - session will remain open
        });
      }
      set({ phase: 'finished' });
    },

    setPhase: (phase: GamePhase) => {
      set({ phase });
    },

    setConfig: (partial: Partial<GameConfig>) => {
      set((s: GameState) => {
        const newConfig = { ...s.config, ...partial };
        // Save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
          } catch {
            // Silently fail if localStorage is not available
          }
        }
        return { config: newConfig };
      });
    },

    updateAdaptiveWeights: (weights: Record<string, number>) => {
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
