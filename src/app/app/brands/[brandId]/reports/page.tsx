import Link from "next/link";
import { notFound } from "next/navigation";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { hasAccess } from "@/lib/rbac";
import { formatPeriodLabel, formatScore } from "@/lib/scoring";
import { parseFrozenSnapshot } from "@/lib/snapshot";
import { Card } from "@/components/ui";

export default async function BrandReportsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const membership = await requireArea("REPORTS", "view");
  requireBrandAccess(membership, brandId);

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, organizationId: membership.organizationId },
    select: { id: true, name: true },
  });
  if (!brand) notFound();

  const snapshots = await prisma.reportSnapshot.findMany({
    where: {
      organizationId: membership.organizationId,
      profile: { brandId: brand.id },
    },
    include: {
      profile: { select: { period: true } },
      publishedBy: { select: { name: true, email: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  const canSeeDashboard = hasAccess(membership.permissions, "PROGRAM", "view");
  const canPublish = hasAccess(membership.permissions, "REPORTS", "edit");

  return (
    <div className="space-y-6">
      <div>
        {canSeeDashboard ? (
          <Link
            href={`/app/brands/${brand.id}`}
            prefetch={false}
            className="text-sm text-[var(--muted)]"
          >
            ← {brand.name} dashboard
          </Link>
        ) : null}
        <h1 className={`${canSeeDashboard ? "mt-2" : ""} text-3xl font-semibold`}>
          {brand.name} reports
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Published snapshots are frozen copies of the {brand.name} dashboard. Assessment
          changes after publish stay on the working profile only.
        </p>
      </div>
      {snapshots.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            No snapshots yet for {brand.name}.
            {canPublish ? (
              <>
                {" "}
                <Link
                  href={`/app/brands/${brand.id}/publish`}
                  className="text-[var(--foreground)] underline-offset-2 hover:underline"
                >
                  Publish a board snapshot
                </Link>
                .
              </>
            ) : (
              " A CISO or owner can publish one from this brand."
            )}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {snapshots.map((snapshot) => {
            const frozen = parseFrozenSnapshot(snapshot.scoresJson, snapshot.profile.period);
            return (
              <Link
                key={snapshot.id}
                href={`/app/brands/${brand.id}/reports/${snapshot.id}`}
              >
                <Card className="h-full transition hover:border-[var(--accent)]">
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    {formatPeriodLabel(frozen?.period ?? snapshot.profile.period)}
                  </div>
                  <h2 className="mt-1 text-xl font-medium">
                    Current {formatScore(frozen?.scorecard.overallCurrent ?? null)} · Target{" "}
                    {formatScore(frozen?.scorecard.overallTarget ?? null)}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Published {snapshot.publishedAt.toLocaleString()} by{" "}
                    {snapshot.publishedBy.name ?? snapshot.publishedBy.email}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
