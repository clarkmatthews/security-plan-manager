import { CsfTier, Priority } from "@prisma/client";

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
  { color: string; short: string; description: string }
> = {
  GV: {
    color: "#d4b84a",
    short: "Govern",
    description:
      "How the organization sets cybersecurity strategy, policy, roles, and oversight so leaders know who is accountable and how risk decisions are made.",
  },
  ID: {
    color: "#4f9fd4",
    short: "Identify",
    description:
      "Understanding what the organization has and what could go wrong: assets, suppliers, threats, and the cybersecurity risks that matter to the business.",
  },
  PR: {
    color: "#7b6bc4",
    short: "Protect",
    description:
      "Safeguards that reduce the chance of an incident, including access control, training, data protection, and secure configuration of systems.",
  },
  DE: {
    color: "#e09a3e",
    short: "Detect",
    description:
      "Finding and analyzing possible attacks and compromises through monitoring so unusual activity is spotted in time to act.",
  },
  RS: {
    color: "#c45c5c",
    short: "Respond",
    description:
      "What the organization does when a cybersecurity incident is confirmed: contain it, communicate, and manage the event.",
  },
  RC: {
    color: "#4faf78",
    short: "Recover",
    description:
      "Restoring systems, data, and operations after an incident and keeping stakeholders informed while the business returns to normal.",
  },
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
  currentPriority: Priority | null;
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
  currentPriority: Priority | null;
  gap: number;
};

export type Scorecard = {
  overallCurrent: number | null;
  overallTarget: number | null;
  overallGap: number | null;
  coverage: number;
  included: number;
  excluded: number;
  assessed: number;
  complete: number;
  evidenceCount: number;
  functions: FunctionScore[];
  topGaps: GapItem[];
};

function priorityRank(priority: Priority | null | undefined) {
  if (priority === "HIGH") return 2;
  if (priority === "MEDIUM") return 1;
  return 0;
}

export function compareCsfGaps(a: GapItem, b: GapItem) {
  if (b.gap !== a.gap) return b.gap - a.gap;
  const partialA = a.currentTier === "PARTIAL" ? 1 : 0;
  const partialB = b.currentTier === "PARTIAL" ? 1 : 0;
  if (partialB !== partialA) return partialB - partialA;
  return priorityRank(b.currentPriority) - priorityRank(a.currentPriority);
}

export function listCsfGaps(rows: AssessmentScoreInput[], limit = 5): GapItem[] {
  return rows
    .filter((row) => row.includedInProfile)
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
        currentPriority: row.currentPriority,
        gap: target - current,
      };
    })
    .filter((item) => item.gap > 0)
    .sort(compareCsfGaps)
    .slice(0, limit);
}

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

  const functions: FunctionScore[] = FUNCTION_ORDER.map((code) => {
    const items = functionsMap.get(code) ?? [];
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
    const named = rows.find((row) => row.functionCode === code);
    return {
      code,
      name: functionDisplayName(code, items[0]?.functionName ?? named?.functionName),
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

  const topGaps = listCsfGaps(rows, 5);

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
    excluded: rows.length - includedRows.length,
    assessed: completeRows.length,
    complete: completeRows.length,
    evidenceCount: includedRows.reduce((sum, row) => sum + row.evidenceCount, 0),
    functions,
    topGaps,
  };
}

export type PeriodParts = {
  year: number;
  quarter: number;
};

export function currentQuarter(date = new Date()): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

export function currentPeriod(date = new Date()): string {
  return formatPeriod(date.getFullYear(), currentQuarter(date));
}

export function formatPeriod(year: number, quarter: number): string {
  return `${year}-Q${quarter}`;
}

export function formatPeriodLabel(period: string): string {
  const parts = parsePeriod(period);
  if (!parts) return period;
  return `${parts.year} Q${parts.quarter}`;
}

export function parsePeriod(period: string | null | undefined): PeriodParts | null {
  const match = /^(\d{4})-Q([1-4])$/i.exec(String(period ?? "").trim());
  if (!match) return null;
  return { year: Number(match[1]), quarter: Number(match[2]) };
}

export function periodFromForm(formData: FormData): string {
  const year = Number(formData.get("year"));
  const quarter = Number(formData.get("quarter"));
  if (Number.isInteger(year) && year >= 2000 && year <= 2100 && quarter >= 1 && quarter <= 4) {
    return formatPeriod(year, quarter);
  }
  const period = String(formData.get("period") ?? "").trim();
  return parsePeriod(period) ? period : currentPeriod();
}

export function periodYearOptions(date = new Date()): number[] {
  const year = date.getFullYear();
  const years: number[] = [];
  for (let value = year - 5; value <= year + 1; value += 1) {
    years.push(value);
  }
  return years;
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

export function completionRatio(
  current: number | null,
  target: number | null,
): number | null {
  if (current === null) return null;
  if (target === null || target <= 0) return Math.min(current / 100, 1);
  return Math.min(current / target, 1);
}

export function formatCompletion(
  current: number | null,
  target: number | null,
): string {
  const ratio = completionRatio(current, target);
  if (ratio === null) return "—";
  return `${Math.round(ratio * 100)}%`;
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
