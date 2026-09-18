"use client";

import { useActionState } from "react";
import {
  saveAppConfigAction,
  sendConfigTestEmailAction,
  type ConfigState,
  type ConfigTestEmailState,
} from "@/actions/config";
import {
  INVITE_EXPIRY_DAYS_MAX,
  INVITE_EXPIRY_DAYS_MIN,
  type PublicAppConfig,
} from "@/lib/app-settings";
import {
  CVE_RETENTION_DAYS_MAX,
  CVE_RETENTION_DAYS_MIN,
  CVE_SYNC_INTERVAL_HOURS_MAX,
  CVE_SYNC_INTERVAL_HOURS_MIN,
} from "@/lib/cve-constants";
import { HeadingWithHelp } from "@/components/help-tip";
import { Card, Input, Label, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function ConfigForm({
  config,
  canEdit,
  testEmail,
}: {
  config: PublicAppConfig;
  canEdit: boolean;
  testEmail: string | null;
}) {
  const [state, action] = useActionState<ConfigState, FormData>(
    saveAppConfigAction,
    undefined,
  );
  const [testState, testAction] = useActionState<ConfigTestEmailState, FormData>(
    sendConfigTestEmailAction,
    undefined,
  );

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        <fieldset disabled={!canEdit} className="space-y-6 disabled:opacity-80">
          <Card>
            <HeadingWithHelp as="h2" topic="configSmtp" className="text-lg font-medium">
              Email
            </HeadingWithHelp>
            <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
              SMTP for invite and test messages. Leave the password blank to keep the
              stored value. Invites still show a copyable link if mail is not sent.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="smtpHost">SMTP host</Label>
                <Input
                  id="smtpHost"
                  name="smtpHost"
                  defaultValue={config.smtpHost}
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="smtpPort">Port</Label>
                <Input
                  id="smtpPort"
                  name="smtpPort"
                  type="number"
                  min={1}
                  max={65535}
                  defaultValue={config.smtpPort}
                  required
                />
              </div>
              <div>
                <Label htmlFor="smtpSecure">Encryption</Label>
                <Select
                  id="smtpSecure"
                  name="smtpSecure"
                  defaultValue={config.smtpSecure ? "1" : "0"}
                >
                  <option value="0">STARTTLS / none (typical port 587)</option>
                  <option value="1">TLS (typical port 465)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="smtpUser">Username</Label>
                <Input
                  id="smtpUser"
                  name="smtpUser"
                  defaultValue={config.smtpUser}
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="smtpPassword">Password</Label>
                <Input
                  id="smtpPassword"
                  name="smtpPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder={config.smtpPasswordSet ? "Stored — leave blank to keep" : ""}
                />
              </div>
              <div>
                <Label htmlFor="smtpFromName">From name</Label>
                <Input
                  id="smtpFromName"
                  name="smtpFromName"
                  defaultValue={config.smtpFromName}
                />
              </div>
              <div>
                <Label htmlFor="smtpFromEmail">From address</Label>
                <Input
                  id="smtpFromEmail"
                  name="smtpFromEmail"
                  type="email"
                  defaultValue={config.smtpFromEmail}
                />
              </div>
            </div>
          </Card>

          <Card>
            <HeadingWithHelp as="h2" topic="configCveInvites" className="text-lg font-medium">
              CVE and invites
            </HeadingWithHelp>
            <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
              These values apply to the whole deployment, not a single brand.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="cveRetentionDays">CVE retention (days)</Label>
                <Input
                  id="cveRetentionDays"
                  name="cveRetentionDays"
                  type="number"
                  min={CVE_RETENTION_DAYS_MIN}
                  max={CVE_RETENTION_DAYS_MAX}
                  defaultValue={config.cveRetentionDays}
                  required
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {`Catalog records older than this are pruned on the next sync (${CVE_RETENTION_DAYS_MIN}–${CVE_RETENTION_DAYS_MAX}).`}
                </p>
              </div>
              <div>
                <Label htmlFor="cveSyncIntervalHours">CVE sync interval (hours)</Label>
                <Input
                  id="cveSyncIntervalHours"
                  name="cveSyncIntervalHours"
                  type="number"
                  min={CVE_SYNC_INTERVAL_HOURS_MIN}
                  max={CVE_SYNC_INTERVAL_HOURS_MAX}
                  defaultValue={config.cveSyncIntervalHours}
                  required
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {`Minimum time between GitHub delta syncs (${CVE_SYNC_INTERVAL_HOURS_MIN}–${CVE_SYNC_INTERVAL_HOURS_MAX}).`}
                </p>
              </div>
              <div>
                <Label htmlFor="inviteExpiryDays">Invite expiry (days)</Label>
                <Input
                  id="inviteExpiryDays"
                  name="inviteExpiryDays"
                  type="number"
                  min={INVITE_EXPIRY_DAYS_MIN}
                  max={INVITE_EXPIRY_DAYS_MAX}
                  defaultValue={config.inviteExpiryDays}
                  required
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {`How long a new invite link stays valid (${INVITE_EXPIRY_DAYS_MIN}–${INVITE_EXPIRY_DAYS_MAX}).`}
                </p>
              </div>
            </div>
          </Card>
        </fieldset>

        {state?.error ? <p className="text-sm text-[#e07a7a]">{state.error}</p> : null}
        {state?.ok ? (
          <p className="text-sm text-[#4faf78]">Configuration saved.</p>
        ) : null}
        {canEdit ? <SubmitButton>Save configuration</SubmitButton> : null}
      </form>

      {canEdit ? (
        <Card>
          <h2 className="mb-2 text-lg font-medium">Send a test email</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Uses the saved SMTP settings
            {testEmail ? ` and sends to ${testEmail}` : ""}. Save first if you just
            changed the host or password.
          </p>
          <form action={testAction}>
            <SubmitButton variant="secondary">Send test email</SubmitButton>
          </form>
          {testState?.error ? (
            <p className="mt-3 text-sm text-[#e07a7a]">{testState.error}</p>
          ) : null}
          {testState?.ok ? (
            <p className="mt-3 text-sm text-[#4faf78]">Test email sent.</p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
