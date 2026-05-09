import { Attempt, Operation } from '@/types';

interface PatternScore {
  operation: Operation;
  tag?: string;
  accuracyScore: number;
  latencyScore: number;
  recencyWeight: number;
  weaknessScore: number;
}

const LATENCY_THRESHOLDS: Record<Operation, number> = {
  add: 3000,
  sub: 4000,
  mul: 5000,
  div: 6000,
};

export function computeAdaptiveWeights(
  recentAttempts: Attempt[],
  operations: Operation[]
): Record<string, number> {
  if (recentAttempts.length < 10) return {};

  const weights: Record<string, number> = {};

  for (const op of operations) {
    const opAttempts = recentAttempts.filter(a => a.operation === op);
    if (opAttempts.length === 0) {
      weights[op] = 1.5;
      continue;
    }

    let weightedAccuracy = 0;
    let weightedLatency = 0;
    let totalWeight = 0;

    opAttempts.slice(-30).forEach((a, i, arr) => {
      const recency = Math.exp(i / arr.length);
      weightedAccuracy += (a.isCorrect ? 1 : 0) * recency;
      const normalized = Math.min(1, a.latencyMs / LATENCY_THRESHOLDS[op]);
      weightedLatency += normalized * recency;
      totalWeight += recency;
    });

    const accScore = 1 - (weightedAccuracy / totalWeight);
    const latScore = weightedLatency / totalWeight;
    const weakness = accScore * 0.6 + latScore * 0.4;

    weights[op] = 0.5 + weakness * 1.5;
  }

  return weights;
}

export function computeWeaknessScores(attempts: Attempt[]): PatternScore[] {
  const operations: Operation[] = ['add', 'sub', 'mul', 'div'];
  const scores: PatternScore[] = [];

  for (const op of operations) {
    const opAttempts = attempts.filter(a => a.operation === op);
    if (opAttempts.length < 5) continue;

    const accuracy = opAttempts.filter(a => a.isCorrect).length / opAttempts.length;
    const latencies = opAttempts.map(a => a.latencyMs).sort((a, b) => a - b);
    const p75 = latencies[Math.floor(latencies.length * 0.75)];
    const threshold = LATENCY_THRESHOLDS[op];

    const accuracyScore = 1 - accuracy;
    const latencyScore = Math.min(1, p75 / threshold);
    const recencyWeight = Math.min(1, opAttempts.length / 50);
    const weaknessScore = accuracyScore * 0.6 + latencyScore * 0.4;

    scores.push({ operation: op, accuracyScore, latencyScore, recencyWeight, weaknessScore });
  }

  return scores.sort((a, b) => b.weaknessScore - a.weaknessScore);
}
