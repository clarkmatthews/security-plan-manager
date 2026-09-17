"use client";

import { useState } from "react";
import {
  archiveSoftwareAction,
  unarchiveSoftwareAction,
} from "@/actions/software";
import { softwareCategoryLabel } from "@/lib/software";
import type { SoftwareCategory } from "@prisma/client";
import { Button } from "@/components/ui";
import { SoftwareForm } from "@/components/software-form";

export function SoftwareRow({
  brandId,
  canEdit,
  item,
}: {
  brandId: string;
  canEdit: boolean;
  item: {
    id: string;
    productName: string;
    companyName: string;
    version: string;
    category: SoftwareCategory;
    notes: string | null;
    archivedAt: Date | string | null;
  };
}) {
  const [editing, setEditing] = useState(false);
  const archived = Boolean(item.archivedAt);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
            {softwareCategoryLabel(item.category)}
            {archived ? " · Archived" : ""}
          </div>
          <h2 className="mt-1 text-lg font-medium">{item.productName}</h2>
          <p className="text-sm text-[var(--muted)]">
            {item.companyName} · {item.version}
          </p>
          {item.notes ? <p className="mt-2 text-sm text-[var(--muted)]">{item.notes}</p> : null}
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing((value) => !value)}>
              {editing ? "Close" : "Edit"}
            </Button>
            <form action={archived ? unarchiveSoftwareAction.bind(null, brandId, item.id) : archiveSoftwareAction.bind(null, brandId, item.id)}>
              <Button type="submit" variant={archived ? "secondary" : "ghost"}>
                {archived ? "Restore" : "Archive"}
              </Button>
            </form>
          </div>
        ) : null}
      </div>
      {editing && canEdit ? (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <SoftwareForm
            brandId={brandId}
            softwareId={item.id}
            submitLabel="Save software"
            defaults={{
              productName: item.productName,
              companyName: item.companyName,
              version: item.version,
              category: item.category,
              notes: item.notes ?? "",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
