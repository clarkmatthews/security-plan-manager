export const CVE_RISK_CVSS_THRESHOLD = 7.5;

function asFiniteScore(value: unknown): number | null {
  const score = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(score) || score < 0 || score > 10) return null;
  return Math.round(score * 10) / 10;
}

export function parseCvssFromText(text: string | null | undefined): number | null {
  if (!text) return null;
  const baseScore = text.match(/Base Score\s*[:\s]*(\d{1,2}(?:\.\d)?)/i);
  if (baseScore) return asFiniteScore(baseScore[1]);
  const labeled = text.match(/CVSS(?:\s*[vV]?\d(?:\.\d)?)?\s*[:\s]+(\d{1,2}\.\d)/i);
  return asFiniteScore(labeled?.[1]);
}

function collectScores(value: unknown, out: number[]) {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) collectScores(item, out);
    return;
  }
  if (typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  const direct =
    asFiniteScore(record.baseScore) ??
    asFiniteScore((record.cvssData as { baseScore?: unknown } | undefined)?.baseScore);
  if (direct != null) out.push(direct);
  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object") collectScores(nested, out);
  }
}

export function parseCvssFromMetrics(metrics: unknown): number | null {
  const scores: number[] = [];
  collectScores(metrics, scores);
  if (scores.length === 0) return null;
  return Math.max(...scores);
}

export function resolveCvssScore(options: {
  metrics?: unknown;
  summary?: string | null;
}): number | null {
  return parseCvssFromMetrics(options.metrics) ?? parseCvssFromText(options.summary);
}
