import { NextRequest, NextResponse } from 'next/server';
import { getOverview, getMulHeatmap, getDailyTrends } from '@/lib/analytics';

const USER_ID = 'default';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type');

  try {
    if (type === 'overview') {
      const [overview, dailyTrends] = await Promise.all([
        getOverview(USER_ID),
        getDailyTrends(USER_ID),
      ]);
      return NextResponse.json({ data: overview, dailyTrends });
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
