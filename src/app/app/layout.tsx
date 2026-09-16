import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { listAccessibleBrands } from "@/lib/brand-access";
import { homePath, navLinksFor } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const membership = await requireMembership();
  const [organization, brands] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: membership.organizationId },
    }),
    listAccessibleBrands(membership),
  ]);
  if (!organization) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      orgName={organization.name}
      role={membership.roleName}
      links={navLinksFor(membership.permissions, brands)}
      homeHref={homePath(membership.permissions)}
    >
      {children}
    </AppShell>
  );
}
