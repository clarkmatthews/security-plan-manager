"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireArea } from "@/lib/auth-guard";
import {
  clampInviteExpiryDays,
  getAppConfig,
  INVITE_EXPIRY_DAYS_MAX,
  INVITE_EXPIRY_DAYS_MIN,
} from "@/lib/app-config";
import { clampCveRetentionDays, clampCveSyncIntervalHours } from "@/lib/cve-constants";
import { sendAppEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/secret-box";
import { syncCveMetrics } from "@/lib/cve-metrics";

export type ConfigState = { error?: string; ok?: boolean } | undefined;
export type ConfigTestEmailState =
  | { error?: string; ok?: boolean }
  | undefined;
export type ConfigCveMetricsSyncState =
  | { error?: string; ok?: boolean; yearCount?: number }
  | undefined;

const optionalText = z
  .string()
  .trim()
  .max(255)
  .optional()
  .or(z.literal(""));

const saveSchema = z.object({
  smtpHost: optionalText,
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpSecure: z.enum(["0", "1"]),
  smtpUser: optionalText,
  smtpPassword: z.string().max(500).optional(),
  smtpFromName: optionalText,
  smtpFromEmail: z
    .string()
    .trim()
    .max(255)
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Enter a valid from address.",
    }),
  cveRetentionDays: z.coerce.number(),
  cveSyncIntervalHours: z.coerce.number(),
  inviteExpiryDays: z.coerce.number(),
});

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export async function saveAppConfigAction(
  _prev: ConfigState,
  formData: FormData,
): Promise<ConfigState> {
  await requireArea("CONFIG", "edit");

  const parsed = saveSchema.safeParse({
    smtpHost: String(formData.get("smtpHost") ?? ""),
    smtpPort: formData.get("smtpPort"),
    smtpSecure: String(formData.get("smtpSecure") ?? "0") === "1" ? "1" : "0",
    smtpUser: String(formData.get("smtpUser") ?? ""),
    smtpPassword: String(formData.get("smtpPassword") ?? ""),
    smtpFromName: String(formData.get("smtpFromName") ?? ""),
    smtpFromEmail: String(formData.get("smtpFromEmail") ?? ""),
    cveRetentionDays: formData.get("cveRetentionDays"),
    cveSyncIntervalHours: formData.get("cveSyncIntervalHours"),
    inviteExpiryDays: formData.get("inviteExpiryDays"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the configuration values." };
  }

  const current = await getAppConfig();
  const password = parsed.data.smtpPassword ?? "";
  let encryptedPassword: string | undefined;
  if (password) {
    try {
      encryptedPassword = encryptSecret(password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not store the SMTP password.";
      return { error: message };
    }
  }

  await prisma.appConfig.update({
    where: { id: "default" },
    data: {
      smtpHost: emptyToNull(parsed.data.smtpHost),
      smtpPort: parsed.data.smtpPort,
      smtpSecure: parsed.data.smtpSecure === "1",
      smtpUser: emptyToNull(parsed.data.smtpUser),
      smtpFromName: emptyToNull(parsed.data.smtpFromName),
      smtpFromEmail: emptyToNull(parsed.data.smtpFromEmail),
      ...(encryptedPassword ? { smtpPassword: encryptedPassword } : {}),
      cveRetentionDays: clampCveRetentionDays(parsed.data.cveRetentionDays),
      cveSyncIntervalHours: clampCveSyncIntervalHours(parsed.data.cveSyncIntervalHours),
      inviteExpiryDays: clampInviteExpiryDays(parsed.data.inviteExpiryDays),
    },
  });

  if (!password && current.smtpPassword && !emptyToNull(parsed.data.smtpHost)) {
    await prisma.appConfig.update({
      where: { id: "default" },
      data: { smtpPassword: null },
    });
  }

  revalidatePath("/app/settings/config");
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function sendConfigTestEmailAction(
  _prev: ConfigTestEmailState,
  _formData: FormData,
): Promise<ConfigTestEmailState> {
  const membership = await requireArea("CONFIG", "edit");
  const to = membership.email?.trim();
  if (!to) {
    return { error: "Your account has no email address for a test message." };
  }

  const config = await getAppConfig();
  const result = await sendAppEmail(config, {
    to,
    subject: "Security Plan Manager test email",
    text: "SMTP is configured. This is a test message from Security Plan Manager.",
  });
  if (!result.ok) {
    return { error: result.error };
  }
  return { ok: true };
}

export async function syncPublishedCveRecordsAction(
  _prev: ConfigCveMetricsSyncState,
  _formData: FormData,
): Promise<ConfigCveMetricsSyncState> {
  await requireArea("CONFIG", "edit");
  try {
    const result = await syncCveMetrics({ force: true });
    revalidatePath("/app/settings/config");
    revalidatePath("/app", "layout");
    return { ok: true, yearCount: result.yearCount };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "CVE.org metrics could not be copied.";
    return { error: message };
  }
}
