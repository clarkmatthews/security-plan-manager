import type { Priority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseCvssFromText, CVE_RISK_CVSS_THRESHOLD } from "@/lib/cvss";
import { normalizeProductName } from "@/lib/software";
import {
  listCsfGaps,
  type AssessmentScoreInput,
  type GapItem,
} from "@/lib/scoring";

export const MAX_CVE_RISK_SLOTS = 2;
export const TOP_BRAND_RISKS = 5;

export type CsfBrandRisk = GapItem & {
  kind: "csf";
};

export type CveBrandRisk = {
  kind: "cve";
  softwareAssetId: string;
  productName: string;
  companyName: string;
  maxCvss: number;
  highCount: number;
  cveId: string;
  sourceUrl: string;
};

export type BrandRisk = CsfBrandRisk | CveBrandRisk;

function asGapItem(value: unknown): GapItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (typeof data.subcategoryCode !== "string") return null;
  if (typeof data.subcategoryDescription !== "string") return null;
  if (typeof data.functionCode !== "string") return null;
  if (typeof data.categoryCode !== "string") return null;
  if (typeof data.gap !== "number") return null;
  const priority =
    data.currentPriority === "HIGH" ||
    data.currentPriority === "MEDIUM" ||
    data.currentPriority === "LOW"
      ? (data.currentPriority as Priority)
      : null;
  return {
    subcategoryCode: data.subcategoryCode,
    subcategoryDescription: data.subcategoryDescription,
    functionCode: data.functionCode,
    categoryCode: data.categoryCode,
    currentTier:
      data.currentTier === "PARTIAL" ||
      data.currentTier === "RISK_INFORMED" ||
      data.currentTier === "REPEATABLE" ||
      data.currentTier === "ADAPTIVE"
        ? data.currentTier
        : null,
    targetTier:
      data.targetTier === "PARTIAL" ||
      data.targetTier === "RISK_INFORMED" ||
      data.targetTier === "REPEATABLE" ||
      data.targetTier === "ADAPTIVE"
        ? data.targetTier
        : null,
    currentPriority: priority,
    gap: data.gap,
  };
}

export function parseBrandRisks(value: unknown): BrandRisk[] | null {
  if (!Array.isArray(value)) return null;
  const risks: BrandRisk[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    if (row.kind === "cve") {
      if (typeof row.softwareAssetId !== "string") continue;
      if (typeof row.productName !== "string") continue;
      if (typeof row.companyName !== "string") continue;
      if (typeof row.maxCvss !== "number") continue;
      if (typeof row.highCount !== "number") continue;
      if (typeof row.cveId !== "string") continue;
      if (typeof row.sourceUrl !== "string") continue;
      risks.push({
        kind: "cve",
        softwareAssetId: row.softwareAssetId,
        productName: row.productName,
        companyName: row.companyName,
        maxCvss: row.maxCvss,
        highCount: row.highCount,
        cveId: row.cveId,
        sourceUrl: row.sourceUrl,
      });
      continue;
    }
    const gap = asGapItem(row);
    if (gap) risks.push({ kind: "csf", ...gap });
  }
  return risks;
}

export function mergeBrandRisks(csfGaps: GapItem[], cveRisks: CveBrandRisk[]): BrandRisk[] {
  const csf = csfGaps.slice(0, TOP_BRAND_RISKS).map((gap) => ({
    kind: "csf" as const,
    ...gap,
  }));
  const cves = [...cveRisks]
    .filter((item) => item.maxCvss > CVE_RISK_CVSS_THRESHOLD)
    .sort((a, b) => b.maxCvss - a.maxCvss)
    .slice(0, MAX_CVE_RISK_SLOTS);

  if (cves.length === 0) return csf.slice(0, TOP_BRAND_RISKS);

  const keepCsf = Math.max(0, TOP_BRAND_RISKS - cves.length);
  return [...csf.slice(0, keepCsf), ...cves].slice(0, TOP_BRAND_RISKS);
}

export async function computeBrandRisks(
  organizationId: string,
  brandId: string,
  scoreInputs: AssessmentScoreInput[],
): Promise<BrandRisk[]> {
  const csfGaps = listCsfGaps(scoreInputs, 8);
  const matches = await prisma.softwareCveMatch.findMany({
    where: {
      organizationId,
      brandId,
      acknowledgedAt: null,
      software: { archivedAt: null },
    },
    include: {
      cve: { select: { cveId: true, summary: true, sourceUrl: true, cvssScore: true } },
      software: { select: { id: true, productName: true, companyName: true } },
    },
  });

  const scored: Array<{ match: (typeof matches)[number]; cvssScore: number }> = [];
  for (const match of matches) {
    const cvssScore = match.cve.cvssScore ?? parseCvssFromText(match.cve.summary);
    if (cvssScore == null || cvssScore <= CVE_RISK_CVSS_THRESHOLD) continue;
    scored.push({ match, cvssScore });
  }

  const byProduct = new Map<string, CveBrandRisk & { seenCves: Set<string> }>();
  for (const { match, cvssScore } of scored) {
    const key = `${normalizeProductName(match.software.companyName)}::${normalizeProductName(match.software.productName)}`;
    const current = byProduct.get(key);
    if (!current) {
      byProduct.set(key, {
        kind: "cve",
        softwareAssetId: match.softwareAssetId,
        productName: match.software.productName,
        companyName: match.software.companyName,
        maxCvss: cvssScore,
        highCount: 1,
        cveId: match.cve.cveId,
        sourceUrl: match.cve.sourceUrl,
        seenCves: new Set([match.cve.cveId]),
      });
      continue;
    }
    if (!current.seenCves.has(match.cve.cveId)) {
      current.seenCves.add(match.cve.cveId);
      current.highCount += 1;
    }
    if (cvssScore > current.maxCvss) {
      current.maxCvss = cvssScore;
      current.cveId = match.cve.cveId;
      current.sourceUrl = match.cve.sourceUrl;
      current.softwareAssetId = match.softwareAssetId;
    }
  }

  return mergeBrandRisks(
    csfGaps,
    [...byProduct.values()].map(({ seenCves: _seen, ...risk }) => risk),
  );
}
