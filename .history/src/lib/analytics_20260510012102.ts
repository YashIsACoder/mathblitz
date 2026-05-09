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
