import Link from "next/link";
import { FUNCTION_META, formatScore, functionLabel, type FunctionScore, type Scorecard } from "@/lib/scoring";
import { Card } from "@/components/ui";

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
}: {
  functions: FunctionScore[];
  assessHref?: (code: string) => string;
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
