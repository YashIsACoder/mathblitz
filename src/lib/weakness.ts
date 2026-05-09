import { Attempt, WeaknessInsight, CognitiveTag } from '@/types';
import { computeWeaknessScores } from '@/engine/adaptiveWeighter';

export function detectWeaknesses(attempts: Attempt[]): WeaknessInsight[] {
  const insights: WeaknessInsight[] = [];

  const opScores = computeWeaknessScores(attempts);
  for (const score of opScores) {
    if (score.weaknessScore < 0.4) continue;

    const opLabel = { add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', div: 'Division' };
    const severity = score.weaknessScore > 0.7 ? 'high' : score.weaknessScore > 0.55 ? 'medium' : 'low';

    insights.push({
      title: `Slow ${opLabel[score.operation]}`,
      description: `Your ${opLabel[score.operation].toLowerCase()} response time is above target, with ${(score.accuracyScore * 100).toFixed(0)}% error rate.`,
      pattern: score.operation,
      severity,
      suggestion: `Practice ${opLabel[score.operation].toLowerCase()} in focused mode. Start with single-digit problems.`,
    });
  }

  const tagGroups = groupByTag(attempts);
  for (const [tag, tagAttempts] of Object.entries(tagGroups)) {
    if (tagAttempts.length < 8) continue;
    const accuracy = tagAttempts.filter(a => a.isCorrect).length / tagAttempts.length;
    const avgLatency = tagAttempts.reduce((s, a) => s + a.latencyMs, 0) / tagAttempts.length;

    if (accuracy < 0.7) {
      insights.push(tagInsight(tag as CognitiveTag, accuracy, avgLatency, 'accuracy'));
    } else if (avgLatency > 6000) {
      insights.push(tagInsight(tag as CognitiveTag, accuracy, avgLatency, 'latency'));
    }
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  return insights
    .filter((v, i, arr) => arr.findIndex(x => x.pattern === v.pattern) === i)
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 6);
}

function groupByTag(attempts: Attempt[]): Record<string, Attempt[]> {
  const groups: Record<string, Attempt[]> = {};
  for (const a of attempts) {
    const meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata as unknown as string) : a.metadata;
    for (const tag of (meta?.tags ?? [])) {
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(a);
    }
  }
  return groups;
}

function tagInsight(
  tag: CognitiveTag,
  accuracy: number,
  avgLatency: number,
  type: 'accuracy' | 'latency'
): WeaknessInsight {
  const tagMeta: Record<CognitiveTag, { title: string; suggestion: string }> = {
    near_power_of_10:    { title: 'Numbers Near 10/100', suggestion: 'Practice complement strategies for numbers near 10 and 100.' },
    repeated_digits:     { title: 'Repeated Digit Numbers', suggestion: 'Focus on 11, 22, 33-type patterns.' },
    multiplication_by_7: { title: '×7 Multiplication', suggestion: 'Drill the 7× table specifically.' },
    multiplication_by_8: { title: '×8 Multiplication', suggestion: 'Drill the 8× table. Try doubling ×4.' },
    multiplication_by_9: { title: '×9 Multiplication', suggestion: 'Use the 9× finger trick or complement method.' },
    carry_heavy:         { title: 'Multi-Carry Addition', suggestion: 'Practice column addition with 2+ carries.' },
    carry_light:         { title: 'Simple Addition', suggestion: 'Speed up zero-carry addition drills.' },
    borrow_heavy:        { title: 'Multi-Borrow Subtraction', suggestion: 'Practice borrowing across zeros.' },
    division_clean:      { title: 'Clean Division', suggestion: 'Memorize multiplication tables to speed division.' },
    complement_to_100:   { title: 'Complements to 100', suggestion: 'Memorize number pairs that sum to 100.' },
    double_digit_both:   { title: '2-Digit × 2-Digit', suggestion: 'Practice breaking: (a+b)(c+d) expansion.' },
    single_digit_both:   { title: 'Single-Digit Speed', suggestion: 'These should be instant — drill for automaticity.' },
    result_negative:     { title: 'Negative Results', suggestion: 'Practice subtraction where the result crosses zero.' },
    result_decimal:      { title: 'Decimal Results', suggestion: 'Practice division with non-integer answers.' },
  };

  const meta = tagMeta[tag] ?? { title: tag, suggestion: 'Practice this pattern.' };
  const severity = (type === 'accuracy' && accuracy < 0.5) || (type === 'latency' && avgLatency > 9000) ? 'high' : 'medium';

  return {
    title: meta.title,
    description: type === 'accuracy'
      ? `Only ${(accuracy * 100).toFixed(0)}% accuracy on ${meta.title.toLowerCase()} problems.`
      : `Average ${(avgLatency / 1000).toFixed(1)}s response time on ${meta.title.toLowerCase()} problems.`,
    pattern: tag,
    severity,
    suggestion: meta.suggestion,
  };
}
