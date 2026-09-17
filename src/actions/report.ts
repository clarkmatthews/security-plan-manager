"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { hasBrandAccess } from "@/lib/brand-access";
import { toScoreInputs } from "@/lib/catalog";
import { computeScorecard, periodFromForm } from "@/lib/scoring";
import { computeSoftwareInsights } from "@/lib/software-insights";
import { computeBrandRisks } from "@/lib/brand-risks";

export async function publishReportAction(profileId: string, formData: FormData) {
  const membership = await requireMembership();
  if (!membership.permissions.REPORTS.edit) {
    redirect("/app");
  }

  const profile = await prisma.profile.findFirst({
    where: {
      id: profileId,
      organizationId: membership.organizationId,
    },
    include: {
      brand: true,
      assessments: {
        include: {
          evidence: true,
          subcategory: {
            include: {
              category: { include: { function: true } },
            },
          },
        },
      },
    },
  });

  if (!profile) {
    redirect("/app");
  }
  if (!hasBrandAccess(membership, profile.brandId)) {
    redirect("/app");
  }

  const scoreInputs = toScoreInputs(profile.assessments);
  const scorecard = computeScorecard(scoreInputs);
  const [inventoryInsights, brandRisks] = await Promise.all([
    computeSoftwareInsights(membership.organizationId, profile.brandId),
    computeBrandRisks(membership.organizationId, profile.brandId, scoreInputs),
  ]);
  const period = periodFromForm(formData);

  const snapshot = await prisma.$transaction(async (tx) => {
    const created = await tx.reportSnapshot.create({
      data: {
        organizationId: membership.organizationId,
        profileId: profile.id,
        publishedById: membership.userId,
        scoresJson: {
          brandId: profile.brandId,
          brandName: profile.brand.name,
          period,
          publishedAt: new Date().toISOString(),
          scorecard,
          inventoryInsights,
          brandRisks,
        },
      },
    });
    await tx.profile.update({
      where: { id: profile.id },
      data: { status: "PUBLISHED" },
    });
    return created;
  });

  revalidatePath("/app", "layout");
  revalidatePath(`/app/brands/${profile.brandId}`);
  revalidatePath(`/app/brands/${profile.brandId}/publish`);
  revalidatePath(`/app/brands/${profile.brandId}/reports`);
  revalidatePath("/app/reports");
  redirect(`/app/brands/${profile.brandId}/reports/${snapshot.id}`);
}
