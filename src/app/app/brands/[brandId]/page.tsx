import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { computeScorecard } from "@/lib/scoring";
import { toScoreInputs } from "@/lib/catalog";
import { FunctionScores, HighestBrandRisks, ScoreOverview } from "@/components/score-overview";
import { SoftwareInsightsCards } from "@/components/software-insights";
import { computeSoftwareInsights } from "@/lib/software-insights";
import { computeBrandRisks } from "@/lib/brand-risks";

export default async function BrandDashboardPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  await connection();
  const membership = await requireArea("PROGRAM", "view");
  requireBrandAccess(membership, brandId);

  const [brand, insights] = await Promise.all([
    prisma.brand.findFirst({
      where: { id: brandId, organizationId: membership.organizationId },
      include: {
        profiles: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            assessments: {
              include: {
                evidence: true,
                subcategory: {
                  include: { category: { include: { function: true } } },
                },
              },
            },
          },
        },
      },
    }),
    computeSoftwareInsights(membership.organizationId, brandId),
  ]);

  if (!brand || !brand.profiles[0]) {
    notFound();
  }

  const profile = brand.profiles[0];
  const scoreInputs = toScoreInputs(profile.assessments);
  const scorecard = computeScorecard(scoreInputs);
  const brandRisks = await computeBrandRisks(
    membership.organizationId,
    brand.id,
    scoreInputs,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">{brand.name}</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Live CISO view of NIST CSF 2.0 Current vs Target. Scores update whenever the
          organizational profile assessment changes.
        </p>
      </div>

      <ScoreOverview scorecard={scorecard} />
      <FunctionScores
        functions={scorecard.functions}
        assessHref={
          membership.permissions.ASSESSMENT.view
            ? (code) => `/app/brands/${brand.id}/assess?function=${code}`
            : undefined
        }
      />

      <HighestBrandRisks risks={brandRisks} />
      <SoftwareInsightsCards insights={insights} />
    </div>
  );
}
