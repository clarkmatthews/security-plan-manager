import type { Prisma } from "@prisma/client";
import type { Scorecard } from "@/lib/scoring";
import {
  parseSoftwareInsights,
  type SoftwareInsights,
} from "@/lib/software-insights";
import { parseBrandRisks, type BrandRisk } from "@/lib/brand-risks";

export type FrozenSnapshot = {
  brandId?: string;
  brandName?: string;
  period: string;
  publishedAt?: string;
  scorecard: Scorecard;
  inventoryInsights?: SoftwareInsights;
  brandRisks?: BrandRisk[];
};

export function parseFrozenSnapshot(
  json: Prisma.JsonValue | null | undefined,
  fallbackPeriod: string,
): FrozenSnapshot | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const data = json as Record<string, unknown>;
  const scorecard = data.scorecard;
  if (!scorecard || typeof scorecard !== "object" || Array.isArray(scorecard)) {
    return null;
  }

  return {
    brandId: typeof data.brandId === "string" ? data.brandId : undefined,
    brandName: typeof data.brandName === "string" ? data.brandName : undefined,
    period: typeof data.period === "string" ? data.period : fallbackPeriod,
    publishedAt: typeof data.publishedAt === "string" ? data.publishedAt : undefined,
    scorecard: scorecard as Scorecard,
    inventoryInsights: parseSoftwareInsights(data.inventoryInsights) ?? undefined,
    brandRisks: parseBrandRisks(data.brandRisks) ?? undefined,
  };
}
