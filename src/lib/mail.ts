import nodemailer from "nodemailer";
import type { AppConfig } from "@prisma/client";
import { isSmtpReady } from "@/lib/app-settings";

export function smtpFromHeader(config: AppConfig) {
  const email = config.smtpFromEmail?.trim() ?? "";
  const name = config.smtpFromName?.trim().replace(/["<>]/g, "");
  return name ? `${name} <${email}>` : email;
}

export async function sendAppEmail(
  config: AppConfig,
  options: { to: string; subject: string; text: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSmtpReady(config)) {
    return { ok: false, error: "SMTP is not configured." };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost!.trim(),
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: config.smtpUser?.trim()
      ? { user: config.smtpUser.trim(), pass: config.smtpPassword ?? "" }
      : undefined,
  });

  try {
    await transporter.sendMail({
      from: smtpFromHeader(config),
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed.";
    return { ok: false, error: message };
  }
}
