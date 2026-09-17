import { notFound, redirect } from "next/navigation";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export default async function LegacyReportSnapshotPage({
  params,
}: {
  params: Promise<{ snapshotId: string }>;
}) {
  const { snapshotId } = await params;
  const membership = await requireArea("REPORTS", "view");
  const snapshot = await prisma.reportSnapshot.findFirst({
    where: { id: snapshotId, organizationId: membership.organizationId },
    select: { profile: { select: { brandId: true } } },
  });
  if (!snapshot) notFound();
  requireBrandAccess(membership, snapshot.profile.brandId);
  redirect(`/app/brands/${snapshot.profile.brandId}/reports/${snapshotId}`);
}
