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
