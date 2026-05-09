import { AnalyticsOverview, HeatmapCell } from '@/types';
import { PrismaClient } from '@prisma/client';

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
  for (let a = 1; a <= 100; a++) {
    for (let b = 1; b <= 100; b++) {
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
  const sessions = await prisma.session.findMany({
    where: { userId },
    include: {
      attempts: {
        select: { isCorrect: true, latencyMs: true },
      },
    },
    orderBy: { startedAt: 'asc' },
    take: 100,
  });

  return sessions.map(session => {
    const correct = session.attempts.filter(a => a.isCorrect).length;
    const total = session.attempts.length;
    const avgLatency = total > 0 
      ? session.attempts.reduce((s, a) => s + a.latencyMs, 0) / total 
      : 0;

    return {
      id: session.id,
      timestamp: session.startedAt.toISOString(),
      score: session.score,
      accuracy: total > 0 ? correct / total : 0,
      avgLatency,
      mode: session.mode,
      duration: session.endedAt 
        ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
        : null,
    };
  });
}

export async function getSessionTrends(userId: string, startDate?: Date, endDate?: Date) {
  const sessions = await prisma.session.findMany({
    where: { 
      userId,
      ...(startDate && { startedAt: { gte: startDate } }),
      ...(endDate && { startedAt: { lte: endDate } }),
    },
    include: {
      attempts: {
        select: { isCorrect: true, latencyMs: true },
      },
    },
    orderBy: { startedAt: 'asc' },
  });

  return sessions.map(session => {
    const correct = session.attempts.filter(a => a.isCorrect).length;
    const total = session.attempts.length;
    const avgLatency = total > 0 
      ? session.attempts.reduce((s, a) => s + a.latencyMs, 0) / total 
      : 0;

    return {
      id: session.id,
      timestamp: session.startedAt.toISOString(),
      score: session.score,
      accuracy: total > 0 ? correct / total : 0,
      avgLatency,
      mode: session.mode,
      duration: session.endedAt 
        ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
        : null,
    };
  });
}
