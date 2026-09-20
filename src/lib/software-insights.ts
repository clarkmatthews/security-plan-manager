import type { SoftwareCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { purgeRejectedCves, visibleCveWhere } from "@/lib/cve-visibility";
import { SOFTWARE_CATEGORIES, softwareCategoryLabel } from "@/lib/software";

export type SoftwareInsights = {
  applicationCount: number;
  categoryCounts: Array<{
    category: SoftwareCategory;
    label: string;
    count: number;
  }>;
  cveOutstanding: number;
  cveResolved: number;
};

function cveDayKey(publishedAt: Date | null, detectedAt: Date) {
  return (publishedAt ?? detectedAt).toISOString().slice(0, 10);
}

export async function computeSoftwareInsights(
  organizationId: string,
  brandId: string,
): Promise<SoftwareInsights> {
  await purgeRejectedCves();
  const [assets, matches] = await Promise.all([
    prisma.softwareAsset.findMany({
      where: { organizationId, brandId, archivedAt: null },
      select: { category: true },
    }),
    prisma.softwareCveMatch.findMany({
      where: {
        organizationId,
        brandId,
        software: { archivedAt: null },
        cve: visibleCveWhere({ includeBlank: true }),
      },
      select: {
        softwareAssetId: true,
        acknowledgedAt: true,
        detectedAt: true,
        cve: { select: { publishedAt: true } },
      },
    }),
  ]);

  const appDays = new Map<string, boolean>();
  for (const match of matches) {
    const key = `${match.softwareAssetId}:${cveDayKey(match.cve.publishedAt, match.detectedAt)}`;
    const outstanding = appDays.get(key) ?? false;
    appDays.set(key, outstanding || match.acknowledgedAt == null);
  }

  let cveOutstanding = 0;
  let cveResolved = 0;
  for (const outstanding of appDays.values()) {
    if (outstanding) cveOutstanding += 1;
    else cveResolved += 1;
  }

  const counts = Object.fromEntries(
    SOFTWARE_CATEGORIES.map((item) => [item.value, 0]),
  ) as Record<SoftwareCategory, number>;
  for (const asset of assets) {
    counts[asset.category] += 1;
  }

  return {
    applicationCount: assets.length,
    categoryCounts: SOFTWARE_CATEGORIES.map((item) => ({
      category: item.value,
      label: softwareCategoryLabel(item.value),
      count: counts[item.value],
    })),
    cveOutstanding,
    cveResolved,
  };
}

export function parseSoftwareInsights(value: unknown): SoftwareInsights | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (typeof data.applicationCount !== "number") return null;
  if (typeof data.cveOutstanding !== "number") return null;
  if (typeof data.cveResolved !== "number") return null;
  if (!Array.isArray(data.categoryCounts)) return null;

  const categoryCounts: SoftwareInsights["categoryCounts"] = [];
  for (const item of data.categoryCounts) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    if (typeof row.category !== "string") continue;
    if (typeof row.label !== "string") continue;
    if (typeof row.count !== "number") continue;
    categoryCounts.push({
      category: row.category as SoftwareCategory,
      label: row.label,
      count: row.count,
    });
  }

  return {
    applicationCount: data.applicationCount,
    categoryCounts,
    cveOutstanding: data.cveOutstanding,
    cveResolved: data.cveResolved,
  };
}
