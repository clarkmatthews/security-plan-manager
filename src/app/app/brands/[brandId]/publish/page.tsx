import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { currentPeriod } from "@/lib/scoring";
import { HeadingWithHelp } from "@/components/help-tip";
import { Card } from "@/components/ui";
import { PublishReportForm } from "@/components/publish-report-form";

export default async function PublishSnapshotPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  await connection();
  const membership = await requireArea("REPORTS", "edit");
  requireBrandAccess(membership, brandId);

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, organizationId: membership.organizationId },
    include: {
      profiles: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!brand || !brand.profiles[0]) {
    notFound();
  }

  const profile = brand.profiles[0];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/app/brands/${brand.id}`} prefetch={false} className="text-sm text-[var(--muted)]">
          ← {brand.name} dashboard
        </Link>
        <HeadingWithHelp className="mt-2 text-3xl font-semibold" topic="publish">
          Publish board snapshot
        </HeadingWithHelp>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Choose the year and quarter this report represents, then save a frozen copy of
          the live {brand.name} dashboard for the board.
        </p>
      </div>

      <Card className="max-w-md">
        <PublishReportForm profileId={profile.id} period={currentPeriod()} />
      </Card>
    </div>
  );
}
