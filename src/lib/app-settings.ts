import {
  clampCveRetentionDays,
  clampCveSyncIntervalHours,
} from "@/lib/cve-constants";

export const INVITE_EXPIRY_DAYS_DEFAULT = 14;
export const INVITE_EXPIRY_DAYS_MIN = 1;
export const INVITE_EXPIRY_DAYS_MAX = 90;

export type AppConfigFields = {
  smtpHost: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFromName: string | null;
  smtpFromEmail: string | null;
  cveRetentionDays: number;
  cveSyncIntervalHours: number;
  inviteExpiryDays: number;
};

export type PublicAppConfig = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpFromName: string;
  smtpFromEmail: string;
  smtpPasswordSet: boolean;
  smtpReady: boolean;
  cveRetentionDays: number;
  cveSyncIntervalHours: number;
  inviteExpiryDays: number;
};

export function clampInviteExpiryDays(value: number) {
  if (!Number.isFinite(value)) return INVITE_EXPIRY_DAYS_DEFAULT;
  return Math.min(
    INVITE_EXPIRY_DAYS_MAX,
    Math.max(INVITE_EXPIRY_DAYS_MIN, Math.round(value)),
  );
}

export function isSmtpReady(config: {
  smtpHost?: string | null;
  smtpFromEmail?: string | null;
}) {
  return Boolean(config.smtpHost?.trim() && config.smtpFromEmail?.trim());
}

export function toPublicAppConfig(config: AppConfigFields): PublicAppConfig {
  return {
    smtpHost: config.smtpHost ?? "",
    smtpPort: config.smtpPort,
    smtpSecure: config.smtpSecure,
    smtpUser: config.smtpUser ?? "",
    smtpFromName: config.smtpFromName ?? "",
    smtpFromEmail: config.smtpFromEmail ?? "",
    smtpPasswordSet: Boolean(config.smtpPassword),
    smtpReady: isSmtpReady(config),
    cveRetentionDays: clampCveRetentionDays(config.cveRetentionDays),
    cveSyncIntervalHours: clampCveSyncIntervalHours(config.cveSyncIntervalHours),
    inviteExpiryDays: clampInviteExpiryDays(config.inviteExpiryDays),
  };
}
