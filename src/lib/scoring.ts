import { CsfTier } from "@prisma/client";

export const FUNCTION_ORDER = ["GV", "ID", "PR", "DE", "RS", "RC"] as const;

export const TIER_VALUE: Record<CsfTier, number> = {
  PARTIAL: 1,
  RISK_INFORMED: 2,
  REPEATABLE: 3,
  ADAPTIVE: 4,
};

export const TIER_LABEL: Record<CsfTier, string> = {
  PARTIAL: "Partial",
  RISK_INFORMED: "Risk Informed",
  REPEATABLE: "Repeatable",
  ADAPTIVE: "Adaptive",
};

export const FUNCTION_META: Record<
  string,
  { color: string; short: string }
> = {
  GV: { color: "#d4b84a", short: "Govern" },
  ID: { color: "#4f9fd4", short: "Identify" },
  PR: { color: "#7b6bc4", short: "Protect" },
  DE: { color: "#e09a3e", short: "Detect" },
  RS: { color: "#c45c5c", short: "Respond" },
  RC: { color: "#4faf78", short: "Recover" },
};

export function functionDisplayName(code: string, fallbackName?: string | null) {
  return FUNCTION_META[code]?.short ?? fallbackName ?? code;
}

export function functionLabel(code: string, fallbackName?: string | null) {
  const name = functionDisplayName(code, fallbackName);
  return name === code ? code : `${name} (${code})`;
}

export function tierToScore(tier: CsfTier | null | undefined): number | null {
  if (!tier) return null;
  return (TIER_VALUE[tier] / 4) * 100;
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export type AssessmentScoreInput = {
  includedInProfile: boolean;
  currentTier: CsfTier | null;
  targetTier: CsfTier | null;
  subcategoryCode: string;
  subcategoryDescription: string;
  functionCode: string;
  functionName: string;
  categoryCode: string;
  categoryName: string;
  evidenceCount: number;
};

export type FunctionScore = {
  code: string;
  name: string;
  currentScore: number | null;
  targetScore: number | null;
  gap: number | null;
  coverage: number;
  included: number;
  assessed: number;
  complete: number;
};

export type GapItem = {
  subcategoryCode: string;
  subcategoryDescription: string;
  functionCode: string;
  categoryCode: string;
  currentTier: CsfTier | null;
  targetTier: CsfTier | null;
  gap: number;
};

export type Scorecard = {
  overallCurrent: number | null;
  overallTarget: number | null;
  overallGap: number | null;
  coverage: number;
  included: number;
  assessed: number;
  complete: number;
  evidenceCount: number;
  functions: FunctionScore[];
  topGaps: GapItem[];
};

export function computeScorecard(rows: AssessmentScoreInput[]): Scorecard {
  const includedRows = rows.filter((row) => row.includedInProfile);
  const completeRows = includedRows.filter(
    (row) => row.currentTier && row.targetTier,
  );

  const functionsMap = new Map<string, AssessmentScoreInput[]>();
  for (const row of includedRows) {
    const list = functionsMap.get(row.functionCode) ?? [];
    list.push(row);
    functionsMap.set(row.functionCode, list);
  }

  const functions: FunctionScore[] = [...functionsMap.entries()]
    .sort(
      ([a], [b]) =>
        FUNCTION_ORDER.indexOf(a as (typeof FUNCTION_ORDER)[number]) -
        FUNCTION_ORDER.indexOf(b as (typeof FUNCTION_ORDER)[number]),
    )
    .map(([code, items]) => {
      const withCurrent = items.filter((item) => item.currentTier);
      const complete = items.filter((item) => item.currentTier && item.targetTier);
      const currentScore = average(
        withCurrent
          .map((item) => tierToScore(item.currentTier))
          .filter((value): value is number => value !== null),
      );
      const targetAssessed = items.filter((item) => item.targetTier);
      const targetScore = average(
        targetAssessed
          .map((item) => tierToScore(item.targetTier))
          .filter((value): value is number => value !== null),
      );
      const gap =
        currentScore !== null && targetScore !== null
          ? targetScore - currentScore
          : null;
      return {
        code,
        name: functionDisplayName(code, items[0]?.functionName),
        currentScore,
        targetScore,
        gap,
        coverage: items.length === 0 ? 0 : complete.length / items.length,
        included: items.length,
        assessed: withCurrent.length,
        complete: complete.length,
      };
    });

  const overallCurrent = average(
    functions
      .map((fn) => fn.currentScore)
      .filter((value): value is number => value !== null),
  );
  const overallTarget = average(
    functions
      .map((fn) => fn.targetScore)
      .filter((value): value is number => value !== null),
  );

  const topGaps: GapItem[] = includedRows
    .map((row) => {
      const current = row.currentTier ? TIER_VALUE[row.currentTier] : 0;
      const target = row.targetTier ? TIER_VALUE[row.targetTier] : 0;
      return {
        subcategoryCode: row.subcategoryCode,
        subcategoryDescription: row.subcategoryDescription,
        functionCode: row.functionCode,
        categoryCode: row.categoryCode,
        currentTier: row.currentTier,
        targetTier: row.targetTier,
        gap: target - current,
      };
    })
    .filter((item) => item.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 5);

  return {
    overallCurrent,
    overallTarget,
    overallGap:
      overallCurrent !== null && overallTarget !== null
        ? overallTarget - overallCurrent
        : null,
    coverage:
      includedRows.length === 0 ? 0 : completeRows.length / includedRows.length,
    included: includedRows.length,
    assessed: completeRows.length,
    complete: completeRows.length,
    evidenceCount: rows.reduce((sum, row) => sum + row.evidenceCount, 0),
    functions,
    topGaps,
  };
}

export function currentPeriod(date = new Date()): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${quarter}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export function formatScore(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value)}`;
}

export function isFunctionCode(
  value: string | undefined | null,
): value is (typeof FUNCTION_ORDER)[number] {
  return FUNCTION_ORDER.includes(value as (typeof FUNCTION_ORDER)[number]);
}

export function formatTierValue(value: string | null | undefined): string {
  if (!value) return "Not set";
  return TIER_LABEL[value as CsfTier] ?? value;
}
