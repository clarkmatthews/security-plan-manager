import Link from "next/link";
import { requireArea } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { hasBrandAccess } from "@/lib/brand-access";
import { computeScorecard, formatScore } from "@/lib/scoring";
import { toScoreInputs } from "@/lib/catalog";
import { Card } from "@/components/ui";

export default async function ReportsPage() {
  const membership = await requireArea("REPORTS", "view");
  const snapshots = await prisma.reportSnapshot.findMany({
    where: { organizationId: membership.organizationId },
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
    orderBy: { publishedAt: "desc" },
  });
  const visible = snapshots.filter((snapshot) =>
    hasBrandAccess(membership, snapshot.profile.brandId),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Board reports</h1>
        <p className="mt-2 text-[var(--muted)]">
          Current and Target scores are live from the organizational profile. Publish saves a
          dated checkpoint.
        </p>
      </div>
      {visible.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            No snapshots yet. A CSO or owner can publish one from a brand dashboard.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((snapshot) => {
            const live = computeScorecard(toScoreInputs(snapshot.profile.assessments));
            return (
              <Link key={snapshot.id} href={`/app/reports/${snapshot.id}`}>
                <Card className="h-full transition hover:border-[var(--accent)]">
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    {snapshot.profile.brand.name} · {snapshot.profile.period}
                  </div>
                  <h2 className="mt-1 text-xl font-medium">
                    Current {formatScore(live.overallCurrent)} · Target{" "}
                    {formatScore(live.overallTarget)}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Checkpoint {snapshot.publishedAt.toLocaleString()} by{" "}
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
