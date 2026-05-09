import { CognitiveTag, GameConfig, Operation, Question, QuestionMetadata } from '@/types';

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

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Difficulty scoring (0-1, higher = harder)
function computeDifficultyScore(
  lhs: number,
  rhs: number,
  op: Operation,
  carries: number,
  borrows: number
): number {
  const lhsD = countDigits(lhs);
  const rhsD = countDigits(rhs);
  let score = 0;

  // Base digit count contribution
  score += (lhsD + rhsD) * 0.15;

  // Carry/borrow penalty
  score += carries * 0.12;
  score += borrows * 0.12;

  // Operation difficulty
  const opWeight = { add: 0.05, sub: 0.08, mul: 0.25, div: 0.20 };
  score += opWeight[op];

  // Multiplication-specific difficulty
  if (op === 'mul') {
    const hardMultipliers = [6, 7, 8, 9];
    const isHardMult = hardMultipliers.includes(lhs) || hardMultipliers.includes(rhs);
    const has2Digit = lhsD >= 2 || rhsD >= 2;
    
    if (isHardMult && has2Digit) score += 0.15;
    else if (isHardMult) score += 0.08;
    else if (has2Digit) score += 0.12;
    
    // Penalize easy multipliers
    const easyMultipliers = [1, 2, 5, 10];
    if (easyMultipliers.includes(lhs) || easyMultipliers.includes(rhs)) score -= 0.05;
  }

  return Math.min(1, Math.max(0, score));
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
    else if (meta.carryCount === 1) tags.push('carry_light');
    if (lhs + rhs === 100) tags.push('complement_to_100');
  }

  if (op === 'sub' && meta.borrowCount >= 2) tags.push('borrow_heavy');
  if (op === 'sub' && meta.borrowCount === 1) tags.push('borrow_light');
  if (op === 'div' && Number.isInteger(answer)) tags.push('division_clean');

  const lhsD = countDigits(lhs);
  const rhsD = countDigits(rhs);
  if (lhsD >= 2 && rhsD >= 2) tags.push('double_digit_both');
  if (lhsD === 1 && rhsD === 1) tags.push('single_digit_both');
  if (lhsD >= 2 && rhsD === 1) tags.push('two_by_one');
  if (lhsD === 1 && rhsD >= 2) tags.push('one_by_two');

  if (answer < 0) tags.push('result_negative');
  if (!Number.isInteger(answer)) tags.push('result_decimal');

  return tags;
}

// Weighted multiplication templates
function generateMul(config: GameConfig) {
  if (config.mulTableTarget !== null) {
    const t = config.mulTableTarget;
    const other = randInt(1, 12);
    return { lhs: t, rhs: other, answer: t * other };
  }

  const min = config.minValue;
  const max = config.maxValue;

  // Difficulty tiers: 40% single×single (hard), 35% 2×1, 20% 2×2 light, 5% hard spike
  const tier = weightedRandom(['hard_single', 'two_by_one', 'two_by_two', 'spike'], [40, 35, 20, 5]);

  if (tier === 'hard_single') {
    // Bias toward difficult single-digit combos: 6×7, 7×8, 8×9, 7×12, 11×8, 12×9
    const hardCombos = [
      [6, 7], [7, 8], [8, 9], [7, 12], [11, 8], [12, 9],
      [7, 6], [8, 7], [9, 8], [12, 7], [8, 11], [9, 12]
    ];
    const [a, b] = weightedRandom(hardCombos, hardCombos.map(() => 1));
    return { lhs: a, rhs: b, answer: a * b };
  }

  if (tier === 'two_by_one') {
    // 2-digit × 1-digit, bias toward 6,7,8,9 multipliers
    const twoDigit = randInt(10, Math.min(max, 99));
    const multiplier = weightedRandom([6, 7, 8, 9], [30, 30, 20, 20]);
    return { lhs: twoDigit, rhs: multiplier, answer: twoDigit * multiplier };
  }

  if (tier === 'two_by_two') {
    // Light 2×2: keep numbers reasonable
    const a = randInt(10, 35);
    const b = randInt(10, 25);
    return { lhs: a, rhs: b, answer: a * b };
  }

  // Hard spike: occasional challenging problems
  const a = randInt(35, 65);
  const b = randInt(15, 40);
  return { lhs: a, rhs: b, answer: a * b };
}

// Weighted addition templates - bias toward carry problems
function generateAdd(config: GameConfig) {
  const min = config.minValue;
  const max = config.maxValue;

  // 70% carry problems, 30% no-carry
  const hasCarry = Math.random() < 0.7;

  if (hasCarry) {
    // Generate carry-heavy additions
    const a = randInt(min, max);
    const b = randInt(min, max);
    // Ensure at least one carry by manipulating lower digits
    const aLower = a % 10;
    const bLower = b % 10;
    if (aLower + bLower < 10) {
      const adjusted = randInt(10 - aLower, 19 - aLower);
      return { lhs: a, rhs: b + adjusted, answer: a + b + adjusted };
    }
    return { lhs: a, rhs: b, answer: a + b };
  }

  // No-carry but still interesting
  const a = randInt(min, max);
  const b = randInt(min, max);
  return { lhs: a, rhs: b, answer: a + b };
}

// Weighted subtraction templates - bias toward borrowing
function generateSub(config: GameConfig) {
  const min = config.minValue;
  const max = config.maxValue;

  // 65% borrowing problems
  const hasBorrow = Math.random() < 0.65;

  if (hasBorrow) {
    const a = randInt(min + 10, max);
    const b = randInt(min, a - 1);
    return { lhs: a, rhs: b, answer: a - b };
  }

  const a = randInt(min, max);
  const b = randInt(min, a);
  return { lhs: a, rhs: b, answer: a - b };
}

// Weighted division templates - clean but varied
function generateDiv(config: GameConfig) {
  const min = config.minValue;
  const max = config.maxValue;

  // Generate clean divisions with reasonable complexity
  const divisor = randInt(Math.max(2, min), Math.min(12, max));
  const quotient = randInt(min, Math.min(max, 20));
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
  const difficulty = computeDifficultyScore(lhs, rhs, op, carryCount, borrowCount);
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
