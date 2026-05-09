import { PrismaClient } from '@prisma/client';
import { HeatmapCell, AnalyticsOverview } from '@/types';

const prisma = new PrismaClient();

export async function getOverview(userId: string): Promise<AnalyticsOverview> {
  const attempts = await prisma.attempt.findMany({
    where: { session: { userId } },
    select: {
      isCorrect: true,
      latencyMs: true,
      timestamp: true,
    },
    orderBy: { timestamp: 'asc' },
  });

  if (attempts.length === 0) {
    return {
      totalAttempts: 0, accuracy: 0, avgLatencyMs: 0,
      medianLatencyMs: 0, bestScore: 0, questionsPerMinute: 0,
      currentStreak: 0, longestStreak: 0,
    };
  }

  const correct = attempts.filter(a => a.isCorrect);
  const latencies = attempts.map(a => a.latencyMs).sort((a, b) => a - b);
  const avgLatencyMs = latencies.reduce((s, l) => s + l, 0) / latencies.length;
  const medianLatencyMs = latencies[Math.floor(latencies.length / 2)];

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].isCorrect) {
      streak++;
      if (i === attempts.length - 1 || currentStreak > 0) currentStreak = streak;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      if (i === attempts.length - 1) currentStreak = 0;
      streak = 0;
    }
  }

  const bestSession = await prisma.session.findFirst({
    where: { userId },
    orderBy: { score: 'desc' },
    select: { score: true },
  });

  return {
    totalAttempts: attempts.length,
    accuracy: correct.length / attempts.length,
    avgLatencyMs,
    medianLatencyMs,
    bestScore: bestSession?.score ?? 0,
    questionsPerMinute: 60000 / avgLatencyMs,
    currentStreak,
    longestStreak,
  };
}

export async function getMulHeatmap(userId: string): Promise<HeatmapCell[]> {
  const mulAttempts = await prisma.attempt.findMany({
    where: { session: { userId }, operation: 'mul' },
    select: { lhs: true, rhs: true, isCorrect: true, latencyMs: true },
  });

  const cells: HeatmapCell[] = [];
  for (let a = 1; a <= 12; a++) {
    for (let b = 1; b <= 12; b++) {
      const relevant = mulAttempts.filter(
        at => (at.lhs === a && at.rhs === b) || (at.lhs === b && at.rhs === a)
      );
      if (relevant.length === 0) {
        cells.push({ a, b, avgLatency: null, accuracy: null, count: 0 });
      } else {
        const avgLatency = relevant.reduce((s, at) => s + at.latencyMs, 0) / relevant.length;
        const accuracy = relevant.filter(at => at.isCorrect).length / relevant.length;
        cells.push({ a, b, avgLatency, accuracy, count: relevant.length });
      }
    }
  }
  return cells;
}

export async function getDailyTrends(userId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { session: { userId } },
    select: { isCorrect: true, latencyMs: true, timestamp: true },
    orderBy: { timestamp: 'asc' },
    take: 5000,
  });

  const byDay = new Map<string, { correct: number; total: number; latencies: number[] }>();
  for (const a of attempts) {
    const day = new Date(a.timestamp).toISOString().slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, { correct: 0, total: 0, latencies: [] });
    const d = byDay.get(day)!;
    d.total++;
    if (a.isCorrect) d.correct++;
    d.latencies.push(a.latencyMs);
  }

  return Array.from(byDay.entries()).map(([date, d]) => ({
    date,
    score: d.correct,
    accuracy: d.correct / d.total,
    avgLatency: d.latencies.reduce((s, l) => s + l, 0) / d.latencies.length,
  }));
}
