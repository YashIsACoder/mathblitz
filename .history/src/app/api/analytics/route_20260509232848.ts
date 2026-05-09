import { getDailyTrends, getMulHeatmap, getOverview, getSessionTrends } from '@/lib/analytics';
import { NextRequest, NextResponse } from 'next/server';

const USER_ID = 'default';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type');
  const startDate = req.nextUrl.searchParams.get('startDate');
  const endDate = req.nextUrl.searchParams.get('endDate');

  try {
    if (type === 'overview') {
      const [overview, dailyTrends] = await Promise.all([
        getOverview(USER_ID),
        getDailyTrends(USER_ID),
      ]);
      return NextResponse.json({ data: overview, dailyTrends });
    }

    if (type === 'sessions') {
      const data = await getSessionTrends(
        USER_ID,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      return NextResponse.json({ data });
    }

    if (type === 'heatmap') {
      const data = await getMulHeatmap(USER_ID);
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
