import Link from "next/link";
import { notFound } from "next/navigation";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatTierValue } from "@/lib/scoring";
import { HeadingWithHelp } from "@/components/help-tip";
import { Card } from "@/components/ui";

const FIELD_LABEL = {
  CURRENT_TIER: "Current",
  TARGET_TIER: "Target",
} as const;

export default async function AssessmentHistoryPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const membership = await requireArea("HISTORY", "view");
  requireBrandAccess(membership, brandId);

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, organizationId: membership.organizationId },
    include: {
      profiles: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, period: true },
      },
    },
  });
  if (!brand?.profiles[0]) notFound();

  const profile = brand.profiles[0];
  const changes = await prisma.assessmentChange.findMany({
    where: {
      organizationId: membership.organizationId,
      assessment: { profileId: profile.id },
    },
    include: {
      user: { select: { name: true, email: true } },
      assessment: {
        include: {
          subcategory: {
            select: {
              code: true,
              description: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/brands/${brand.id}/assess`}
          prefetch={false}
          className="text-sm text-[var(--muted)]"
        >
          ← Organizational profile
        </Link>
        <HeadingWithHelp className="mt-2 text-3xl font-semibold" topic="history">
          Assessment history
        </HeadingWithHelp>
        <p className="mt-2 text-[var(--muted)]">
          {brand.name} · comments captured when Current or Target
          changes
        </p>
      </div>

      {changes.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            No Current or Target changes have been recorded yet.
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3">Comment</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((change) => (
                <tr key={change.id} className="border-t border-[var(--border)] align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--muted)]">
                    {change.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {change.user.name ?? change.user.email}
                    {change.user.name ? (
                      <div className="text-xs text-[var(--muted)]">{change.user.email}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{change.assessment.subcategory.code}</div>
                    <div className="line-clamp-2 text-[var(--muted)]">
                      {change.assessment.subcategory.description}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{FIELD_LABEL[change.field]}</div>
                    <div className="text-[var(--muted)]">
                      {formatTierValue(change.fromValue)} → {formatTierValue(change.toValue)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {change.comment ? (
                      change.comment
                    ) : (
                      <span className="text-[var(--muted)]">No comment</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
