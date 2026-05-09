import {
    getAutomaticityAnalysis,
    getConsistencyScore,
    getDailyTrends,
    getErrorPatterns,
    getFatigueAnalysis,
    getHesitationPatterns,
    getMulHeatmap,
    getOperationHeatmap,
    getOverview,
    getRecoveryAnalysis,
    getSessionTrends,
    getSettingsGroupedTrends,
    getSwitchingCost,
} from '@/lib/analytics';
import { NextRequest, NextResponse } from 'next/server';

const USER_ID = 'default';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type');
  const startDate = req.nextUrl.searchParams.get('startDate');
  const endDate = req.nextUrl.searchParams.get('endDate');
  const operation = req.nextUrl.searchParams.get('operation');

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

    if (type === 'settings') {
      const data = await getSettingsGroupedTrends(USER_ID);
      return NextResponse.json({ data });
    }

    if (type === 'operation' && operation) {
      const data = await getOperationHeatmap(USER_ID, operation);
      return NextResponse.json({ data });
    }

    if (type === 'heatmap') {
      const data = await getMulHeatmap(USER_ID);
      return NextResponse.json({ data });
    }

    if (type === 'automaticity') {
      const data = await getAutomaticityAnalysis(USER_ID);
      return NextResponse.json({ data });
    }

    if (type === 'hesitation') {
      const data = await getHesitationPatterns(USER_ID);
      return NextResponse.json({ data });
    }

    if (type === 'consistency') {
      const data = await getConsistencyScore(USER_ID);
      return NextResponse.json({ data });
    }

    if (type === 'fatigue') {
      const data = await getFatigueAnalysis(USER_ID);
      return NextResponse.json({ data });
    }

    if (type === 'errors') {
      const data = await getErrorPatterns(USER_ID);
      return NextResponse.json({ data });
    }

    if (type === 'recovery') {
      const data = await getRecoveryAnalysis(USER_ID);
      return NextResponse.json({ data });
    }

    if (type === 'switching') {
      const data = await getSwitchingCost(USER_ID);
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
