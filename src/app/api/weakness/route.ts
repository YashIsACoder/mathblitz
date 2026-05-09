import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectWeaknesses } from '@/lib/weakness';

const USER_ID = 'default';

export async function GET() {
  const attempts = await prisma.attempt.findMany({
    where: { session: { userId: USER_ID } },
    select: {
      lhs: true, rhs: true, operation: true,
      correctAnswer: true, typedAnswer: true,
      isCorrect: true, latencyMs: true,
      timestamp: true, metadata: true, sessionId: true,
    },
    orderBy: { timestamp: 'desc' },
    take: 1000,
  });

  const parsed = attempts.map(a => ({
    ...a,
    metadata: typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata,
    questionId: '',
  }));

  const insights = detectWeaknesses(parsed as any);
  return NextResponse.json({ insights });
}
