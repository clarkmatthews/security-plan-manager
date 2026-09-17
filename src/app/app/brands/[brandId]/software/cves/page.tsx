import Link from "next/link";
import { notFound } from "next/navigation";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { AcknowledgeMatchButton } from "@/components/acknowledge-match-button";
import { CveHistoryForm } from "@/components/cve-history-form";
import { CVE_RETENTION_DAYS } from "@/lib/cve-constants";

const CATALOG_PAGE_SIZE = 50;

function formatDate(value: Date | null | undefined) {
  return value ? value.toLocaleString() : "—";
}

function formatDay(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "—";
}

export default async function SoftwareCveHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ brandId: string }>;
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  const { brandId } = await params;
  const query = await searchParams;
  const membership = await requireArea("SOFTWARE", "view");
  requireBrandAccess(membership, brandId);

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, organizationId: membership.organizationId },
  });
  if (!brand) notFound();

  const showCatalog = query.view === "catalog";
  const canEdit = membership.permissions.SOFTWARE.edit;
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);

  const [matches, catalog, catalogTotal, syncState] = await Promise.all([
    showCatalog
      ? Promise.resolve([])
      : prisma.softwareCveMatch.findMany({
          where: { brandId: brand.id, organizationId: membership.organizationId },
          include: {
            cve: true,
            software: {
              select: { productName: true, companyName: true, archivedAt: true },
            },
            acknowledgedBy: { select: { name: true, email: true } },
          },
          orderBy: { detectedAt: "desc" },
        }),
    showCatalog
      ? prisma.cveRecord.findMany({
          orderBy: [{ publishedAt: "desc" }, { lastSeenAt: "desc" }],
          skip: (page - 1) * CATALOG_PAGE_SIZE,
          take: CATALOG_PAGE_SIZE,
        })
      : Promise.resolve([]),
    showCatalog ? prisma.cveRecord.count() : Promise.resolve(0),
    prisma.cveSyncState.findUnique({ where: { id: "default" } }),
  ]);

  const catalogPages = Math.max(1, Math.ceil(catalogTotal / CATALOG_PAGE_SIZE));
  const matchesHref = `/app/brands/${brand.id}/software/cves`;
  const catalogHref = `/app/brands/${brand.id}/software/cves?view=catalog`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/brands/${brand.id}/software`}
          prefetch={false}
          className="text-sm text-[var(--muted)]"
        >
          ← {brand.name} software inventory
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">CVE history</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Matches between {brand.name} software and the rolling {CVE_RETENTION_DAYS}-day
          CVE catalog. Switch to all ingested CVEs to inspect the shared feed.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={matchesHref}
          prefetch={false}
          className={`inline-flex items-center justify-center rounded-md border px-3.5 py-2 text-sm font-medium ${
            showCatalog
              ? "border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
              : "border-[var(--accent)] bg-[var(--surface-2)]"
          }`}
        >
          Application matches
        </Link>
        <Link
          href={catalogHref}
          prefetch={false}
          className={`inline-flex items-center justify-center rounded-md border px-3.5 py-2 text-sm font-medium ${
            showCatalog
              ? "border-[var(--accent)] bg-[var(--surface-2)]"
              : "border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
          }`}
        >
          All ingested CVEs
        </Link>
      </div>

      {canEdit ? (
        <Card>
          <h2 className="mb-1 text-lg font-medium">Load prior CVE history</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Pull a published-date range into Postgres, match active software, and drop
            records older than {CVE_RETENTION_DAYS} days.
          </p>
          <CveHistoryForm brandId={brand.id} />
          {syncState ? (
            <div className="mt-4 space-y-1 text-xs text-[var(--muted)]">
              {syncState.startedAt ? (
                <p>Sync in progress since {formatDate(syncState.startedAt)}.</p>
              ) : null}
              <p>
                Last sync {formatDate(syncState.lastSyncedAt)}
                {syncState.lastFetched != null
                  ? ` · fetched ${syncState.lastFetched}, saved ${syncState.lastUpserted ?? 0}, matched ${syncState.lastMatched ?? 0}, pruned ${syncState.lastPruned ?? 0}`
                  : ""}
              </p>
              {syncState.lastHistoryFrom && syncState.lastHistoryTo ? (
                <p>
                  Last history load {formatDay(syncState.lastHistoryFrom)} to{" "}
                  {formatDay(syncState.lastHistoryTo)}
                </p>
              ) : null}
              {syncState.lastError ? (
                <p className="text-[#e07a7a]">{syncState.lastError}</p>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}

      {showCatalog ? (
        catalog.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">
              No CVE records in the catalog yet. Load a date range or wait for the
              daily feed.
            </p>
          </Card>
        ) : (
          <>
            <p className="text-sm text-[var(--muted)]">
              {catalogTotal} CVE{catalogTotal === 1 ? "" : "s"} in the last{" "}
              {CVE_RETENTION_DAYS} days.
            </p>
            <div className="space-y-3">
              {catalog.map((record) => (
                <Card key={record.id}>
                  <a
                    href={record.sourceUrl}
                    className="text-sm font-medium text-[var(--accent)] underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {record.cveId}
                  </a>
                  <p className="mt-2 text-sm">{record.summary}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Published {formatDate(record.publishedAt)} · last seen{" "}
                    {formatDate(record.lastSeenAt)}
                  </p>
                  {record.productsText ? (
                    <p className="mt-2 text-xs text-[var(--muted)]">{record.productsText}</p>
                  ) : null}
                </Card>
              ))}
            </div>
            {catalogPages > 1 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">
                  Page {page} of {catalogPages}
                </span>
                <div className="flex gap-3">
                  {page > 1 ? (
                    <Link
                      href={`${catalogHref}&page=${page - 1}`}
                      prefetch={false}
                      className="text-[var(--accent)] underline"
                    >
                      Previous
                    </Link>
                  ) : null}
                  {page < catalogPages ? (
                    <Link
                      href={`${catalogHref}&page=${page + 1}`}
                      prefetch={false}
                      className="text-[var(--accent)] underline"
                    >
                      Next
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        )
      ) : matches.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            No CVE matches yet. Active software is checked when the daily CVE feed
            runs, when you load history, and when you add or restore an application.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const acknowledged = Boolean(match.acknowledgedAt);
            return (
              <Card key={match.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <a
                      href={match.cve.sourceUrl}
                      className="text-sm font-medium text-[var(--accent)] underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {match.cve.cveId}
                    </a>
                    <h2 className="mt-1 font-medium">
                      {match.software.productName}
                      {match.software.archivedAt ? (
                        <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                          archived
                        </span>
                      ) : null}
                    </h2>
                    <p className="text-sm text-[var(--muted)]">{match.software.companyName}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">{match.cve.summary}</p>
                    <p className="mt-3 text-xs text-[var(--muted)]">
                      Detected {formatDate(match.detectedAt)}
                    </p>
                    {acknowledged && match.acknowledgedBy ? (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        Acknowledged by {match.acknowledgedBy.name ?? match.acknowledgedBy.email}{" "}
                        · {formatDate(match.acknowledgedAt)}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--muted)]">Not acknowledged yet.</p>
                    )}
                  </div>
                  {!acknowledged ? (
                    <AcknowledgeMatchButton brandId={brand.id} matchId={match.id} />
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
