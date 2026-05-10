import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '7');
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Get total database info
  const totalSessions = await prisma.session.count();
  const totalAttempts = await prisma.attempt.count();
  
  // Calculate space to be freed
  const oldSessions = await prisma.session.findMany({
    where: {
      startedAt: { lt: cutoffDate },
    },
    select: { id: true },
  });
  
  const sessionIds = oldSessions.map(s => s.id);
  
  const oldAttempts = await prisma.attempt.findMany({
    where: {
      sessionId: { in: sessionIds },
    },
  });
  
  // Estimate size (each attempt ~0.5KB, each session ~0.1KB)
  const estimatedSizeKB = (oldAttempts.length * 0.5) + (oldSessions.length * 0.1);
  const totalSizeKB = (totalAttempts * 0.5) + (totalSessions * 0.1);
  
  // Format size appropriately
  const formatSize = (kb: number) => {
    if (kb < 1) return `${kb.toFixed(2)} KB`;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };
  
  return NextResponse.json({
    totalSessions,
    totalAttempts,
    totalSize: formatSize(totalSizeKB),
    sessionsToDelete: oldSessions.length,
    attemptsToDelete: oldAttempts.length,
    spaceToFree: formatSize(estimatedSizeKB),
    cutoffDate: cutoffDate.toISOString(),
    currentOldestSession: totalSessions > 0 ? (
      await prisma.session.findFirst({ orderBy: { startedAt: 'asc' }, select: { startedAt: true } })
    )?.startedAt?.toISOString() : null,
  });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '7');
  const clearAll = searchParams.get('clearAll') === 'true';
  
  if (clearAll) {
    // Delete all data
    const deletedAttempts = await prisma.attempt.deleteMany({});
    const deletedSessions = await prisma.session.deleteMany({});
    
    return NextResponse.json({
      deletedSessions: deletedSessions.count,
      deletedAttempts: deletedAttempts.count,
      clearedAll: true,
    });
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Delete old attempts first (foreign key constraint)
  const deletedAttempts = await prisma.attempt.deleteMany({
    where: {
      session: {
        startedAt: { lt: cutoffDate },
      },
    },
  });
  
  // Delete old sessions
  const deletedSessions = await prisma.session.deleteMany({
    where: {
      startedAt: { lt: cutoffDate },
    },
  });
  
  return NextResponse.json({
    deletedSessions: deletedSessions.count,
    deletedAttempts: deletedAttempts.count,
    cutoffDate: cutoffDate.toISOString(),
  });
}
