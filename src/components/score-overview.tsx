"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FUNCTION_META, formatCompletion, formatScore, functionLabel, TIER_LABEL, type FunctionScore, type GapItem, type Scorecard } from "@/lib/scoring";
import { Card } from "@/components/ui";
import { HeadingWithHelp, WidgetLabel } from "@/components/help-tip";
import type { BrandRisk } from "@/lib/brand-risks";
import { cn } from "@/lib/utils";

export function ScoreOverview({
  scorecard,
  excludedHref,
}: {
  scorecard: Scorecard;
  excludedHref?: string;
}) {
  const showExcluded = typeof scorecard.excluded === "number";
  const excludedCard = showExcluded ? (
    <Card
      className={
        excludedHref ? "h-full transition hover:border-[var(--accent)]" : undefined
      }
    >
      <WidgetLabel topic="excludedCount">Excluded</WidgetLabel>
      <div className="mt-2 text-4xl font-semibold">{scorecard.excluded}</div>
      <div className="mt-1 text-sm text-[var(--muted)]">
        Outcomes not in the organizational profile
      </div>
    </Card>
  ) : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Card>
        <WidgetLabel topic="overallCurrent">Overall current</WidgetLabel>
        <div className="mt-2 text-4xl font-semibold">{formatScore(scorecard.overallCurrent)}</div>
        <div className="mt-1 text-sm text-[var(--muted)]">Derived 0–100 from CSF Tiers</div>
      </Card>
      <Card>
        <WidgetLabel topic="overallTarget">Overall target</WidgetLabel>
        <div className="mt-2 text-4xl font-semibold">{formatScore(scorecard.overallTarget)}</div>
        <div className="mt-1 text-sm text-[var(--muted)]">
          Gap to target {scorecard.overallGap === null ? "—" : Math.round(scorecard.overallGap)}
        </div>
      </Card>
      <Card>
        <WidgetLabel topic="coverage">Coverage</WidgetLabel>
        <div className="mt-2 text-4xl font-semibold">
          {formatCompletion(scorecard.overallCurrent, scorecard.overallTarget)}
        </div>
        <div className="mt-1 text-sm text-[var(--muted)]">
          {formatScore(scorecard.overallCurrent)} of {formatScore(scorecard.overallTarget)} toward
          target
        </div>
      </Card>
      <Card>
        <WidgetLabel topic="evidenceCount">Evidence</WidgetLabel>
        <div className="mt-2 text-4xl font-semibold">{scorecard.evidenceCount}</div>
        <div className="mt-1 text-sm text-[var(--muted)]">Artifacts linked to in-scope outcomes</div>
      </Card>
      {excludedHref && excludedCard ? (
        <Link
          href={excludedHref}
          prefetch={false}
          aria-label="Open excluded outcomes in the organizational profile"
        >
          {excludedCard}
        </Link>
      ) : (
        excludedCard
      )}
    </div>
  );
}

export function FunctionScores({
  functions,
  assessBasePath,
  showDescriptions = false,
}: {
  functions: FunctionScore[];
  assessBasePath?: string;
  showDescriptions?: boolean;
}) {
  const [scope, setScope] = useState<"all" | "included" | "excluded">("all");
  const visible = useMemo(() => {
    return functions.filter((fn) => {
      if (scope === "included") return fn.included > 0;
      if (scope === "excluded") return fn.included === 0;
      return true;
    });
  }, [functions, scope]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HeadingWithHelp as="h2" topic="functionComplete" className="text-lg font-medium">
          NIST functions
        </HeadingWithHelp>
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "included", "excluded"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs capitalize",
                scope === value
                  ? "border-[var(--accent)] bg-[var(--surface-2)] text-[var(--foreground)]"
                  : "border-[var(--border)] text-[var(--muted)]",
              )}
            >
              {value === "all" ? "All" : value === "included" ? "Included" : "Excluded"}
            </button>
          ))}
        </div>
      </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visible.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          {scope === "excluded"
            ? "No NIST functions are fully excluded."
            : "No NIST functions match this filter."}
        </p>
      ) : null}
      {visible.map((fn) => {
        const meta = FUNCTION_META[fn.code];
        const current = fn.currentScore ?? 0;
        const target = fn.targetScore ?? 0;
        const card = (
          <Card
            className={
              assessBasePath
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
                {fn.currentScore === null
                  ? "—"
                  : `${formatScore(fn.currentScore)}% complete`}
              </span>
            </div>
            {showDescriptions && meta?.description ? (
              <p className="mt-2 text-sm text-[var(--muted)]">{meta.description}</p>
            ) : null}
            <div className="mt-1 text-xs text-[var(--muted)]">
              {formatScore(fn.currentScore)} of {formatScore(fn.targetScore)}
              {" · "}
              {fn.included} outcome{fn.included === 1 ? "" : "s"}
            </div>
            <div className="mt-4 space-y-2">
              <Bar label="Current" value={current} color={meta?.color ?? "#d7c36a"} />
              <Bar label="Target" value={target} color="#93a0b8" />
            </div>
          </Card>
        );
        if (!assessBasePath) {
          return <div key={fn.code}>{card}</div>;
        }
        return (
          <Link
            key={fn.code}
            href={`${assessBasePath}?function=${fn.code}`}
            prefetch={false}
            aria-label={`Open ${functionLabel(fn.code, fn.name)} assessment`}
          >
            {card}
          </Link>
        );
      })}
    </div>
    </section>
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
      <HeadingWithHelp as="h2" topic="highestBrandRisks" className="text-lg font-medium">
        Highest brand risks
      </HeadingWithHelp>
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
