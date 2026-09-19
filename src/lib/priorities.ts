import type { CsfTier } from "@prisma/client";

export type OutcomePriorityItem = {
  subcategoryId: string;
  subcategoryCode: string;
  subcategoryDescription: string;
  functionCode: string;
  functionName: string;
  categoryCode: string;
  currentTier: CsfTier | null;
  targetTier: CsfTier | null;
};

export type OutcomeCatalogItem = {
  id: string;
  code: string;
  description: string;
  functionCode: string;
  functionName: string;
  categoryCode: string;
  categoryName: string;
};

const TIERS: ReadonlySet<string> = new Set([
  "PARTIAL",
  "RISK_INFORMED",
  "REPEATABLE",
  "ADAPTIVE",
]);

function parseTier(value: unknown): CsfTier | null {
  return typeof value === "string" && TIERS.has(value) ? (value as CsfTier) : null;
}

export function parsePriorities(value: unknown): OutcomePriorityItem[] | null {
  if (!Array.isArray(value)) return null;
  const items: OutcomePriorityItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const data = item as Record<string, unknown>;
    if (typeof data.subcategoryId !== "string") continue;
    if (typeof data.subcategoryCode !== "string") continue;
    if (typeof data.subcategoryDescription !== "string") continue;
    if (typeof data.functionCode !== "string") continue;
    if (typeof data.categoryCode !== "string") continue;
    items.push({
      subcategoryId: data.subcategoryId,
      subcategoryCode: data.subcategoryCode,
      subcategoryDescription: data.subcategoryDescription,
      functionCode: data.functionCode,
      functionName:
        typeof data.functionName === "string" ? data.functionName : data.functionCode,
      categoryCode: data.categoryCode,
      currentTier: parseTier(data.currentTier),
      targetTier: parseTier(data.targetTier),
    });
  }
  return items;
}

type PriorityAssessment = {
  subcategoryId: string;
  currentTier: CsfTier | null;
  targetTier: CsfTier | null;
};

type PriorityRow = {
  subcategoryId: string;
  subcategory: {
    code: string;
    description: string;
    category: {
      code: string;
      function: { code: string; name: string };
    };
  };
};

export function toPriorityItems(
  rows: PriorityRow[],
  assessments: PriorityAssessment[],
): OutcomePriorityItem[] {
  const bySubcategory = new Map(
    assessments.map((assessment) => [assessment.subcategoryId, assessment]),
  );
  return rows.map((row) => {
    const assessment = bySubcategory.get(row.subcategoryId);
    return {
      subcategoryId: row.subcategoryId,
      subcategoryCode: row.subcategory.code,
      subcategoryDescription: row.subcategory.description,
      functionCode: row.subcategory.category.function.code,
      functionName: row.subcategory.category.function.name,
      categoryCode: row.subcategory.category.code,
      currentTier: assessment?.currentTier ?? null,
      targetTier: assessment?.targetTier ?? null,
    };
  });
}
