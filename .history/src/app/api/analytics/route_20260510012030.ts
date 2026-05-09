import {
    getAutomaticityAnalysis,
    getDailyTrends,
    getMulHeatmap,
    getOperationHeatmap,
    getOverview,
    getSettingsGroupedTrends
} from '@/lib/analytics';
import { NextRequest, NextResponse } from 'next/server';

const USER_ID = 'default';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type');
  const operation = req.nextUrl.searchParams.get('operation');
  const startDate = req.nextUrl.searchParams.get('startDate');
  const endDate = req.nextUrl.searchParams.get('endDate');

  try {
    if (type === 'overview') {
      const [overview, dailyTrends] = await Promise.all([
        getOverview(USER_ID, startDate, endDate),
        getDailyTrends(USER_ID, startDate, endDate),
      ]);
      return NextResponse.json({ data: overview, dailyTrends });
    }

    if (type === 'heatmap') {
      const data = await getMulHeatmap(USER_ID, startDate, endDate);
      return NextResponse.json({ data });
    }

    if (type === 'settings') {
      const data = await getSettingsGroupedTrends(USER_ID, startDate, endDate);
      return NextResponse.json({ data });
    }

    if (type === 'operation' && operation) {
      const data = await getOperationHeatmap(USER_ID, operation, startDate, endDate);
      return NextResponse.json({ data });
    }

    if (type === 'automaticity') {
      const data = await getAutomaticityAnalysis(USER_ID, startDate, endDate);
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
