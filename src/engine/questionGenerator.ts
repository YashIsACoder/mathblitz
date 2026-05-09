import { Operation, Question, QuestionMetadata, CognitiveTag, GameConfig } from '@/types';

function countDigits(n: number): number {
  return Math.floor(Math.abs(n)).toString().length;
}

function countCarries(a: number, b: number): number {
  let carries = 0;
  let carry = 0;
  let x = Math.round(Math.abs(a));
  let y = Math.round(Math.abs(b));
  while (x > 0 || y > 0 || carry > 0) {
    const sum = (x % 10) + (y % 10) + carry;
    carry = Math.floor(sum / 10);
    if (carry) carries++;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return carries;
}

function countBorrows(a: number, b: number): number {
  let borrows = 0;
  let borrow = 0;
  let x = Math.round(Math.abs(a));
  let y = Math.round(Math.abs(b));
  while (x > 0 || y > 0) {
    let diff = (x % 10) - (y % 10) - borrow;
    if (diff < 0) { borrows++; borrow = 1; } else { borrow = 0; }
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return borrows;
}

function computeTags(
  lhs: number,
  rhs: number,
  op: Operation,
  answer: number,
  meta: Pick<QuestionMetadata, 'carryCount' | 'borrowCount'>
): CognitiveTag[] {
  const tags: CognitiveTag[] = [];

  const isNearPow10 = (n: number) => {
    const pows = [10, 20, 25, 50, 100, 1000];
    return pows.some(p => Math.abs(n - p) <= 2);
  };

  const hasRepeatedDigits = (n: number) => {
    const s = Math.abs(n).toString();
    return s.length > 1 && new Set(s).size === 1;
  };

  if (isNearPow10(lhs) || isNearPow10(rhs)) tags.push('near_power_of_10');
  if (hasRepeatedDigits(lhs) || hasRepeatedDigits(rhs)) tags.push('repeated_digits');

  if (op === 'mul') {
    if (lhs === 7 || rhs === 7) tags.push('multiplication_by_7');
    if (lhs === 8 || rhs === 8) tags.push('multiplication_by_8');
    if (lhs === 9 || rhs === 9) tags.push('multiplication_by_9');
  }

  if (op === 'add') {
    if (meta.carryCount >= 2) tags.push('carry_heavy');
    else if (meta.carryCount === 0) tags.push('carry_light');
    if (lhs + rhs === 100) tags.push('complement_to_100');
  }

  if (op === 'sub' && meta.borrowCount >= 2) tags.push('borrow_heavy');
  if (op === 'div' && Number.isInteger(answer)) tags.push('division_clean');

  const lhsD = countDigits(lhs);
  const rhsD = countDigits(rhs);
  if (lhsD >= 2 && rhsD >= 2) tags.push('double_digit_both');
  if (lhsD === 1 && rhsD === 1) tags.push('single_digit_both');

  if (answer < 0) tags.push('result_negative');
  if (!Number.isInteger(answer)) tags.push('result_decimal');

  return tags;
}

function estimateDifficulty(
  lhs: number,
  rhs: number,
  op: Operation,
  carries: number,
  borrows: number
): number {
  const lhsD = countDigits(lhs);
  const rhsD = countDigits(rhs);
  let score = 0;

  score += (lhsD + rhsD) * 0.1;
  score += carries * 0.15;
  score += borrows * 0.15;

  const opWeight = { add: 0.05, sub: 0.1, mul: 0.25, div: 0.3 };
  score += opWeight[op];

  if (op === 'mul') {
    const hard = [6, 7, 8, 9];
    if (hard.includes(lhs) || hard.includes(rhs)) score += 0.1;
  }

  return Math.min(1, score);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAdd(config: GameConfig) {
  const lhs = randInt(config.minValue, config.maxValue);
  const rhs = randInt(config.minValue, config.maxValue);
  return { lhs, rhs, answer: lhs + rhs };
}

function generateSub(config: GameConfig) {
  let lhs = randInt(config.minValue, config.maxValue);
  let rhs = randInt(config.minValue, config.maxValue);
  if (!config.allowNegatives && rhs > lhs) [lhs, rhs] = [rhs, lhs];
  return { lhs, rhs, answer: lhs - rhs };
}

function generateMul(config: GameConfig) {
  if (config.mulTableTarget !== null) {
    const t = config.mulTableTarget;
    const other = randInt(1, 12);
    return { lhs: t, rhs: other, answer: t * other };
  }
  const lhs = randInt(config.minValue, Math.min(config.maxValue, 12));
  const rhs = randInt(config.minValue, Math.min(config.maxValue, 12));
  return { lhs, rhs, answer: lhs * rhs };
}

function generateDiv(config: GameConfig) {
  const divisor = randInt(Math.max(2, config.minValue), Math.min(12, config.maxValue));
  const quotient = randInt(1, 12);
  const dividend = divisor * quotient;
  return { lhs: dividend, rhs: divisor, answer: quotient };
}

const OP_SYMBOLS: Record<Operation, string> = {
  add: '+',
  sub: '−',
  mul: '×',
  div: '÷',
};

function pickOperation(ops: Operation[], weights?: Record<string, number>): Operation {
  if (!weights || Object.keys(weights).length === 0) {
    return ops[Math.floor(Math.random() * ops.length)];
  }
  const totalWeight = ops.reduce((sum, op) => sum + (weights[op] ?? 1), 0);
  let rand = Math.random() * totalWeight;
  for (const op of ops) {
    rand -= weights[op] ?? 1;
    if (rand <= 0) return op;
  }
  return ops[0];
}

export function generateQuestion(config: GameConfig, adaptiveWeights?: Record<string, number>): Question {
  const op = pickOperation(config.operations, adaptiveWeights);
  const generators = { add: generateAdd, sub: generateSub, mul: generateMul, div: generateDiv };
  const { lhs, rhs, answer } = generators[op](config);

  const carryCount = op === 'add' ? countCarries(lhs, rhs) : 0;
  const borrowCount = op === 'sub' ? countBorrows(lhs, rhs) : 0;
  const difficulty = estimateDifficulty(lhs, rhs, op, carryCount, borrowCount);
  const tags = computeTags(lhs, rhs, op, answer, { carryCount, borrowCount });

  const metadata: QuestionMetadata = {
    lhsDigits: countDigits(lhs),
    rhsDigits: countDigits(rhs),
    carryCount,
    borrowCount,
    difficulty,
    tags,
  };

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    lhs,
    rhs,
    operation: op,
    answer,
    display: `${lhs} ${OP_SYMBOLS[op]} ${rhs}`,
    metadata,
  };
}

export function checkAnswer(question: Question, typed: string): boolean {
  const parsed = parseFloat(typed.trim());
  if (isNaN(parsed)) return false;
  return Math.abs(parsed - question.answer) < 0.01;
}
