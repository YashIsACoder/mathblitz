import { AnalyticsOverview, HeatmapCell } from '@/types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getOverview(userId: string, startDate?: string | null, endDate?: string | null): Promise<AnalyticsOverview> {
  const where: any = { session: { userId } };
  
  if (startDate || endDate) {
    where.session.startedAt = {};
    if (startDate) {
      where.session.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.session.startedAt.lte = new Date(endDate);
    }
  }
  
  const attempts = await prisma.attempt.findMany({
    where,
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

export async function getMulHeatmap(userId: string, startDate?: string | null, endDate?: string | null): Promise<HeatmapCell[]> {
  const where: any = { session: { userId }, operation: 'mul' };
  
  if (startDate || endDate) {
    where.session.startedAt = {};
    if (startDate) {
      where.session.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.session.startedAt.lte = new Date(endDate);
    }
  }
  
  const mulAttempts = await prisma.attempt.findMany({
    where,
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

export async function getDailyTrends(userId: string, startDate?: string | null, endDate?: string | null) {
  const where: any = { userId };
  
  if (startDate || endDate) {
    where.startedAt = {};
    if (startDate) {
      where.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.startedAt.lte = new Date(endDate);
    }
  }
  
  const sessions = await prisma.session.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: 30,
  });

  return sessions.map(s => ({
    date: s.startedAt.toISOString().split('T')[0],
    score: s.score,
    accuracy: s.score / 10, // rough estimate
  }));
}

export async function getSettingsGroupedTrends(userId: string, startDate?: string | null, endDate?: string | null) {
  const where: any = { userId };
  
  if (startDate || endDate) {
    where.startedAt = {};
    if (startDate) {
      where.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.startedAt.lte = new Date(endDate);
    }
  }
  
  const sessions = await prisma.session.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: 50,
  });

  const groups: Record<string, any[]> = {};
  const configs: Record<string, any> = {};

  for (const session of sessions) {
    const config = JSON.parse(session.config);
    const key = `${config.mode}-${config.operations.join('-')}-${config.minValue}-${config.maxValue}`;
    
    if (!groups[key]) {
      groups[key] = [];
      configs[key] = config;
    }
    
    const attempts = await prisma.attempt.findMany({
      where: { sessionId: session.id },
      select: { isCorrect: true, latencyMs: true },
    });
    
    const correct = attempts.filter(a => a.isCorrect).length;
    const avgLatency = attempts.length > 0 
      ? attempts.reduce((sum, a) => sum + a.latencyMs, 0) / attempts.length 
      : 0;

    groups[key].push({
      timestamp: session.startedAt,
      score: session.score,
      accuracy: attempts.length > 0 ? correct / attempts.length : 0,
      avgLatency,
    });
  }

  return Object.entries(groups).map(([key, sessions]) => ({
    key,
    sessions,
    config: configs[key],
  }));
}

export async function getAutomaticityAnalysis(userId: string, startDate?: string | null, endDate?: string | null) {
  const where: any = { session: { userId } };
  
  if (startDate || endDate) {
    where.session.startedAt = {};
    if (startDate) {
      where.session.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.session.startedAt.lte = new Date(endDate);
    }
  }
  
  const attempts = await prisma.attempt.findMany({
    where,
    select: {
      latencyMs: true,
      operation: true,
    },
  });

  const categories = {
    automatic: attempts.filter(a => a.latencyMs < 700).length,
    comfortable: attempts.filter(a => a.latencyMs >= 700 && a.latencyMs < 1400).length,
    computed: attempts.filter(a => a.latencyMs >= 1400 && a.latencyMs < 3000).length,
    struggled: attempts.filter(a => a.latencyMs >= 3000).length,
  };

  const total = attempts.length;
  const percentages = {
    automatic: total > 0 ? (categories.automatic / total) * 100 : 0,
    comfortable: total > 0 ? (categories.comfortable / total) * 100 : 0,
    computed: total > 0 ? (categories.computed / total) * 100 : 0,
    struggled: total > 0 ? (categories.struggled / total) * 100 : 0,
  };

  const byOperation: Record<string, any> = {};
  ['add', 'sub', 'mul', 'div'].forEach(op => {
    const opAttempts = attempts.filter(a => a.operation === op);
    const opTotal = opAttempts.length;
    if (opTotal > 0) {
      byOperation[op] = {
        automatic: (opAttempts.filter(a => a.latencyMs < 700).length / opTotal) * 100,
        comfortable: (opAttempts.filter(a => a.latencyMs >= 700 && a.latencyMs < 1400).length / opTotal) * 100,
        computed: (opAttempts.filter(a => a.latencyMs >= 1400 && a.latencyMs < 3000).length / opTotal) * 100,
        struggled: (opAttempts.filter(a => a.latencyMs >= 3000).length / opTotal) * 100,
        total: opTotal,
      };
    }
  });

  return {
    categories,
    percentages,
    byOperation,
    total,
  };
}

export async function getHesitationDetection(userId: string, startDate?: string | null, endDate?: string | null) {
  const where: any = { session: { userId } };
  
  if (startDate || endDate) {
    where.session.startedAt = {};
    if (startDate) {
      where.session.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.session.startedAt.lte = new Date(endDate);
    }
  }
  
  const attempts = await prisma.attempt.findMany({
    where,
    select: {
      latencyMs: true,
      operation: true,
      metadata: true,
    },
  });

  if (attempts.length === 0) {
    return {
      globalAvgLatency: 0,
      tagAnalysis: [],
      insights: [],
    };
  }

  const globalAvgLatency = attempts.reduce((sum, a) => sum + a.latencyMs, 0) / attempts.length;

  const tagLatencies: Record<string, { total: number; count: number; operations: Set<string> }> = {};

  for (const attempt of attempts) {
    try {
      const metadata = typeof attempt.metadata === 'string' ? JSON.parse(attempt.metadata) : attempt.metadata;
      const tags = metadata.tags || [];
      
      for (const tag of tags) {
        if (!tagLatencies[tag]) {
          tagLatencies[tag] = { total: 0, count: 0, operations: new Set() };
        }
        tagLatencies[tag].total += attempt.latencyMs;
        tagLatencies[tag].count += 1;
        tagLatencies[tag].operations.add(attempt.operation);
      }
    } catch (e) {
      // Skip attempts with invalid metadata
    }
  }

  const tagAnalysis = Object.entries(tagLatencies)
    .map(([tag, data]) => ({
      tag,
      avgLatency: data.total / data.count,
      count: data.count,
      operations: Array.from(data.operations),
      deviation: ((data.total / data.count) - globalAvgLatency) / globalAvgLatency,
    }))
    .filter(t => t.count >= 3) // Only include tags with at least 3 attempts
    .sort((a, b) => b.deviation - a.deviation);

  const insights = tagAnalysis
    .filter(t => t.deviation > 0.3) // Tags that are 30%+ slower than average
    .slice(0, 5)
    .map(t => ({
      pattern: t.tag,
      avgLatency: t.avgLatency,
      deviation: t.deviation,
      operations: t.operations,
      message: `You consistently hesitate on ${t.tag.replace(/_/g, ' ')} (${t.avgLatency.toFixed(0)}ms avg vs ${globalAvgLatency.toFixed(0)}ms global average)`,
    }));

  return {
    globalAvgLatency,
    tagAnalysis,
    insights,
  };
}

export async function getConsistencyScore(userId: string, startDate?: string | null, endDate?: string | null) {
  const where: any = { session: { userId } };
  
  if (startDate || endDate) {
    where.session.startedAt = {};
    if (startDate) {
      where.session.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.session.startedAt.lte = new Date(endDate);
    }
  }
  
  const attempts = await prisma.attempt.findMany({
    where,
    select: {
      latencyMs: true,
      operation: true,
    },
  });

  if (attempts.length === 0) {
    return {
      overallScore: 0,
      overallStdDev: 0,
      overallCV: 0,
      byOperation: {},
    };
  }

  const calculateStdDev = (values: number[]) => {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  };

  const calculateCV = (stdDev: number, mean: number) => {
    return mean > 0 ? (stdDev / mean) * 100 : 0;
  };

  const allLatencies = attempts.map(a => a.latencyMs);
  const overallMean = allLatencies.reduce((sum, v) => sum + v, 0) / allLatencies.length;
  const overallStdDev = calculateStdDev(allLatencies);
  const overallCV = calculateCV(overallStdDev, overallMean);

  // Consistency score: higher is better (inverse of CV, capped at 100)
  const overallScore = Math.max(0, Math.min(100, 100 - overallCV));

  const byOperation: Record<string, { mean: number; stdDev: number; cv: number; score: number; count: number }> = {};
  ['add', 'sub', 'mul', 'div'].forEach(op => {
    const opAttempts = attempts.filter(a => a.operation === op);
    if (opAttempts.length > 0) {
      const opLatencies = opAttempts.map(a => a.latencyMs);
      const opMean = opLatencies.reduce((sum, v) => sum + v, 0) / opLatencies.length;
      const opStdDev = calculateStdDev(opLatencies);
      const opCV = calculateCV(opStdDev, opMean);
      const opScore = Math.max(0, Math.min(100, 100 - opCV));
      
      byOperation[op] = {
        mean: opMean,
        stdDev: opStdDev,
        cv: opCV,
        score: opScore,
        count: opAttempts.length,
      };
    }
  });

  return {
    overallScore,
    overallStdDev,
    overallCV,
    byOperation,
  };
}

export async function getFatigueAnalysis(userId: string, startDate?: string | null, endDate?: string | null) {
  const where: any = { session: { userId } };
  
  if (startDate || endDate) {
    where.session.startedAt = {};
    if (startDate) {
      where.session.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.session.startedAt.lte = new Date(endDate);
    }
  }
  
  const sessions = await prisma.session.findMany({
    where,
    include: {
      attempts: {
        select: {
          latencyMs: true,
          isCorrect: true,
          timestamp: true,
        },
        orderBy: { timestamp: 'asc' },
      },
    },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });

  if (sessions.length === 0) {
    return {
      overallTrend: 'neutral',
      latencyTrend: null,
      accuracyTrend: null,
      bySession: [],
      insights: [],
    };
  }

  const sessionAnalyses = sessions.map(session => {
    const attempts = session.attempts;
    if (attempts.length < 3) return null;

    const duration = session.endedAt 
      ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
      : 0;

    // Split attempts into first half and second half
    const midPoint = Math.floor(attempts.length / 2);
    const firstHalf = attempts.slice(0, midPoint);
    const secondHalf = attempts.slice(midPoint);

    const firstHalfAvgLatency = firstHalf.reduce((sum, a) => sum + a.latencyMs, 0) / firstHalf.length;
    const secondHalfAvgLatency = secondHalf.reduce((sum, a) => sum + a.latencyMs, 0) / secondHalf.length;

    const firstHalfAccuracy = firstHalf.filter(a => a.isCorrect).length / firstHalf.length;
    const secondHalfAccuracy = secondHalf.filter(a => a.isCorrect).length / secondHalf.length;

    const latencyChange = ((secondHalfAvgLatency - firstHalfAvgLatency) / firstHalfAvgLatency) * 100;
    const accuracyChange = ((secondHalfAccuracy - firstHalfAccuracy) / firstHalfAccuracy) * 100;

    return {
      sessionId: session.id,
      duration,
      latencyChange,
      accuracyChange,
      firstHalfAvgLatency,
      secondHalfAvgLatency,
      firstHalfAccuracy,
      secondHalfAccuracy,
    };
  }).filter(Boolean);

  const validAnalyses = sessionAnalyses as any[];
  if (validAnalyses.length === 0) {
    return {
      overallTrend: 'neutral',
      latencyTrend: null,
      accuracyTrend: null,
      bySession: [],
      insights: [],
    };
  }

  const avgLatencyChange = validAnalyses.reduce((sum, s) => sum + s.latencyChange, 0) / validAnalyses.length;
  const avgAccuracyChange = validAnalyses.reduce((sum, s) => sum + s.accuracyChange, 0) / validAnalyses.length;

  let overallTrend = 'neutral';
  if (avgLatencyChange > 10 || avgAccuracyChange < -10) {
    overallTrend = 'declining';
  } else if (avgLatencyChange < -10 || avgAccuracyChange > 10) {
    overallTrend = 'improving';
  }

  const insights: string[] = [];
  if (avgLatencyChange > 15) {
    insights.push(`Your speed declines by ${avgLatencyChange.toFixed(0)}% on average during sessions`);
  }
  if (avgAccuracyChange < -15) {
    insights.push(`Your accuracy drops by ${Math.abs(avgAccuracyChange).toFixed(0)}% on average during sessions`);
  }
  if (validAnalyses.filter(s => s.duration > 60000 && s.latencyChange > 20).length > 0) {
    insights.push('Performance declines significantly in sessions longer than 1 minute');
  }
  if (avgLatencyChange < -5 && avgAccuracyChange > 5) {
    insights.push('You tend to warm up and improve during sessions');
  }
  if (insights.length === 0) {
    insights.push('Your performance remains stable throughout sessions');
  }

  return {
    overallTrend,
    latencyTrend: avgLatencyChange,
    accuracyTrend: avgAccuracyChange,
    bySession: validAnalyses,
    insights,
  };
}

export async function getErrorPatternAnalysis(userId: string, startDate?: string | null, endDate?: string | null) {
  const where: any = { session: { userId }, isCorrect: false };
  
  if (startDate || endDate) {
    where.session.startedAt = {};
    if (startDate) {
      where.session.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.session.startedAt.lte = new Date(endDate);
    }
  }
  
  const mistakes = await prisma.attempt.findMany({
    where,
    select: {
      operation: true,
      metadata: true,
      lhs: true,
      rhs: true,
      latencyMs: true,
    },
  });

  if (mistakes.length === 0) {
    return {
      totalMistakes: 0,
      byOperation: {},
      byTag: {},
      byNumberRange: {},
      insights: [],
    };
  }

  // Group by operation
  const byOperation: Record<string, { count: number; total: number; errorRate: number }> = {};
  ['add', 'sub', 'mul', 'div'].forEach(op => {
    const opMistakes = mistakes.filter(m => m.operation === op);
    byOperation[op] = {
      count: opMistakes.length,
      total: opMistakes.length, // We'll need total attempts for error rate, but for now just count
      errorRate: 0, // Will be calculated if we have total attempts
    };
  });

  // Group by cognitive tag
  const byTag: Record<string, { count: number; avgLatency: number }> = {};
  for (const mistake of mistakes) {
    try {
      const metadata = typeof mistake.metadata === 'string' ? JSON.parse(mistake.metadata) : mistake.metadata;
      const tags = metadata.tags || [];
      
      for (const tag of tags) {
        if (!byTag[tag]) {
          byTag[tag] = { count: 0, avgLatency: 0 };
        }
        byTag[tag].count += 1;
        byTag[tag].avgLatency = (byTag[tag].avgLatency * (byTag[tag].count - 1) + mistake.latencyMs) / byTag[tag].count;
      }
    } catch (e) {
      // Skip attempts with invalid metadata
    }
  }

  // Group by number range (for addition/subtraction)
  const byNumberRange: Record<string, { count: number; avgLatency: number }> = {};
  for (const mistake of mistakes) {
    const range = `${mistake.lhs}-${mistake.rhs}`;
    if (!byNumberRange[range]) {
      byNumberRange[range] = { count: 0, avgLatency: 0 };
    }
    byNumberRange[range].count += 1;
    byNumberRange[range].avgLatency = (byNumberRange[range].avgLatency * (byNumberRange[range].count - 1) + mistake.latencyMs) / byNumberRange[range].count;
  }

  // Generate insights
  const insights: string[] = [];
  const topTags = Object.entries(byTag).sort((a, b) => b[1].count - a[1].count).slice(0, 3);
  if (topTags.length > 0) {
    insights.push(`Most common mistake patterns: ${topTags.map(([tag]) => tag.replace(/_/g, ' ')).join(', ')}`);
  }
  
  const opWithMostErrors = Object.entries(byOperation).sort((a, b) => b[1].count - a[1].count)[0];
  if (opWithMostErrors && opWithMostErrors[1].count > 0) {
    insights.push(`Highest error rate in ${opWithMostErrors[0]} operation`);
  }

  return {
    totalMistakes: mistakes.length,
    byOperation,
    byTag,
    byNumberRange,
    insights,
  };
}

export async function getRecoveryAfterError(userId: string, startDate?: string | null, endDate?: string | null) {
  const where: any = { session: { userId } };
  
  if (startDate || endDate) {
    where.session.startedAt = {};
    if (startDate) {
      where.session.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.session.startedAt.lte = new Date(endDate);
    }
  }
  
  const attempts = await prisma.attempt.findMany({
    where,
    select: {
      isCorrect: true,
      latencyMs: true,
      timestamp: true,
    },
    orderBy: { timestamp: 'asc' },
  });

  if (attempts.length < 2) {
    return {
      avgLatencyAfterError: null,
      avgLatencyAfterCorrect: null,
      errorRateAfterError: null,
      errorRateAfterCorrect: null,
      recoveryScore: null,
      insights: [],
    };
  }

  let latencyAfterErrorSum = 0;
  let latencyAfterErrorCount = 0;
  let latencyAfterCorrectSum = 0;
  let latencyAfterCorrectCount = 0;
  let errorsAfterError = 0;
  let attemptsAfterError = 0;
  let errorsAfterCorrect = 0;
  let attemptsAfterCorrect = 0;

  for (let i = 1; i < attempts.length; i++) {
    const prevAttempt = attempts[i - 1];
    const currentAttempt = attempts[i];

    if (prevAttempt.isCorrect) {
      latencyAfterCorrectSum += currentAttempt.latencyMs;
      latencyAfterCorrectCount++;
      attemptsAfterCorrect++;
      if (!currentAttempt.isCorrect) {
        errorsAfterCorrect++;
      }
    } else {
      latencyAfterErrorSum += currentAttempt.latencyMs;
      latencyAfterErrorCount++;
      attemptsAfterError++;
      if (!currentAttempt.isCorrect) {
        errorsAfterError++;
      }
    }
  }

  const avgLatencyAfterError = latencyAfterErrorCount > 0 ? latencyAfterErrorSum / latencyAfterErrorCount : null;
  const avgLatencyAfterCorrect = latencyAfterCorrectCount > 0 ? latencyAfterCorrectSum / latencyAfterCorrectCount : null;
  const errorRateAfterError = attemptsAfterError > 0 ? errorsAfterError / attemptsAfterError : null;
  const errorRateAfterCorrect = attemptsAfterCorrect > 0 ? errorsAfterCorrect / attemptsAfterCorrect : null;

  // Recovery score: how quickly you recover from errors
  // Higher is better: lower latency and lower error rate after errors
  let recoveryScore = null;
  if (avgLatencyAfterError !== null && avgLatencyAfterCorrect !== null) {
    const latencyRecovery = (avgLatencyAfterCorrect - avgLatencyAfterError) / avgLatencyAfterCorrect;
    if (errorRateAfterError !== null && errorRateAfterCorrect !== null) {
      const errorRecovery = (errorRateAfterCorrect - errorRateAfterError) / (errorRateAfterCorrect || 1);
      recoveryScore = Math.max(0, Math.min(100, 50 + latencyRecovery * 100 + errorRecovery * 50));
    } else {
      recoveryScore = Math.max(0, Math.min(100, 50 + latencyRecovery * 100));
    }
  }

  const insights: string[] = [];
  if (avgLatencyAfterError !== null && avgLatencyAfterCorrect !== null) {
    if (avgLatencyAfterError > avgLatencyAfterCorrect * 1.2) {
      insights.push(`You slow down after mistakes (${avgLatencyAfterError.toFixed(0)}ms vs ${avgLatencyAfterCorrect.toFixed(0)}ms after correct answers)`);
    } else if (avgLatencyAfterError < avgLatencyAfterCorrect * 0.9) {
      insights.push(`You speed up after mistakes (${avgLatencyAfterError.toFixed(0)}ms vs ${avgLatencyAfterCorrect.toFixed(0)}ms after correct answers)`);
    }
  }
  if (errorRateAfterError !== null && errorRateAfterCorrect !== null) {
    if (errorRateAfterError > errorRateAfterCorrect * 1.5) {
      insights.push(`Error cascade: You're more likely to make mistakes after errors (${(errorRateAfterError * 100).toFixed(0)}% vs ${(errorRateAfterCorrect * 100).toFixed(0)}%)`);
    } else if (errorRateAfterError < errorRateAfterCorrect * 0.7) {
      insights.push(`Good recovery: You're less likely to make mistakes after errors (${(errorRateAfterError * 100).toFixed(0)}% vs ${(errorRateAfterCorrect * 100).toFixed(0)}%)`);
    }
  }
  if (recoveryScore !== null) {
    if (recoveryScore > 70) {
      insights.push('Excellent recovery from mistakes');
    } else if (recoveryScore < 40) {
      insights.push('Struggles to recover from mistakes - consider taking breaks after errors');
    }
  }
  if (insights.length === 0) {
    insights.push('Your performance is consistent regardless of previous outcomes');
  }

  return {
    avgLatencyAfterError,
    avgLatencyAfterCorrect,
    errorRateAfterError,
    errorRateAfterCorrect,
    recoveryScore,
    insights,
  };
}

export async function getOperationHeatmap(userId: string, operation: string, startDate?: string | null, endDate?: string | null) {
  const where: any = { 
    session: { userId },
    operation,
  };
  
  if (startDate || endDate) {
    where.session.startedAt = {};
    if (startDate) {
      where.session.startedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.session.startedAt.lte = new Date(endDate);
    }
  }
  
  const attempts = await prisma.attempt.findMany({
    where,
    select: {
      lhs: true,
      rhs: true,
      isCorrect: true,
      latencyMs: true,
    },
  });

  const cells: Record<string, HeatmapCell> = {};

  for (const attempt of attempts) {
    const key = `${attempt.lhs}:${attempt.rhs}`;
    if (!cells[key]) {
      cells[key] = {
        a: attempt.lhs,
        b: attempt.rhs,
        avgLatency: null,
        accuracy: null,
        count: 0,
      };
    }
    
    const cell = cells[key];
    if (cell.avgLatency === null) {
      cell.avgLatency = attempt.latencyMs;
    } else {
      cell.avgLatency = (cell.avgLatency * cell.count + attempt.latencyMs) / (cell.count + 1);
    }
    
    if (cell.accuracy === null) {
      cell.accuracy = attempt.isCorrect ? 1 : 0;
    } else {
      cell.accuracy = (cell.accuracy * cell.count + (attempt.isCorrect ? 1 : 0)) / (cell.count + 1);
    }
    
    cell.count++;
  }

  return Object.values(cells);
}
