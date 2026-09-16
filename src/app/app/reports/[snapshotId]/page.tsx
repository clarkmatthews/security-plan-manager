import Link from "next/link";
import { notFound } from "next/navigation";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { FunctionScores, ScoreOverview } from "@/components/score-overview";
import { Card } from "@/components/ui";
import { computeScorecard, functionLabel, TIER_LABEL } from "@/lib/scoring";
import { toScoreInputs } from "@/lib/catalog";

export default async function ReportSnapshotPage({
  params,
}: {
  params: Promise<{ snapshotId: string }>;
}) {
  const { snapshotId } = await params;
  const membership = await requireArea("REPORTS", "view");
  const snapshot = await prisma.reportSnapshot.findFirst({
    where: { id: snapshotId, organizationId: membership.organizationId },
    include: {
      profile: {
        include: {
          brand: true,
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
      publishedBy: { select: { name: true, email: true } },
    },
  });
  if (!snapshot) notFound();
  requireBrandAccess(membership, snapshot.profile.brandId);

  const scorecard = computeScorecard(toScoreInputs(snapshot.profile.assessments));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app/reports" className="text-sm text-[var(--muted)]">
          ← All reports
        </Link>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {snapshot.profile.brand.name} · {snapshot.profile.period} · last published{" "}
          {snapshot.publishedAt.toLocaleString()}
        </p>
        <h1 className="text-3xl font-semibold">Board scorecard</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Live Current vs Target from the organizational profile. Changing tiers on the
          profile updates these scores immediately.
        </p>
      </div>
      <ScoreOverview scorecard={scorecard} />
      <FunctionScores functions={scorecard.functions} />
      <Card>
        <h2 className="text-lg font-medium">Largest gaps</h2>
        {scorecard.topGaps.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">No target gaps were recorded.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {scorecard.topGaps.map((gap) => (
              <li key={gap.subcategoryCode} className="flex justify-between gap-4 text-sm">
                <div>
                  <div className="font-medium">
                    {gap.subcategoryCode} · {functionLabel(gap.functionCode)}
                  </div>
                  <div className="text-[var(--muted)]">{gap.subcategoryDescription}</div>
                </div>
                <div className="text-right text-[var(--muted)]">
                  {gap.currentTier ? TIER_LABEL[gap.currentTier] : "Unscored"} →{" "}
                  {gap.targetTier ? TIER_LABEL[gap.targetTier] : "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
