import { Card } from "@/components/ui";
import type { SoftwareInsights } from "@/lib/software-insights";

export function SoftwareInsightsCards({ insights }: { insights: SoftwareInsights }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Software and CVE insights</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Active applications for this brand. CVE counts are unique application + CVE
          date, so one product with many same-day CVEs is one exposure.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Applications
          </div>
          <div className="mt-2 text-4xl font-semibold">{insights.applicationCount}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">Active inventory items</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
            CVE exposures outstanding
          </div>
          <div className="mt-2 text-4xl font-semibold">{insights.cveOutstanding}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Unique application + CVE date still open
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
            CVE exposures resolved
          </div>
          <div className="mt-2 text-4xl font-semibold">{insights.cveResolved}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Unique application + CVE date acknowledged
          </div>
        </Card>
      </div>
      <Card>
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
          Applications by category
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {insights.categoryCounts.map((item) => (
            <div key={item.category}>
              <div className="text-2xl font-semibold">{item.count}</div>
              <div className="text-sm text-[var(--muted)]">{item.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
