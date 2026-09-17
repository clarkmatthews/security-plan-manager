import Link from "next/link";
import { FUNCTION_META, formatScore, functionLabel, TIER_LABEL, type FunctionScore, type GapItem, type Scorecard } from "@/lib/scoring";
import { Card } from "@/components/ui";
import type { BrandRisk } from "@/lib/brand-risks";

export function ScoreOverview({ scorecard }: { scorecard: Scorecard }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Overall current</div>
        <div className="mt-2 text-4xl font-semibold">{formatScore(scorecard.overallCurrent)}</div>
        <div className="mt-1 text-sm text-[var(--muted)]">Derived 0–100 from CSF Tiers</div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Overall target</div>
        <div className="mt-2 text-4xl font-semibold">{formatScore(scorecard.overallTarget)}</div>
        <div className="mt-1 text-sm text-[var(--muted)]">
          Gap to target {scorecard.overallGap === null ? "—" : Math.round(scorecard.overallGap)}
        </div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Coverage</div>
        <div className="mt-2 text-4xl font-semibold">{Math.round(scorecard.coverage * 100)}%</div>
        <div className="mt-1 text-sm text-[var(--muted)]">
          {scorecard.complete} of {scorecard.included} in-scope outcomes have
          Current and Target
        </div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Evidence</div>
        <div className="mt-2 text-4xl font-semibold">{scorecard.evidenceCount}</div>
        <div className="mt-1 text-sm text-[var(--muted)]">Artifacts linked to outcomes</div>
      </Card>
    </div>
  );
}

export function FunctionScores({
  functions,
  assessHref,
  showDescriptions = false,
}: {
  functions: FunctionScore[];
  assessHref?: (code: string) => string;
  showDescriptions?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {functions.map((fn) => {
        const meta = FUNCTION_META[fn.code];
        const current = fn.currentScore ?? 0;
        const target = fn.targetScore ?? 0;
        const card = (
          <Card
            className={
              assessHref
                ? "h-full transition hover:border-[var(--accent)]"
                : undefined
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: meta?.color }}
                />
                <h3 className="font-medium">
                  {fn.name}{" "}
                  <span className="font-normal text-[var(--muted)]">({fn.code})</span>
                </h3>
              </div>
              <span className="text-sm text-[var(--muted)]">
                {Math.round(fn.coverage * 100)}% complete
              </span>
            </div>
            {showDescriptions && meta?.description ? (
              <p className="mt-2 text-sm text-[var(--muted)]">{meta.description}</p>
            ) : null}
            <div className="mt-1 text-xs text-[var(--muted)]">
              {fn.complete} of {fn.included} with Current and Target
            </div>
            <div className="mt-4 space-y-2">
              <Bar label="Current" value={current} color={meta?.color ?? "#d7c36a"} />
              <Bar label="Target" value={target} color="#93a0b8" />
            </div>
          </Card>
        );
        if (!assessHref) {
          return <div key={fn.code}>{card}</div>;
        }
        return (
          <Link
            key={fn.code}
            href={assessHref(fn.code)}
            prefetch={false}
            aria-label={`Open ${functionLabel(fn.code, fn.name)} assessment`}
          >
            {card}
          </Link>
        );
      })}
    </div>
  );
}

export function LargestGaps({
  gaps,
  emptyText = "No target gaps yet. Set target tiers in the assessment catalog.",
}: {
  gaps: GapItem[];
  emptyText?: string;
}) {
  return (
    <Card>
      <h2 className="text-lg font-medium">Largest gaps</h2>
      <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
        Target tier minus current tier for in-scope outcomes.
      </p>
      {gaps.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {gaps.map((gap) => (
            <li key={gap.subcategoryCode} className="flex items-start justify-between gap-4 text-sm">
              <div>
                <div className="font-medium">
                  {gap.subcategoryCode} · {functionLabel(gap.functionCode)}
                </div>
                <div className="text-[var(--muted)]">{gap.subcategoryDescription}</div>
              </div>
              <div className="shrink-0 text-right text-[var(--muted)]">
                {gap.currentTier ? TIER_LABEL[gap.currentTier] : "Unscored"} →{" "}
                {gap.targetTier ? TIER_LABEL[gap.targetTier] : "—"}
                <div className="text-[var(--foreground)]">Gap {gap.gap}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function HighestBrandRisks({
  risks,
  emptyText = "No ranked brand risks yet. Set target tiers in the assessment catalog.",
}: {
  risks: BrandRisk[];
  emptyText?: string;
}) {
  return (
    <Card>
      <h2 className="text-lg font-medium">Highest brand risks</h2>
      <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
        NIST CSF Current vs Target gaps first. Unresolved installed-app CVE.
      </p>
      {risks.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {risks.map((risk) =>
            risk.kind === "cve" ? (
              <li
                key={`cve-${risk.companyName}-${risk.productName}`}
                className="flex items-start justify-between gap-4 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {risk.productName} · {risk.companyName}
                  </div>
                  <div className="text-[var(--muted)]">
                    {risk.highCount} unresolved High/Critical exposure
                    {risk.highCount === 1 ? "" : "s"} on active inventory
                    {risk.cveId ? ` · highest ${risk.cveId}` : ""}
                  </div>
                </div>
                <div className="shrink-0 text-right text-[var(--muted)]">
                  CVE
                  <div className="text-[var(--foreground)]">
                    CVSS {risk.maxCvss.toFixed(1)}
                  </div>
                </div>
              </li>
            ) : (
              <li
                key={`csf-${risk.subcategoryCode}`}
                className="flex items-start justify-between gap-4 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {risk.subcategoryCode} · {functionLabel(risk.functionCode)}
                  </div>
                  <div className="text-[var(--muted)]">{risk.subcategoryDescription}</div>
                </div>
                <div className="shrink-0 text-right text-[var(--muted)]">
                  {risk.currentTier ? TIER_LABEL[risk.currentTier] : "Unscored"} →{" "}
                  {risk.targetTier ? TIER_LABEL[risk.targetTier] : "—"}
                  <div className="text-[var(--foreground)]">Gap {risk.gap}</div>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
      </div>
    </div>
  );
}
