import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { listAccessibleBrands } from "@/lib/brand-access";
import { hasAccess, homePath, navLinksFor } from "@/lib/rbac";
import { listUnackedCveAlerts } from "@/lib/cve-alerts";
import { syncCvesIfStale } from "@/lib/cve-sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const membership = await requireMembership();
  void syncCvesIfStale();
  const [organization, brands] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: membership.organizationId },
    }),
    listAccessibleBrands(membership),
  ]);
  if (!organization) {
    redirect("/onboarding");
  }

  const cveAlerts = hasAccess(membership.permissions, "SOFTWARE", "view")
    ? await listUnackedCveAlerts(membership)
    : { alerts: [], total: 0 };

  return (
    <AppShell
      orgName={organization.name}
      role={membership.roleName}
      links={navLinksFor(membership.permissions, brands)}
      homeHref={homePath(membership.permissions)}
      cveAlerts={cveAlerts.alerts}
      cveAlertTotal={cveAlerts.total}
    >
      {children}
    </AppShell>
  );
}
