export type Operation = 'add' | 'sub' | 'mul' | 'div';

export type CognitiveTag =
  | 'near_power_of_10'
  | 'repeated_digits'
  | 'multiplication_by_7'
  | 'multiplication_by_8'
  | 'multiplication_by_9'
  | 'carry_heavy'
  | 'carry_light'
  | 'borrow_heavy'
  | 'borrow_light'
  | 'division_clean'
  | 'complement_to_100'
  | 'double_digit_both'
  | 'single_digit_both'
  | 'two_by_one'
  | 'one_by_two'
  | 'result_negative'
  | 'result_decimal';

export interface QuestionMetadata {
  lhsDigits: number;
  rhsDigits: number;
  carryCount: number;
  borrowCount: number;
  difficulty: number;
  tags: CognitiveTag[];
}

export interface Question {
  id: string;
  lhs: number;
  rhs: number;
  operation: Operation;
  answer: number;
  display: string;
  metadata: QuestionMetadata;
}

export interface Attempt {
  questionId: string;
  lhs: number;
  rhs: number;
  operation: Operation;
  correctAnswer: number;
  typedAnswer: number | null;
  isCorrect: boolean;
  latencyMs: number;
  timestamp: number;
  sessionId: string;
  metadata: QuestionMetadata;
}

export interface GameConfig {
  operations: Operation[];
  mode: 'timer' | 'endless' | 'target';
  durationSeconds: number;
  targetScore: number;
  minValue: number;
  maxValue: number;
  allowNegatives: boolean;
  allowDecimals: boolean;
  mulTableTarget: number | null;
}

export interface WeaknessScore {
  pattern: string;
  score: number;
  latencyP75: number;
  accuracy: number;
  sampleCount: number;
}

export interface WeaknessInsight {
  title: string;
  description: string;
  pattern: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface HeatmapCell {
  a: number;
  b: number;
  avgLatency: number | null;
  accuracy: number | null;
  count: number;
}

export interface AnalyticsOverview {
  totalAttempts: number;
  accuracy: number;
  avgLatencyMs: number;
  medianLatencyMs: number;
  bestScore: number;
  questionsPerMinute: number;
  currentStreak: number;
  longestStreak: number;
}
