"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { matchSoftwareAsset } from "@/lib/cve-match";
import { isSoftwareCategory } from "@/lib/software";
import { parseSoftwareCsv, planSoftwareImport } from "@/lib/software-csv";

export type SoftwareState = { error?: string; ok?: boolean } | undefined;

const softwareSchema = z.object({
  productName: z.string().trim().min(1, "Product name is required"),
  companyName: z.string().trim().min(1, "Company name is required"),
  version: z.string().trim().min(1, "Version is required"),
  category: z.string().refine(isSoftwareCategory, "Choose a category"),
  notes: z.string().trim().optional(),
});

function formValues(formData: FormData) {
  return softwareSchema.safeParse({
    productName: formData.get("productName"),
    companyName: formData.get("companyName"),
    version: formData.get("version"),
    category: formData.get("category"),
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
}

function refreshSoftware(brandId: string) {
  revalidatePath("/app", "layout");
  revalidatePath(`/app/brands/${brandId}`);
  revalidatePath(`/app/brands/${brandId}/software`);
  revalidatePath(`/app/brands/${brandId}/software/cves`);
  revalidatePath(`/app/brands/${brandId}/software/alerts`);
}

export async function createSoftwareAction(
  brandId: string,
  _prev: SoftwareState,
  formData: FormData,
): Promise<SoftwareState> {
  const membership = await requireArea("SOFTWARE", "edit");
  requireBrandAccess(membership, brandId);

  const parsed = formValues(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid software details." };
  }

  const asset = await prisma.softwareAsset.create({
    data: {
      organizationId: membership.organizationId,
      brandId,
      createdById: membership.userId,
      productName: parsed.data.productName,
      companyName: parsed.data.companyName,
      version: parsed.data.version,
      category: parsed.data.category,
      notes: parsed.data.notes,
    },
  });

  await matchSoftwareAsset(asset.id);
  refreshSoftware(brandId);
  return { ok: true };
}

export async function updateSoftwareAction(
  brandId: string,
  softwareId: string,
  _prev: SoftwareState,
  formData: FormData,
): Promise<SoftwareState> {
  const membership = await requireArea("SOFTWARE", "edit");
  requireBrandAccess(membership, brandId);

  const parsed = formValues(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid software details." };
  }

  const existing = await prisma.softwareAsset.findFirst({
    where: { id: softwareId, brandId, organizationId: membership.organizationId },
  });
  if (!existing) {
    return { error: "Software was not found." };
  }

  const renamed =
    existing.productName !== parsed.data.productName && !existing.archivedAt;

  await prisma.softwareAsset.update({
    where: { id: existing.id },
    data: {
      productName: parsed.data.productName,
      companyName: parsed.data.companyName,
      version: parsed.data.version,
      category: parsed.data.category,
      notes: parsed.data.notes,
    },
  });

  if (renamed) {
    await matchSoftwareAsset(existing.id);
  }
  refreshSoftware(brandId);
  return { ok: true };
}

export async function archiveSoftwareAction(brandId: string, softwareId: string) {
  const membership = await requireArea("SOFTWARE", "edit");
  requireBrandAccess(membership, brandId);
  await prisma.softwareAsset.updateMany({
    where: {
      id: softwareId,
      brandId,
      organizationId: membership.organizationId,
      archivedAt: null,
    },
    data: { archivedAt: new Date() },
  });
  refreshSoftware(brandId);
}

export type SoftwareImportState =
  | { error?: string; added?: number; updated?: number; archived?: number }
  | undefined;

const IMPORT_MAX_BYTES = 2_000_000;

export async function importSoftwareAction(
  brandId: string,
  _prev: SoftwareImportState,
  formData: FormData,
): Promise<SoftwareImportState> {
  const membership = await requireArea("SOFTWARE", "edit");
  requireBrandAccess(membership, brandId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV template to upload." };
  }
  if (file.size > IMPORT_MAX_BYTES) {
    return { error: "The file is too large. Use a CSV under 2 MB." };
  }

  const parsed = parseSoftwareCsv(await file.text());
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const existing = await prisma.softwareAsset.findMany({
    where: { brandId, organizationId: membership.organizationId },
    select: {
      id: true,
      productName: true,
      companyName: true,
      version: true,
      category: true,
      notes: true,
      archivedAt: true,
    },
  });
  const plan = planSoftwareImport(existing, parsed.rows);
  if ("error" in plan) {
    return { error: plan.error };
  }

  const rematchIds: string[] = [];
  await prisma.$transaction(async (tx) => {
    for (const row of plan.updates) {
      await tx.softwareAsset.update({
        where: { id: row.id },
        data: {
          productName: row.productName,
          companyName: row.companyName,
          version: row.version,
          category: row.category,
          notes: row.notes ?? null,
          archivedAt: row.restore ? null : undefined,
        },
      });
      if (row.restore || row.rematch) rematchIds.push(row.id);
    }
    for (const row of plan.creates) {
      const created = await tx.softwareAsset.create({
        data: {
          organizationId: membership.organizationId,
          brandId,
          createdById: membership.userId,
          productName: row.productName,
          companyName: row.companyName,
          version: row.version,
          category: row.category,
          notes: row.notes,
        },
      });
      rematchIds.push(created.id);
    }
    if (plan.archives.length > 0) {
      await tx.softwareAsset.updateMany({
        where: {
          id: { in: plan.archives },
          brandId,
          organizationId: membership.organizationId,
          archivedAt: null,
        },
        data: { archivedAt: new Date() },
      });
    }
  });

  for (const id of rematchIds) {
    await matchSoftwareAsset(id);
  }
  refreshSoftware(brandId);
  return {
    added: plan.creates.length,
    updated: plan.updates.length,
    archived: plan.archives.length,
  };
}

export async function unarchiveSoftwareAction(brandId: string, softwareId: string) {
  const membership = await requireArea("SOFTWARE", "edit");
  requireBrandAccess(membership, brandId);
  const result = await prisma.softwareAsset.updateMany({
    where: {
      id: softwareId,
      brandId,
      organizationId: membership.organizationId,
      archivedAt: { not: null },
    },
    data: { archivedAt: null },
  });
  if (result.count > 0) {
    await matchSoftwareAsset(softwareId);
  }
  refreshSoftware(brandId);
}
