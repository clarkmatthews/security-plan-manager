"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/auth-guard";
import { hasBrandAccess } from "@/lib/brand-access";
import { compareByCatalog } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

function revalidatePriorities(brandId: string) {
  revalidatePath("/app", "layout");
  revalidatePath(`/app/brands/${brandId}`);
  revalidatePath(`/app/brands/${brandId}`, "page");
}

async function requireProgramEditor(brandId: string) {
  const membership = await requireMembership();
  if (!membership.permissions.PROGRAM.edit || !hasBrandAccess(membership, brandId)) {
    redirect("/app");
  }
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, organizationId: membership.organizationId },
    select: { id: true },
  });
  if (!brand) {
    redirect("/app");
  }
  return membership;
}

async function reindexPriorities(tx: Prisma.TransactionClient, brandId: string) {
  const remaining = await tx.brandOutcomePriority.findMany({
    where: { brandId },
    orderBy: { sortOrder: "asc" },
  });
  await Promise.all(
    remaining.map((row, index) =>
      row.sortOrder === index
        ? Promise.resolve()
        : tx.brandOutcomePriority.update({
            where: { id: row.id },
            data: { sortOrder: index },
          }),
    ),
  );
}

export async function addBrandPrioritiesAction(
  brandId: string,
  subcategoryIds: string[],
) {
  await requireProgramEditor(brandId);
  const uniqueIds = [...new Set(subcategoryIds.filter((id) => id.trim().length > 0))];
  if (uniqueIds.length === 0) return;

  const catalog = await prisma.csfSubcategory.findMany({
    where: { id: { in: uniqueIds } },
    include: { category: { include: { function: true } } },
  });
  if (catalog.length !== uniqueIds.length) {
    redirect("/app");
  }
  const ordered = catalog
    .map((row) => ({ subcategory: row }))
    .sort(compareByCatalog)
    .map(({ subcategory }) => subcategory);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.brandOutcomePriority.findMany({
      where: { brandId },
      select: { subcategoryId: true },
    });
    const already = new Set(existing.map((row) => row.subcategoryId));
    const toAdd = ordered.filter((row) => !already.has(row.id));
    if (toAdd.length === 0) return;
    await tx.brandOutcomePriority.createMany({
      data: toAdd.map((row, index) => ({
        brandId,
        subcategoryId: row.id,
        sortOrder: existing.length + index,
      })),
    });
  });

  revalidatePriorities(brandId);
}

export async function removeBrandPriorityAction(brandId: string, subcategoryId: string) {
  await requireProgramEditor(brandId);
  await prisma.$transaction(async (tx) => {
    await tx.brandOutcomePriority.deleteMany({
      where: { brandId, subcategoryId },
    });
    await reindexPriorities(tx, brandId);
  });
  revalidatePriorities(brandId);
}

export async function moveBrandPriorityAction(
  brandId: string,
  subcategoryId: string,
  direction: "up" | "down",
) {
  await requireProgramEditor(brandId);
  await prisma.$transaction(async (tx) => {
    const rows = await tx.brandOutcomePriority.findMany({
      where: { brandId },
      orderBy: { sortOrder: "asc" },
    });
    const index = rows.findIndex((row) => row.subcategoryId === subcategoryId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= rows.length) return;
    const current = rows[index];
    const other = rows[swapWith];
    await tx.brandOutcomePriority.update({
      where: { id: current.id },
      data: { sortOrder: other.sortOrder },
    });
    await tx.brandOutcomePriority.update({
      where: { id: other.id },
      data: { sortOrder: current.sortOrder },
    });
    await reindexPriorities(tx, brandId);
  });
  revalidatePriorities(brandId);
}
