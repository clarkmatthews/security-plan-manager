import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { computeScorecard } from "@/lib/scoring";
import { toScoreInputs } from "@/lib/catalog";
import { FunctionScores, HighestBrandRisks, ScoreOverview } from "@/components/score-overview";
import { HeadingWithHelp } from "@/components/help-tip";
import { BrandPriorities } from "@/components/priorities-widget";
import { SoftwareInsightsCards } from "@/components/software-insights";
import { computeSoftwareInsights } from "@/lib/software-insights";
import { computeBrandRisks } from "@/lib/brand-risks";
import { toPriorityItems } from "@/lib/priorities";
import { listOutcomeCatalog } from "@/lib/priority-catalog";

export default async function BrandDashboardPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  await connection();
  const membership = await requireArea("PROGRAM", "view");
  requireBrandAccess(membership, brandId);

  const [brand, insights, catalog] = await Promise.all([
    prisma.brand.findFirst({
      where: { id: brandId, organizationId: membership.organizationId },
      include: {
        outcomePriorities: {
          orderBy: { sortOrder: "asc" },
          include: {
            subcategory: {
              include: { category: { include: { function: true } } },
            },
          },
        },
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
    membership.permissions.PROGRAM.edit ? listOutcomeCatalog() : Promise.resolve([]),
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
  const priorities = toPriorityItems(brand.outcomePriorities, profile.assessments);

  return (
    <div className="space-y-8">
      <div>
        <HeadingWithHelp className="text-3xl font-semibold" topic="brandDashboard">
          {brand.name}
        </HeadingWithHelp>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Live CISO view of NIST CSF 2.0 Current vs Target. Scores update whenever the
          organizational profile assessment changes.
        </p>
      </div>

      <ScoreOverview
        scorecard={scorecard}
        excludedHref={
          membership.permissions.ASSESSMENT.view
            ? `/app/brands/${brand.id}/assess?scope=excluded`
            : undefined
        }
      />
      <FunctionScores
        functions={scorecard.functions}
        assessBasePath={
          membership.permissions.ASSESSMENT.view
            ? `/app/brands/${brand.id}/assess`
            : undefined
        }
      />

      <BrandPriorities
        brandId={brand.id}
        items={priorities}
        catalog={catalog}
        canEdit={membership.permissions.PROGRAM.edit}
        canViewAssessment={membership.permissions.ASSESSMENT.view}
      />

      <HighestBrandRisks risks={brandRisks} />
      <SoftwareInsightsCards insights={insights} />
    </div>
  );
}
