import { redirect } from "next/navigation";
import { requireArea } from "@/lib/auth-guard";
import { listAccessibleBrands } from "@/lib/brand-access";
import { Card } from "@/components/ui";

export default async function ReportsIndexPage() {
  const membership = await requireArea("REPORTS", "view");
  const brands = await listAccessibleBrands(membership);
  if (brands[0]) {
    redirect(`/app/brands/${brands[0].id}/reports`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Board reports</h1>
        <p className="mt-2 text-[var(--muted)]">
          Reports are listed under each brand. No brands are available for this account yet.
        </p>
      </div>
      <Card>
        <p className="text-sm text-[var(--muted)]">
          Ask an organization owner to grant brand access, then open Reports from that brand in
          the menu.
        </p>
      </Card>
    </div>
  );
}
