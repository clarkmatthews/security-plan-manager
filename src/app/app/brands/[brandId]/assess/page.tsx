import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { compareByCatalog } from "@/lib/catalog";
import { isFunctionCode } from "@/lib/scoring";
import { AssessmentNavigator } from "@/components/assessment-navigator";

export default async function AssessPage({
  params,
  searchParams,
}: {
  params: Promise<{ brandId: string }>;
  searchParams: Promise<{ function?: string }>;
}) {
  const { brandId } = await params;
  const { function: functionParam } = await searchParams;
  const membership = await requireArea("ASSESSMENT", "view");
  requireBrandAccess(membership, brandId);

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, organizationId: membership.organizationId },
    include: {
      profiles: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          assessments: {
            include: {
              evidence: true,
              changes: {
                include: { user: { select: { name: true, email: true } } },
                orderBy: { createdAt: "desc" },
              },
              subcategory: {
                include: { category: { include: { function: true } } },
              },
            },
            orderBy: [
              { subcategory: { category: { function: { sortOrder: "asc" } } } },
              { subcategory: { category: { sortOrder: "asc" } } },
              { subcategory: { sortOrder: "asc" } },
              { subcategory: { code: "asc" } },
            ],
          },
        },
      },
    },
  });
  if (!brand?.profiles[0]) notFound();

  const profile = brand.profiles[0];
  const assessments = profile.assessments
    .slice()
    .sort(compareByCatalog)
    .map((assessment) => ({
      id: assessment.id,
      includedInProfile: assessment.includedInProfile,
      rationale: assessment.rationale,
      currentPriority: assessment.currentPriority,
      currentStatus: assessment.currentStatus,
      currentTier: assessment.currentTier,
      currentPolicies: assessment.currentPolicies,
      currentPractices: assessment.currentPractices,
      currentRoles: assessment.currentRoles,
      currentReferences: assessment.currentReferences,
      targetPriority: assessment.targetPriority,
      targetTier: assessment.targetTier,
      targetPolicies: assessment.targetPolicies,
      targetPractices: assessment.targetPractices,
      targetRoles: assessment.targetRoles,
      targetReferences: assessment.targetReferences,
      notes: assessment.notes,
      considerations: assessment.considerations,
      evidence: assessment.evidence.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        notes: item.notes,
        fileName: item.fileName,
        storedName: item.storedName,
      })),
      changes: assessment.changes.map((change) => ({
        id: change.id,
        field: change.field,
        fromValue: change.fromValue,
        toValue: change.toValue,
        comment: change.comment,
        createdAt: change.createdAt.toISOString(),
        userName: change.user.name ?? change.user.email,
        userEmail: change.user.email,
      })),
      subcategory: {
        code: assessment.subcategory.code,
        description: assessment.subcategory.description,
        category: {
          code: assessment.subcategory.category.code,
          name: assessment.subcategory.category.name,
          description: assessment.subcategory.category.description,
          function: {
            code: assessment.subcategory.category.function.code,
            name: assessment.subcategory.category.function.name,
            description: assessment.subcategory.category.function.description,
          },
        },
      },
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href={`/app/brands/${brand.id}`} prefetch={false} className="text-sm text-[var(--muted)]">
            ← {brand.name} dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">Organizational profile</h1>
          <p className="mt-2 text-[var(--muted)]">
            {assessments.length} CSF 2.0 outcomes
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {membership.permissions.HISTORY.view ? (
            <Link
              href={`/app/brands/${brand.id}/assess/history`}
              className="inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--surface-3)]"
            >
              History
            </Link>
          ) : null}
          {membership.permissions.EVIDENCE.view ? (
            <Link
              href={`/app/brands/${brand.id}/evidence`}
              className="inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--surface-3)]"
            >
              Evidence locker
            </Link>
          ) : null}
        </div>
      </div>
      <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading catalog…</p>}>
        <AssessmentNavigator
          assessments={assessments}
          canEdit={membership.permissions.ASSESSMENT.edit}
          canView={membership.permissions.ASSESSMENT.view}
          canEditEvidence={membership.permissions.EVIDENCE.edit}
          initialFunction={isFunctionCode(functionParam) ? functionParam : "ALL"}
        />
      </Suspense>
    </div>
  );
}
