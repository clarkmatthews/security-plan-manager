import type { ReactNode } from "react";
import { ROLE_LABEL, type NavLink } from "@/lib/rbac";
import { AppNavMenu } from "@/components/app-nav-menu";
import { CveAlertModal } from "@/components/cve-alert-modal";
import { SignOutButton } from "@/components/sign-out-button";
import type { CveAlertItem } from "@/lib/cve-alerts";

export function AppShell({
  children,
  orgName,
  role,
  links,
  homeHref,
  cveAlerts = [],
  cveAlertTotal = 0,
}: {
  children: ReactNode;
  orgName: string;
  role: string;
  links: NavLink[];
  homeHref: string;
  cveAlerts?: CveAlertItem[];
  cveAlertTotal?: number;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between gap-4 px-3 py-3 sm:px-4">
          <AppNavMenu links={links} homeHref={homeHref} />
          <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="hidden sm:inline">
              {orgName} · {ROLE_LABEL[role] ?? role}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      <CveAlertModal initialAlerts={cveAlerts} total={cveAlertTotal} />
    </div>
  );
}
