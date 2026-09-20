"use server";

import { CsfTier, Priority, type AssessmentChangeField } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { hasBrandAccess } from "@/lib/brand-access";
import {
  removeEvidenceFiles,
  storeEvidenceFile,
} from "@/lib/evidence-storage";
import { parseSafeHttpUrl } from "@/lib/safe-url";
import { INITIAL_TIER_CHANGE_COMMENT } from "@/lib/scoring";

function commentForTierChange(
  before: CsfTier | null,
  after: CsfTier | null,
  comment?: string | null,
) {
  if (before == null && after != null) return INITIAL_TIER_CHANGE_COMMENT;
  return comment?.trim() || null;
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function parseTier(value: FormDataEntryValue | string | null): CsfTier | null {
  const text = String(value ?? "");
  return (Object.values(CsfTier) as string[]).includes(text)
    ? (text as CsfTier)
    : null;
}

function parsePriority(value: FormDataEntryValue | null): Priority | null {
  const text = String(value ?? "");
  return (Object.values(Priority) as string[]).includes(text)
    ? (text as Priority)
    : null;
}

function revalidateLiveDashboard(brandId: string) {
  revalidatePath("/app", "layout");
  revalidatePath("/app");
  revalidatePath(`/app/brands/${brandId}`);
  revalidatePath(`/app/brands/${brandId}`, "page");
  revalidatePath(`/app/brands/${brandId}/assess`);
  revalidatePath(`/app/brands/${brandId}/assess/history`);
  revalidatePath(`/app/brands/${brandId}/evidence`);
}

async function recordTierChanges(args: {
  organizationId: string;
  assessmentId: string;
  userId: string;
  beforeCurrent: CsfTier | null;
  beforeTarget: CsfTier | null;
  afterCurrent: CsfTier | null;
  afterTarget: CsfTier | null;
  comment?: string | null;
}) {
  const rows: {
    organizationId: string;
    assessmentId: string;
    userId: string;
    field: AssessmentChangeField;
    fromValue: string | null;
    toValue: string | null;
    comment: string | null;
  }[] = [];

  if (args.beforeCurrent !== args.afterCurrent) {
    rows.push({
      organizationId: args.organizationId,
      assessmentId: args.assessmentId,
      userId: args.userId,
      field: "CURRENT_TIER",
      fromValue: args.beforeCurrent,
      toValue: args.afterCurrent,
      comment: commentForTierChange(args.beforeCurrent, args.afterCurrent, args.comment),
    });
  }
  if (args.beforeTarget !== args.afterTarget) {
    rows.push({
      organizationId: args.organizationId,
      assessmentId: args.assessmentId,
      userId: args.userId,
      field: "TARGET_TIER",
      fromValue: args.beforeTarget,
      toValue: args.afterTarget,
      comment: commentForTierChange(args.beforeTarget, args.afterTarget, args.comment),
    });
  }
  if (rows.length > 0) {
    await prisma.assessmentChange.createMany({ data: rows });
  }
}

export type AssessmentState = { error?: string; ok?: boolean } | undefined;

export async function saveAssessmentAction(
  _prev: AssessmentState,
  formData: FormData,
): Promise<AssessmentState> {
  const membership = await requireMembership();
  if (!membership.permissions.ASSESSMENT.edit) {
    return { error: "You do not have permission to edit assessments." };
  }

  const assessmentId = String(formData.get("assessmentId") ?? "");
  if (!assessmentId) {
    return { error: "Missing assessment." };
  }

  const assessment = await prisma.subcategoryAssessment.findFirst({
    where: {
      id: assessmentId,
      organizationId: membership.organizationId,
    },
    include: { profile: true },
  });
  if (!assessment || !hasBrandAccess(membership, assessment.profile.brandId)) {
    return { error: "Assessment not found." };
  }

  const nextCurrent = parseTier(formData.get("currentTier"));
  const nextTarget = parseTier(formData.get("targetTier"));

  await prisma.subcategoryAssessment.update({
    where: { id: assessment.id },
    data: {
      includedInProfile: formData.get("includedInProfile") === "on",
      rationale: optionalString(formData.get("rationale")),
      currentPriority: parsePriority(formData.get("currentPriority")),
      currentStatus: optionalString(formData.get("currentStatus")),
      currentTier: nextCurrent,
      currentPolicies: optionalString(formData.get("currentPolicies")),
      currentPractices: optionalString(formData.get("currentPractices")),
      currentRoles: optionalString(formData.get("currentRoles")),
      currentReferences: optionalString(formData.get("currentReferences")),
      targetPriority: parsePriority(formData.get("targetPriority")),
      targetTier: nextTarget,
      targetPolicies: optionalString(formData.get("targetPolicies")),
      targetPractices: optionalString(formData.get("targetPractices")),
      targetRoles: optionalString(formData.get("targetRoles")),
      targetReferences: optionalString(formData.get("targetReferences")),
      notes: optionalString(formData.get("notes")),
      considerations: optionalString(formData.get("considerations")),
    },
  });

  await recordTierChanges({
    organizationId: membership.organizationId,
    assessmentId: assessment.id,
    userId: membership.userId,
    beforeCurrent: assessment.currentTier,
    beforeTarget: assessment.targetTier,
    afterCurrent: nextCurrent,
    afterTarget: nextTarget,
    comment: optionalString(formData.get("tierChangeComment")),
  });

  revalidateLiveDashboard(assessment.profile.brandId);
  return { ok: true };
}

export async function setIncludedInProfileAction(
  assessmentId: string,
  included: boolean,
): Promise<AssessmentState> {
  const membership = await requireMembership();
  if (!membership.permissions.ASSESSMENT.edit) {
    return { error: "You do not have permission to edit assessments." };
  }

  const assessment = await prisma.subcategoryAssessment.findFirst({
    where: {
      id: assessmentId,
      organizationId: membership.organizationId,
    },
    include: { profile: true },
  });
  if (!assessment || !hasBrandAccess(membership, assessment.profile.brandId)) {
    return { error: "Assessment not found." };
  }

  await prisma.subcategoryAssessment.update({
    where: { id: assessment.id },
    data: { includedInProfile: included },
  });
  revalidateLiveDashboard(assessment.profile.brandId);
  return { ok: true };
}

export async function updateTiersAction(
  assessmentId: string,
  currentTier: string,
  targetTier: string,
  comment?: string,
): Promise<AssessmentState> {
  const membership = await requireMembership();
  if (!membership.permissions.ASSESSMENT.edit) {
    return { error: "You do not have permission to edit assessments." };
  }

  const assessment = await prisma.subcategoryAssessment.findFirst({
    where: {
      id: assessmentId,
      organizationId: membership.organizationId,
    },
    include: { profile: true },
  });
  if (!assessment || !hasBrandAccess(membership, assessment.profile.brandId)) {
    return { error: "Assessment not found." };
  }

  const nextCurrent = parseTier(currentTier);
  const nextTarget = parseTier(targetTier);

  await prisma.subcategoryAssessment.update({
    where: { id: assessment.id },
    data: {
      currentTier: nextCurrent,
      targetTier: nextTarget,
    },
  });

  await recordTierChanges({
    organizationId: membership.organizationId,
    assessmentId: assessment.id,
    userId: membership.userId,
    beforeCurrent: assessment.currentTier,
    beforeTarget: assessment.targetTier,
    afterCurrent: nextCurrent,
    afterTarget: nextTarget,
    comment,
  });

  revalidateLiveDashboard(assessment.profile.brandId);
  return { ok: true };
}

export async function addEvidenceAction(
  _prev: AssessmentState,
  formData: FormData,
): Promise<AssessmentState> {
  const membership = await requireMembership();
  if (!membership.permissions.EVIDENCE.edit) {
    return { error: "You do not have permission to add evidence." };
  }

  const assessmentId = String(formData.get("assessmentId") ?? "");
  const fileValue = formData.get("file");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  const title =
    String(formData.get("title") ?? "").trim() || (file ? file.name : "");
  const rawUrl = optionalString(formData.get("url"));
  const notes = optionalString(formData.get("notes"));
  if (!assessmentId || !title) {
    return { error: "Evidence title is required." };
  }
  if (rawUrl && !parseSafeHttpUrl(rawUrl)) {
    return { error: "Evidence URL must start with http:// or https://." };
  }
  const url = rawUrl ? parseSafeHttpUrl(rawUrl) : null;
  if (!file && !url && !notes) {
    return { error: "Add a file, URL, or note." };
  }

  const assessment = await prisma.subcategoryAssessment.findFirst({
    where: {
      id: assessmentId,
      organizationId: membership.organizationId,
    },
    include: { profile: true },
  });
  if (!assessment || !hasBrandAccess(membership, assessment.profile.brandId)) {
    return { error: "Assessment not found." };
  }

  const evidence = await prisma.evidence.create({
    data: {
      organizationId: membership.organizationId,
      assessmentId: assessment.id,
      title,
      url,
      notes,
      createdById: membership.userId,
    },
  });

  if (file) {
    try {
      const stored = await storeEvidenceFile({
        organizationId: membership.organizationId,
        evidenceId: evidence.id,
        file,
      });
      await prisma.evidence.update({
        where: { id: evidence.id },
        data: stored,
      });
    } catch (error) {
      await prisma.evidence.delete({ where: { id: evidence.id } });
      return {
        error: error instanceof Error ? error.message : "Could not store file.",
      };
    }
  }

  revalidateLiveDashboard(assessment.profile.brandId);
  return { ok: true };
}

export async function deleteEvidenceAction(evidenceId: string): Promise<AssessmentState> {
  const membership = await requireMembership();
  if (!membership.permissions.EVIDENCE.edit) {
    return { error: "You do not have permission to delete evidence." };
  }

  const evidence = await prisma.evidence.findFirst({
    where: {
      id: evidenceId,
      organizationId: membership.organizationId,
    },
    include: { assessment: { include: { profile: true } } },
  });
  if (!evidence || !hasBrandAccess(membership, evidence.assessment.profile.brandId)) {
    return { error: "Evidence not found." };
  }

  await removeEvidenceFiles(evidence.organizationId, evidence.id);
  await prisma.evidence.delete({ where: { id: evidence.id } });
  revalidateLiveDashboard(evidence.assessment.profile.brandId);
  return { ok: true };
}
