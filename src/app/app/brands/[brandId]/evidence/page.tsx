import Link from "next/link";
import { notFound } from "next/navigation";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { SafeExternalLink } from "@/components/safe-external-link";
import { HeadingWithHelp } from "@/components/help-tip";
import { Card } from "@/components/ui";

export default async function EvidencePage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const membership = await requireArea("EVIDENCE", "view");
  requireBrandAccess(membership, brandId);

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, organizationId: membership.organizationId },
  });
  if (!brand) notFound();

  const evidence = await prisma.evidence.findMany({
    where: {
      organizationId: membership.organizationId,
      assessment: { profile: { brandId: brand.id } },
    },
    include: {
      createdBy: { select: { name: true, email: true } },
      assessment: {
        include: {
          subcategory: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/app/brands/${brand.id}`} className="text-sm text-[var(--muted)]">
          ← {brand.name} dashboard
        </Link>
        <HeadingWithHelp className="mt-2 text-3xl font-semibold" topic="evidence">
          Evidence
        </HeadingWithHelp>
        <p className="mt-2 text-[var(--muted)]">
          Files, URLs, and notes linked to CSF subcategory assessments.
        </p>
      </div>
      {evidence.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            No evidence yet. Open the organizational profile and attach a file, URL, or note.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {evidence.map((item) => (
            <Card key={item.id}>
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {item.assessment.subcategory.code}
              </div>
              <h2 className="mt-1 font-medium">{item.title}</h2>
              {item.storedName && membership.permissions.EVIDENCE.view ? (
                <a
                  href={`/api/evidence/${item.id}/file`}
                  className="mt-1 block text-sm text-[var(--accent)] underline"
                >
                  Download {item.fileName ?? "file"}
                </a>
              ) : null}
              {item.url ? (
                <SafeExternalLink
                  href={item.url}
                  className="mt-1 block text-sm text-[var(--accent)] underline"
                >
                  {item.url}
                </SafeExternalLink>
              ) : null}
              {item.notes ? (
                <p className="mt-2 text-sm text-[var(--muted)]">{item.notes}</p>
              ) : null}
              <p className="mt-3 text-xs text-[var(--muted)]">
                {item.createdBy.name ?? item.createdBy.email} ·{" "}
                {item.createdAt.toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
