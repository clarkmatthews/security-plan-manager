import Link from "next/link";
import { notFound } from "next/navigation";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { SoftwareInventory } from "@/components/software-inventory";

export default async function SoftwareInventoryPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const membership = await requireArea("SOFTWARE", "view");
  requireBrandAccess(membership, brandId);

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, organizationId: membership.organizationId },
  });
  if (!brand) notFound();

  const assets = await prisma.softwareAsset.findMany({
    where: { brandId: brand.id, organizationId: membership.organizationId },
    orderBy: [{ archivedAt: "asc" }, { productName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/app/brands/${brand.id}`} prefetch={false} className="text-sm text-[var(--muted)]">
            ← {brand.name} dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">Software inventory</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Applications used by {brand.name}. Active products are matched against newly
            ingested CVEs by product name. Archived software stays in history but is not
            matched going forward.
          </p>
        </div>
        <Link
          href={`/app/brands/${brand.id}/software/cves`}
          className="inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--surface-3)]"
        >
          CVE history
        </Link>
      </div>

      <SoftwareInventory
        brandId={brand.id}
        canEdit={membership.permissions.SOFTWARE.edit}
        items={assets.map((item) => ({
          id: item.id,
          productName: item.productName,
          companyName: item.companyName,
          version: item.version,
          category: item.category,
          notes: item.notes,
          archivedAt: item.archivedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
