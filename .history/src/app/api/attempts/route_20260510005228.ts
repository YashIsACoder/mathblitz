import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { attempts, sessionId } = await req.json();
  if (!attempts?.length || !sessionId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await prisma.attempt.createMany({
    data: attempts.map((a: any) => ({
      sessionId,
      lhs: a.lhs,
      rhs: a.rhs,
      operation: a.operation,
      correctAnswer: a.correctAnswer,
      typedAnswer: a.typedAnswer,
      isCorrect: a.isCorrect,
      latencyMs: a.latencyMs,
      timestamp: new Date(a.timestamp),
      metadata: JSON.stringify(a.metadata),
    })),
  });

  return NextResponse.json({ ok: true });
}
