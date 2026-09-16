import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { publishReportAction } from "@/actions/report";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { computeScorecard, functionLabel, TIER_LABEL } from "@/lib/scoring";
import { toScoreInputs } from "@/lib/catalog";
import { FunctionScores, ScoreOverview } from "@/components/score-overview";
import { Button, Card } from "@/components/ui";

export default async function BrandDashboardPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  await connection();
  const membership = await requireArea("PROGRAM", "view");
  requireBrandAccess(membership, brandId);

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, organizationId: membership.organizationId },
    include: {
      profiles: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          snapshots: { orderBy: { publishedAt: "desc" }, take: 1 },
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
  });

  if (!brand || !brand.profiles[0]) {
    notFound();
  }

  const profile = brand.profiles[0];
  const scorecard = computeScorecard(toScoreInputs(profile.assessments));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">{profile.period} · {profile.status}</p>
          <h1 className="text-3xl font-semibold">{brand.name}</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Live CSO view of NIST CSF 2.0 Current vs Target. Scores refresh when you change
            tiers on the organizational profile.
          </p>
        </div>
        <div className="flex gap-3">
          {membership.permissions.ASSESSMENT.view ? (
            <Link href={`/app/brands/${brand.id}/assess`} prefetch={false}>
              <Button variant="secondary">Open assessment</Button>
            </Link>
          ) : null}
          {membership.permissions.EVIDENCE.view ? (
            <Link href={`/app/brands/${brand.id}/evidence`}>
              <Button variant="ghost">Evidence</Button>
            </Link>
          ) : null}
          {membership.permissions.REPORTS.edit ? (
            <form action={publishReportAction.bind(null, profile.id)}>
              <Button type="submit">Publish board snapshot</Button>
            </form>
          ) : null}
        </div>
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

      <Card>
        <h2 className="text-lg font-medium">Largest gaps</h2>
        <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
          Target tier minus current tier for in-scope outcomes.
        </p>
        {scorecard.topGaps.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No target gaps yet. Set target tiers in the assessment catalog.</p>
        ) : (
          <ul className="space-y-3">
            {scorecard.topGaps.map((gap) => (
              <li key={gap.subcategoryCode} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <div className="font-medium">
                    {gap.subcategoryCode} · {functionLabel(gap.functionCode)}
                  </div>
                  <div className="text-[var(--muted)]">{gap.subcategoryDescription}</div>
                </div>
                <div className="shrink-0 text-right text-[var(--muted)]">
                  {gap.currentTier ? TIER_LABEL[gap.currentTier] : "Unscored"} →{" "}
                  {gap.targetTier ? TIER_LABEL[gap.targetTier] : "—"}
                  <div className="text-[var(--foreground)]">Gap {gap.gap}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
