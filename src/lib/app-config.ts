import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, isEncryptedSecret } from "@/lib/secret-box";
import {
  CVE_RETENTION_DAYS_DEFAULT,
  CVE_SYNC_INTERVAL_HOURS_DEFAULT,
  clampCveRetentionDays,
  clampCveSyncIntervalHours,
} from "@/lib/cve-constants";
import {
  INVITE_EXPIRY_DAYS_DEFAULT,
  clampInviteExpiryDays,
} from "@/lib/app-settings";

export {
  INVITE_EXPIRY_DAYS_DEFAULT,
  INVITE_EXPIRY_DAYS_MIN,
  INVITE_EXPIRY_DAYS_MAX,
  clampInviteExpiryDays,
  isSmtpReady,
  toPublicAppConfig,
  type PublicAppConfig,
} from "@/lib/app-settings";

export async function getAppConfig() {
  const config = await prisma.appConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      cveRetentionDays: CVE_RETENTION_DAYS_DEFAULT,
      cveSyncIntervalHours: CVE_SYNC_INTERVAL_HOURS_DEFAULT,
      inviteExpiryDays: INVITE_EXPIRY_DAYS_DEFAULT,
    },
  });
  let smtpPassword = config.smtpPassword;
  if (smtpPassword && !isEncryptedSecret(smtpPassword)) {
    try {
      const encrypted = encryptSecret(smtpPassword);
      await prisma.appConfig.update({
        where: { id: "default" },
        data: { smtpPassword: encrypted },
      });
    } catch {
      smtpPassword = config.smtpPassword;
    }
  } else if (smtpPassword) {
    try {
      smtpPassword = decryptSecret(smtpPassword);
    } catch {
      smtpPassword = null;
    }
  }
  return {
    ...config,
    smtpPassword,
    cveRetentionDays: clampCveRetentionDays(config.cveRetentionDays),
    cveSyncIntervalHours: clampCveSyncIntervalHours(config.cveSyncIntervalHours),
    inviteExpiryDays: clampInviteExpiryDays(config.inviteExpiryDays),
  };
}

export async function cveRetentionDays() {
  return (await getAppConfig()).cveRetentionDays;
}

export async function cveSyncIntervalHours() {
  return (await getAppConfig()).cveSyncIntervalHours;
}

export async function cveSyncIntervalMs() {
  return (await cveSyncIntervalHours()) * 60 * 60 * 1000;
}

export async function inviteExpiryDays() {
  return (await getAppConfig()).inviteExpiryDays;
}
