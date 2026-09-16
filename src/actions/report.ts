"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { hasBrandAccess } from "@/lib/brand-access";
import { computeScorecard } from "@/lib/scoring";
import { toScoreInputs } from "@/lib/catalog";

export async function publishReportAction(profileId: string) {
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

  const scorecard = computeScorecard(toScoreInputs(profile.assessments));

  const snapshot = await prisma.$transaction(async (tx) => {
    const created = await tx.reportSnapshot.create({
      data: {
        organizationId: membership.organizationId,
        profileId: profile.id,
        publishedById: membership.userId,
        scoresJson: {
          brandId: profile.brandId,
          brandName: profile.brand.name,
          period: profile.period,
          publishedAt: new Date().toISOString(),
          scorecard,
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
  revalidatePath("/app/reports");
  redirect(`/app/reports/${snapshot.id}`);
}
