import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { mode, config } = await req.json();
  const userId = 'default';

  let user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) user = await prisma.user.create({ data: { id: userId } });

  const session = await prisma.session.create({
    data: { userId, mode, config: JSON.stringify(config) },
  });

  return NextResponse.json({ sessionId: session.id });
}

export async function PATCH(req: NextRequest) {
  const { sessionId, score, endedAt } = await req.json();
  await prisma.session.update({
    where: { id: sessionId },
    data: { score, endedAt: new Date(endedAt) },
  });
  return NextResponse.json({ ok: true });
}
