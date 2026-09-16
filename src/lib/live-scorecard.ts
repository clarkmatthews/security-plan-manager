import { prisma } from "@/lib/prisma";
import { computeScorecard } from "@/lib/scoring";
import { toScoreInputs } from "@/lib/catalog";

export const profileScoreInclude = {
  brand: true,
  assessments: {
    include: {
      evidence: true,
      subcategory: {
        include: { category: { include: { function: true } } },
      },
    },
  },
} as const;

export async function liveScorecardForProfile(
  profileId: string,
  organizationId: string,
) {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, organizationId },
    include: profileScoreInclude,
  });
  if (!profile) return null;
  return {
    profile,
    scorecard: computeScorecard(toScoreInputs(profile.assessments)),
  };
}

export async function syncLatestSnapshot(
  profileId: string,
  organizationId: string,
) {
  const live = await liveScorecardForProfile(profileId, organizationId);
  if (!live) return;

  const latest = await prisma.reportSnapshot.findFirst({
    where: { profileId, organizationId },
    orderBy: { publishedAt: "desc" },
  });
  if (!latest) return;

  const previous = (latest.scoresJson ?? {}) as Record<string, unknown>;
  await prisma.reportSnapshot.update({
    where: { id: latest.id },
    data: {
      scoresJson: {
        ...previous,
        brandId: live.profile.brandId,
        brandName: live.profile.brand.name,
        period: live.profile.period,
        updatedAt: new Date().toISOString(),
        scorecard: live.scorecard,
      },
    },
  });
}
