import { requireArea } from "@/lib/auth-guard";
import { getAppConfig, toPublicAppConfig } from "@/lib/app-config";
import { getCveMetricsSyncStatus } from "@/lib/cve-metrics";
import { hasAccess } from "@/lib/rbac";
import { HeadingWithHelp } from "@/components/help-tip";
import { ConfigForm } from "@/components/config-form";

export default async function ConfigPage() {
  const membership = await requireArea("CONFIG", "view");
  const canEdit = hasAccess(membership.permissions, "CONFIG", "edit");
  const [config, cveMetrics] = await Promise.all([
    getAppConfig(),
    getCveMetricsSyncStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <HeadingWithHelp className="text-3xl font-semibold" topic="config">
          Config
        </HeadingWithHelp>
        <p className="mt-2 max-w-3xl text-[var(--muted)]">
          Deployment-wide email, CVE catalog, and invite settings. They are not
          brand-specific. Access is granted on the Roles page.
        </p>
      </div>
      <ConfigForm
        config={toPublicAppConfig(config)}
        canEdit={canEdit}
        testEmail={membership.email ?? null}
        cveMetrics={{
          fetchedAtLabel: cveMetrics.fetchedAt
            ? cveMetrics.fetchedAt.toLocaleString()
            : null,
          yearCount: cveMetrics.yearCount,
          lastError: cveMetrics.lastError,
        }}
      />
    </div>
  );
}
