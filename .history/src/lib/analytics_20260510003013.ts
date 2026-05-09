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
      config: session.config,
    };
  });
}

export async function getOperationHeatmap(userId: string, operation: string): Promise<HeatmapCell[]> {
  const attempts = await prisma.attempt.findMany({
    where: { session: { userId }, operation },
    select: { lhs: true, rhs: true, isCorrect: true, latencyMs: true },
  });

  const cells: HeatmapCell[] = [];
  for (let a = 1; a <= 12; a++) {
    for (let b = 1; b <= 12; b++) {
      const relevant = attempts.filter(
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

export async function getSettingsGroupedTrends(userId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId },
    include: {
      attempts: {
        select: { isCorrect: true, latencyMs: true },
      },
    },
    orderBy: { startedAt: 'asc' },
  });

  const grouped = new Map<string, any[]>();
  
  for (const session of sessions) {
    const config = JSON.parse(session.config);
    const key = `${config.mode}_${config.durationSeconds}s_${config.operations.join(',')}_${config.minValue}-${config.maxValue}`;
    
    if (!grouped.has(key)) grouped.set(key, []);
    
    const correct = session.attempts.filter(a => a.isCorrect).length;
    const total = session.attempts.length;
    const avgLatency = total > 0 
      ? session.attempts.reduce((s, a) => s + a.latencyMs, 0) / total 
      : 0;

    grouped.get(key)!.push({
      timestamp: session.startedAt.toISOString(),
      score: session.score,
      accuracy: total > 0 ? correct / total : 0,
      avgLatency,
      config,
    });
  }

  return Array.from(grouped.entries()).map(([key, sessions]) => ({
    key,
    sessions,
    config: sessions[0]?.config,
  }));
}

// Automaticity Analysis
export async function getAutomaticityAnalysis(userId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { session: { userId } },
    select: { latencyMs: true, operation: true, isCorrect: true },
  });

  const categories = {
    automatic: 0,
    comfortable: 0,
    computed: 0,
    struggled: 0,
  };

  const byOperation: Record<string, typeof categories> = {};

  for (const attempt of attempts) {
    if (!attempt.isCorrect) continue;

    if (!byOperation[attempt.operation]) {
      byOperation[attempt.operation] = { automatic: 0, comfortable: 0, computed: 0, struggled: 0 };
    }

    if (attempt.latencyMs < 700) {
      categories.automatic++;
      byOperation[attempt.operation].automatic++;
    } else if (attempt.latencyMs < 1400) {
      categories.comfortable++;
      byOperation[attempt.operation].comfortable++;
    } else if (attempt.latencyMs < 3000) {
      categories.computed++;
      byOperation[attempt.operation].computed++;
    } else {
      categories.struggled++;
      byOperation[attempt.operation].struggled++;
    }
  }

  const total = attempts.filter(a => a.isCorrect).length;

  return {
    overall: {
      automatic: (categories.automatic / total) * 100,
      comfortable: (categories.comfortable / total) * 100,
      computed: (categories.computed / total) * 100,
      struggled: (categories.struggled / total) * 100,
    },
    byOperation: Object.fromEntries(
      Object.entries(byOperation).map(([op, cats]) => {
        const opTotal = cats.automatic + cats.comfortable + cats.computed + cats.struggled;
        return [op, {
          automatic: (cats.automatic / opTotal) * 100,
          comfortable: (cats.comfortable / opTotal) * 100,
          computed: (cats.computed / opTotal) * 100,
          struggled: (cats.struggled / opTotal) * 100,
        }];
      })
    ),
  };
}

// Hesitation Detection
export async function getHesitationPatterns(userId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { session: { userId } },
    select: { 
      latencyMs: true, 
      operation: true, 
      lhs: true, 
      rhs: true, 
      metadata: true,
    },
  });

  const tagLatencies: Record<string, number[]> = {};
  const globalLatencies = attempts.map(a => a.latencyMs);
  const globalAvg = globalLatencies.reduce((s, l) => s + l, 0) / globalLatencies.length;

  for (const attempt of attempts) {
    const metadata = JSON.parse(attempt.metadata || '{}');
    const tags = metadata.cognitiveTags || [];
    const carryCount = metadata.carryCount || 0;
    const borrowCount = metadata.borrowCount || 0;

    for (const tag of tags) {
      if (!tagLatencies[tag]) tagLatencies[tag] = [];
      tagLatencies[tag].push(attempt.latencyMs);
    }

    // Add operation-specific tags
    if (attempt.operation === 'mul' && (attempt.lhs === 7 || attempt.rhs === 7)) {
      if (!tagLatencies['multiplication_by_7']) tagLatencies['multiplication_by_7'] = [];
      tagLatencies['multiplication_by_7'].push(attempt.latencyMs);
    }
    if (carryCount > 0 && attempt.operation === 'add') {
      if (!tagLatencies['carry_heavy_addition']) tagLatencies['carry_heavy_addition'] = [];
      tagLatencies['carry_heavy_addition'].push(attempt.latencyMs);
    }
    if (borrowCount > 0 && attempt.operation === 'sub') {
      if (!tagLatencies['borrow_heavy_subtraction']) tagLatencies['borrow_heavy_subtraction'] = [];
      tagLatencies['borrow_heavy_subtraction'].push(attempt.latencyMs);
    }
  }

  const hesitations = Object.entries(tagLatencies)
    .map(([tag, latencies]) => ({
      tag,
      avgLatency: latencies.reduce((s, l) => s + l, 0) / latencies.length,
      count: latencies.length,
      ratio: (latencies.reduce((s, l) => s + l, 0) / latencies.length) / globalAvg,
    }))
    .filter(h => h.ratio > 1.2 && h.count >= 3)
    .sort((a, b) => b.ratio - a.ratio);

  return hesitations;
}

// Consistency Score
export async function getConsistencyScore(userId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { session: { userId } },
    select: { latencyMs: true, operation: true },
  });

  const latencies = attempts.map(a => a.latencyMs);
  const mean = latencies.reduce((s, l) => s + l, 0) / latencies.length;
  const variance = latencies.reduce((s, l) => s + Math.pow(l - mean, 2), 0) / latencies.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  const byOperation: Record<string, { cv: number; mean: number; stdDev: number }> = {};
  const opGroups: Record<string, number[]> = {};

  for (const attempt of attempts) {
    if (!opGroups[attempt.operation]) opGroups[attempt.operation] = [];
    opGroups[attempt.operation].push(attempt.latencyMs);
  }

  for (const [op, opLatencies] of Object.entries(opGroups)) {
    const opMean = opLatencies.reduce((s, l) => s + l, 0) / opLatencies.length;
    const opVariance = opLatencies.reduce((s, l) => s + Math.pow(l - opMean, 2), 0) / opLatencies.length;
    const opStdDev = Math.sqrt(opVariance);
    const opCv = opMean > 0 ? (opStdDev / opMean) * 100 : 0;
    byOperation[op] = { cv: opCv, mean: opMean, stdDev: opStdDev };
  }

  return {
    overall: { cv, mean, stdDev },
    byOperation,
  };
}

// Fatigue Analysis
export async function getFatigueAnalysis(userId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId, endedAt: { not: null } },
    include: {
      attempts: {
        orderBy: { timestamp: 'asc' },
        select: { latencyMs: true, isCorrect: true, timestamp: true },
      },
    },
  });

  const trends: Array<{ sessionDuration: number; latencyTrend: number; accuracyTrend: number }> = [];

  for (const session of sessions) {
    if (session.attempts.length < 10) continue;

    const duration = session.endedAt ? session.endedAt.getTime() - session.startedAt.getTime() : 0;
    const sessionElapsed = session.attempts.map(a => a.timestamp.getTime() - session.startedAt.getTime());
    const latencies = session.attempts.map(a => a.latencyMs);
    const accuracies = session.attempts.map((a, i) => {
      const recent = session.attempts.slice(Math.max(0, i - 5), i + 1);
      return recent.filter(r => r.isCorrect).length / recent.length;
    });

    // Simple linear regression for trend
    const n = latencies.length;
    const sumX = sessionElapsed.reduce((s, x) => s + x, 0);
    const sumY = latencies.reduce((s, y) => s + y, 0);
    const sumXY = sessionElapsed.reduce((s, x, i) => s + x * latencies[i], 0);
    const sumX2 = sessionElapsed.reduce((s, x) => s + x * x, 0);
    const latencyTrend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    const sumY2 = accuracies.reduce((s, y) => s + y, 0);
    const sumXY2 = sessionElapsed.reduce((s, x, i) => s + x * accuracies[i], 0);
    const accuracyTrend = (n * sumXY2 - sumX * sumY2) / (n * sumX2 - sumX * sumX);

    trends.push({
      sessionDuration: duration / 1000,
      latencyTrend,
      accuracyTrend,
    });
  }

  const avgLatencyTrend = trends.reduce((s, t) => s + t.latencyTrend, 0) / trends.length;
  const avgAccuracyTrend = trends.reduce((s, t) => s + t.accuracyTrend, 0) / trends.length;

  return {
    averageLatencyTrend: avgLatencyTrend,
    averageAccuracyTrend: avgAccuracyTrend,
    insights: trends.filter(t => t.latencyTrend > 0.5).length > trends.length * 0.3
      ? 'Performance declines significantly during long sessions'
      : 'Performance remains stable during sessions',
  };
}

// Error Pattern Analysis
export async function getErrorPatterns(userId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { session: { userId }, isCorrect: false },
    select: {
      operation: true,
      cognitiveTags: true,
      carryCount: true,
      borrowCount: true,
    },
  });

  const byOperation: Record<string, number> = {};
  const byTag: Record<string, number> = {};
  const byCarry: Record<string, number> = { withCarry: 0, withoutCarry: 0 };
  const byBorrow: Record<string, number> = { withBorrow: 0, withoutBorrow: 0 };

  for (const attempt of attempts) {
    byOperation[attempt.operation] = (byOperation[attempt.operation] || 0) + 1;

    const tags = JSON.parse(attempt.cognitiveTags || '[]');
    for (const tag of tags) {
      byTag[tag] = (byTag[tag] || 0) + 1;
    }

    if (attempt.carryCount > 0) byCarry.withCarry++;
    else byCarry.withoutCarry++;

    if (attempt.borrowCount > 0) byBorrow.withBorrow++;
    else byBorrow.withoutBorrow++;
  }

  const total = attempts.length;

  const errorRates = Object.entries(byOperation).map(([op, count]) => ({
    operation: op,
    errorRate: count / total,
    count,
  })).sort((a, b) => b.errorRate - a.errorRate);

  const tagErrorRates = Object.entries(byTag).map(([tag, count]) => ({
    tag,
    errorRate: count / total,
    count,
  })).filter(t => t.count >= 3).sort((a, b) => b.errorRate - a.errorRate);

  return {
    byOperation: errorRates,
    byTag: tagErrorRates,
    carryImpact: total > 0 ? byCarry.withCarry / (byCarry.withCarry + byCarry.withoutCarry) : 0,
    borrowImpact: total > 0 ? byBorrow.withBorrow / (byBorrow.withBorrow + byBorrow.withoutBorrow) : 0,
  };
}

// Recovery After Error
export async function getRecoveryAnalysis(userId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId },
    include: {
      attempts: {
        orderBy: { timestamp: 'asc' },
        select: { latencyMs: true, isCorrect: true },
      },
    },
  });

  const afterErrorLatencies: number[] = [];
  let afterErrorErrors = 0;
  let totalAfterError = 0;

  for (const session of sessions) {
    const attempts = session.attempts;
    for (let i = 1; i < attempts.length; i++) {
      if (!attempts[i - 1].isCorrect) {
        afterErrorLatencies.push(attempts[i].latencyMs);
        if (!attempts[i].isCorrect) afterErrorErrors++;
        totalAfterError++;
      }
    }
  }

  const avgLatencyAfterError = afterErrorLatencies.reduce((s, l) => s + l, 0) / afterErrorLatencies.length;
  const errorRateAfterError = totalAfterError > 0 ? afterErrorErrors / totalAfterError : 0;

  const allLatencies = sessions.flatMap(s => s.attempts.map(a => a.latencyMs));
  const allErrors = sessions.flatMap(s => s.attempts.map(a => a.isCorrect)).filter(c => !c).length;
  const allAttempts = sessions.flatMap(s => s.attempts);
  const globalAvgLatency = allLatencies.reduce((s, l) => s + l, 0) / allLatencies.length;
  const globalErrorRate = allErrors / allAttempts.length;

  return {
    avgLatencyAfterError,
    errorRateAfterError,
    globalAvgLatency,
    globalErrorRate,
    latencyIncrease: ((avgLatencyAfterError - globalAvgLatency) / globalAvgLatency) * 100,
    errorIncrease: ((errorRateAfterError - globalErrorRate) / globalErrorRate) * 100,
    recoveryScore: 100 - errorRateAfterError * 100,
  };
}

// Operation Switching Cost
export async function getSwitchingCost(userId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId },
    include: {
      attempts: {
        orderBy: { timestamp: 'asc' },
        select: { latencyMs: true, operation: true },
      },
    },
  });

  const sameOpLatencies: number[] = [];
  const switchLatencies: Record<string, number[]> = {};

  for (const session of sessions) {
    const attempts = session.attempts;
    for (let i = 1; i < attempts.length; i++) {
      const prev = attempts[i - 1];
      const curr = attempts[i];

      if (prev.operation === curr.operation) {
        sameOpLatencies.push(curr.latencyMs);
      } else {
        const key = `${prev.operation}_${curr.operation}`;
        if (!switchLatencies[key]) switchLatencies[key] = [];
        switchLatencies[key].push(curr.latencyMs);
      }
    }
  }

  const avgSameOp = sameOpLatencies.reduce((s, l) => s + l, 0) / sameOpLatencies.length;

  const switchingCosts = Object.entries(switchLatencies).map(([key, latencies]) => ({
    from: key.split('_')[0],
    to: key.split('_')[1],
    avgLatency: latencies.reduce((s, l) => s + l, 0) / latencies.length,
    count: latencies.length,
    cost: ((latencies.reduce((s, l) => s + l, 0) / latencies.length - avgSameOp) / avgSameOp) * 100,
  })).filter(s => s.count >= 3).sort((a, b) => b.cost - a.cost);

  return {
    avgSameOp,
    switchingCosts,
    avgSwitchingCost: switchingCosts.length > 0 
      ? switchingCosts.reduce((s, c) => s + c.cost, 0) / switchingCosts.length 
      : 0,
  };
}
