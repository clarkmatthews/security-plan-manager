import Link from "next/link";
import { notFound } from "next/navigation";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { FunctionScores, HighestBrandRisks, LargestGaps, ScoreOverview } from "@/components/score-overview";
import { HeadingWithHelp } from "@/components/help-tip";
import { SoftwareInsightsCards } from "@/components/software-insights";
import { formatPeriodLabel } from "@/lib/scoring";
import { parseFrozenSnapshot } from "@/lib/snapshot";

export default async function BrandReportSnapshotPage({
  params,
}: {
  params: Promise<{ brandId: string; snapshotId: string }>;
}) {
  const { brandId, snapshotId } = await params;
  const membership = await requireArea("REPORTS", "view");
  requireBrandAccess(membership, brandId);

  const snapshot = await prisma.reportSnapshot.findFirst({
    where: {
      id: snapshotId,
      organizationId: membership.organizationId,
      profile: { brandId },
    },
    include: {
      profile: {
        include: {
          brand: true,
        },
      },
      publishedBy: { select: { name: true, email: true } },
    },
  });
  if (!snapshot) notFound();

  const frozen = parseFrozenSnapshot(snapshot.scoresJson, snapshot.profile.period);
  if (!frozen) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/app/brands/${brandId}/reports`}
          className="text-sm text-[var(--muted)]"
        >
          ← {snapshot.profile.brand.name} reports
        </Link>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {frozen.brandName ?? snapshot.profile.brand.name} · {formatPeriodLabel(frozen.period)} ·
          published {snapshot.publishedAt.toLocaleString()}
        </p>
        <HeadingWithHelp className="text-3xl font-semibold" topic="boardScorecard">
          Board scorecard
        </HeadingWithHelp>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Frozen point-in-time copy of the live dashboard at publish. Later assessment
          changes do not update this report.
        </p>
      </div>
      <ScoreOverview scorecard={frozen.scorecard} />
      <FunctionScores functions={frozen.scorecard.functions} showDescriptions />
      {frozen.brandRisks ? (
        <HighestBrandRisks
          risks={frozen.brandRisks}
          emptyText="No brand risks were recorded at publish."
        />
      ) : (
        <LargestGaps
          gaps={frozen.scorecard.topGaps ?? []}
          emptyText="No target gaps were recorded at publish."
        />
      )}
      {frozen.inventoryInsights ? (
        <SoftwareInsightsCards insights={frozen.inventoryInsights} />
      ) : null}
    </div>
  );
}
