"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import {
  addBrandPrioritiesAction,
  moveBrandPriorityAction,
  removeBrandPriorityAction,
} from "@/actions/priorities";
import { Card, Button, Input } from "@/components/ui";
import { HeadingWithHelp } from "@/components/help-tip";
import {
  FUNCTION_META,
  FUNCTION_ORDER,
  TIER_LABEL,
  functionLabel,
} from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { OutcomeCatalogItem, OutcomePriorityItem } from "@/lib/priorities";

function tierLabel(tier: OutcomePriorityItem["currentTier"]) {
  return tier ? TIER_LABEL[tier] : "Unscored";
}

export function BrandPriorities({
  brandId,
  items,
  catalog = [],
  canEdit = false,
  canViewAssessment = false,
  emptyText = "No outcomes have been chosen yet.",
}: {
  brandId?: string;
  items: OutcomePriorityItem[];
  catalog?: OutcomeCatalogItem[];
  canEdit?: boolean;
  canViewAssessment?: boolean;
  emptyText?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [functionFilter, setFunctionFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const chosenIds = useMemo(
    () => new Set(items.map((item) => item.subcategoryId)),
    [items],
  );
  const remaining = useMemo(
    () => catalog.filter((item) => !chosenIds.has(item.id)),
    [catalog, chosenIds],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return remaining.filter((item) => {
      if (functionFilter !== "ALL" && item.functionCode !== functionFilter) {
        return false;
      }
      if (!needle) return true;
      return (
        item.code.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        item.categoryCode.toLowerCase().includes(needle) ||
        item.functionName.toLowerCase().includes(needle)
      );
    });
  }, [remaining, query, functionFilter]);

  const showAdd = canEdit && Boolean(brandId) && remaining.length > 0;

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function closeAdd() {
    setOpen(false);
    setQuery("");
    setFunctionFilter("ALL");
    setSelected([]);
  }

  function confirmAdd() {
    if (!brandId || selected.length === 0) return;
    const ids = selected;
    closeAdd();
    run(() => addBrandPrioritiesAction(brandId, ids));
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <HeadingWithHelp as="h2" topic="priorities" className="text-lg font-medium">
            Priorities (in progress)
          </HeadingWithHelp>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Outcomes leadership wants to see making progress.
          </p>
        </div>
        {showAdd ? (
          <Button type="button" onClick={() => setOpen(true)} disabled={pending}>
            Add
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">{emptyText}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((item, index) => {
            const meta = FUNCTION_META[item.functionCode];
            const href =
              canViewAssessment && brandId
                ? `/app/brands/${brandId}/assess?function=${item.functionCode}`
                : undefined;
            const title = (
              <div className="font-medium">
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                  style={{ background: meta?.color }}
                />
                {item.subcategoryCode} · {functionLabel(item.functionCode, item.functionName)}
              </div>
            );
            return (
              <li
                key={item.subcategoryId}
                className="flex items-start justify-between gap-4 text-sm"
              >
                <div className="min-w-0">
                  <div className="text-xs text-[var(--muted)]">#{index + 1}</div>
                  {href ? (
                    <Link href={href} prefetch={false} className="hover:underline">
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                  <div className="text-[var(--muted)]">{item.subcategoryDescription}</div>
                  {item.includedInProfile === false ? (
                    <div className="mt-1 text-xs text-[var(--muted)]">Not in profile</div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <div className="text-right text-[var(--muted)]">
                    {tierLabel(item.currentTier)} → {item.targetTier ? TIER_LABEL[item.targetTier] : "—"}
                  </div>
                  {canEdit && brandId ? (
                    <div className="flex flex-col">
                      <button
                        type="button"
                        className="rounded p-0.5 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-40"
                        aria-label={`Move ${item.subcategoryCode} up`}
                        disabled={pending || index === 0}
                        onClick={() =>
                          run(() => moveBrandPriorityAction(brandId, item.subcategoryId, "up"))
                        }
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-0.5 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-40"
                        aria-label={`Move ${item.subcategoryCode} down`}
                        disabled={pending || index === items.length - 1}
                        onClick={() =>
                          run(() => moveBrandPriorityAction(brandId, item.subcategoryId, "down"))
                        }
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-0.5 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-40"
                        aria-label={`Remove ${item.subcategoryCode}`}
                        disabled={pending}
                        onClick={() =>
                          run(() => removeBrandPriorityAction(brandId, item.subcategoryId))
                        }
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {open && showAdd ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close add priorities"
            onClick={closeAdd}
          />
          <div className="absolute inset-x-4 top-12 mx-auto max-h-[85vh] max-w-2xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
            <h3 className="text-lg font-medium">Add priorities</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Choose one or more NIST CSF outcomes. They are added in catalog order; you can
              reorder them after.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {["ALL", ...FUNCTION_ORDER].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setFunctionFilter(code)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    functionFilter === code
                      ? "border-[var(--accent)] bg-[var(--surface-2)] text-[var(--foreground)]"
                      : "border-[var(--border)] text-[var(--muted)]",
                  )}
                >
                  {code === "ALL" ? "All functions" : code}
                </button>
              ))}
            </div>
            <Input
              className="mt-3"
              placeholder="Search outcome codes or descriptions"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <ul className="mt-4 max-h-[45vh] space-y-2 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className="text-sm text-[var(--muted)]">No matching outcomes left to add.</li>
              ) : (
                filtered.map((item) => (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[var(--border)] p-3 text-sm hover:bg-[var(--surface-2)]">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selected.includes(item.id)}
                        onChange={() => toggle(item.id)}
                      />
                      <span>
                        <span className="font-medium">
                          {item.code} · {functionLabel(item.functionCode, item.functionName)}
                        </span>
                        <span className="mt-1 block text-[var(--muted)]">{item.description}</span>
                      </span>
                    </label>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={closeAdd}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={pending || selected.length === 0}
                onClick={confirmAdd}
              >
                Add {selected.length > 0 ? `(${selected.length})` : ""}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
