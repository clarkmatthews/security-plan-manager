"use client";

import { useActionState, useState } from "react";
import type { SoftwareCategory } from "@prisma/client";
import { ChevronDown, ChevronRight } from "lucide-react";
import { importSoftwareAction, type SoftwareImportState } from "@/actions/software";
import { SOFTWARE_CATEGORIES } from "@/lib/software";
import { Button, Card, Label, Select } from "@/components/ui";
import { SoftwareForm } from "@/components/software-form";
import { SoftwareRow } from "@/components/software-row";
import { SubmitButton } from "@/components/submit-button";

type SoftwareItem = {
  id: string;
  productName: string;
  companyName: string;
  version: string;
  category: SoftwareCategory;
  notes: string | null;
  archivedAt: Date | string | null;
};

function matchesCategory(item: SoftwareItem, category: string) {
  return category === "all" || item.category === category;
}

export function SoftwareInventory({
  brandId,
  canEdit,
  items,
}: {
  brandId: string;
  canEdit: boolean;
  items: SoftwareItem[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [category, setCategory] = useState("all");
  const [importState, importAction] = useActionState<SoftwareImportState, FormData>(
    importSoftwareAction.bind(null, brandId),
    undefined,
  );

  const active = items.filter((item) => !item.archivedAt);
  const archived = items.filter((item) => item.archivedAt);
  const visibleActive = active.filter((item) => matchesCategory(item, category));
  const visibleArchived = archived.filter((item) => matchesCategory(item, category));

  return (
    <div className="space-y-6">
      {canEdit ? (
        <Card>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setAddOpen((value) => !value)}
            aria-expanded={addOpen}
          >
            <h2 className="text-lg font-medium">Add software</h2>
            <span className="inline-flex items-center gap-1 text-sm text-[var(--muted)]">
              {addOpen ? "Close" : "Expand"}
              {addOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          </button>
          {addOpen ? (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <SoftwareForm brandId={brandId} submitLabel="Add software" />
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-56">
            <Label htmlFor="software-category-filter">Filter</Label>
            <Select
              id="software-category-filter"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All</option>
              {SOFTWARE_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/app/brands/${brandId}/software/export`}
              download
              className="inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--surface-3)]"
            >
              Export template
            </a>
            {canEdit ? (
              <form action={importAction} className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  name="file"
                  accept=".csv,text/csv"
                  required
                  className="max-w-56 text-sm text-[var(--muted)] file:mr-2 file:rounded-md file:border file:border-[var(--border)] file:bg-[var(--surface-2)] file:px-2 file:py-1 file:text-sm file:text-[var(--foreground)]"
                />
                <SubmitButton variant="secondary">Import template</SubmitButton>
              </form>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-[var(--muted)]">
          The template is the current active list. Add rows to create applications, keep the id
          column to update existing ones, and delete a row to archive it.
        </p>
        {importState?.error ? (
          <p className="text-sm text-[#e07a7a]">{importState.error}</p>
        ) : null}
        {importState && !importState.error ? (
          <p className="text-sm text-[var(--muted)]">
            Import complete: {importState.added ?? 0} added, {importState.updated ?? 0} updated,{" "}
            {importState.archived ?? 0} archived.
          </p>
        ) : null}

        {visibleActive.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">
              {active.length === 0
                ? canEdit
                  ? "No active applications. Expand Add software or import a template."
                  : "No active applications."
                : "No applications in this category."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleActive.map((item) => (
              <SoftwareRow key={item.id} brandId={brandId} canEdit={canEdit} item={item} />
            ))}
          </div>
        )}

        {archived.length > 0 ? (
          <div className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowArchived((value) => !value)}
            >
              {showArchived ? "Hide archived" : `View archived (${archived.length})`}
            </Button>
            {showArchived ? (
              visibleArchived.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  No archived applications in this category.
                </p>
              ) : (
                visibleArchived.map((item) => (
                  <SoftwareRow key={item.id} brandId={brandId} canEdit={canEdit} item={item} />
                ))
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
