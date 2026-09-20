"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CsfTier, Priority } from "@prisma/client";
import {
  addEvidenceAction,
  deleteEvidenceAction,
  saveAssessmentAction,
  setIncludedInProfileAction,
  updateTiersAction,
} from "@/actions/assessment";
import { SafeExternalLink } from "@/components/safe-external-link";
import { Badge, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { compareByCatalog } from "@/lib/catalog";
import {
  FUNCTION_META,
  FUNCTION_ORDER,
  INITIAL_TIER_CHANGE_COMMENT,
  TIER_LABEL,
  TIER_VALUE,
  formatTierValue,
  isFunctionCode,
} from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { HelpTip } from "@/components/help-tip";

export type EvidenceItem = {
  id: string;
  title: string;
  url: string | null;
  notes: string | null;
  fileName: string | null;
  storedName: string | null;
};

export type AssessmentChangeItem = {
  id: string;
  field: "CURRENT_TIER" | "TARGET_TIER";
  fromValue: string | null;
  toValue: string | null;
  comment: string | null;
  createdAt: string;
  userName: string;
  userEmail: string | null;
};

export type AssessmentRow = {
  id: string;
  includedInProfile: boolean;
  rationale: string | null;
  currentPriority: Priority | null;
  currentStatus: string | null;
  currentTier: CsfTier | null;
  currentPolicies: string | null;
  currentPractices: string | null;
  currentRoles: string | null;
  currentReferences: string | null;
  targetPriority: Priority | null;
  targetTier: CsfTier | null;
  targetPolicies: string | null;
  targetPractices: string | null;
  targetRoles: string | null;
  targetReferences: string | null;
  notes: string | null;
  considerations: string | null;
  evidence: EvidenceItem[];
  changes: AssessmentChangeItem[];
  subcategory: {
    code: string;
    description: string;
    category: {
      code: string;
      name: string;
      description: string;
      function: { code: string; name: string; description: string };
    };
  };
};

const FIELD_LABEL = {
  CURRENT_TIER: "Current",
  TARGET_TIER: "Target",
} as const;

const TIERS: CsfTier[] = ["PARTIAL", "RISK_INFORMED", "REPEATABLE", "ADAPTIVE"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

function gapFor(row: AssessmentRow) {
  const current = row.currentTier ? TIER_VALUE[row.currentTier] : 0;
  const target = row.targetTier ? TIER_VALUE[row.targetTier] : 0;
  return target - current;
}

export function AssessmentNavigator({
  assessments,
  canEdit,
  canView,
  canEditEvidence,
  initialFunction = "ALL",
}: {
  assessments: AssessmentRow[];
  canEdit: boolean;
  canView?: boolean;
  canEditEvidence?: boolean;
  initialFunction?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [functionFilter, setFunctionFilter] = useState(
    isFunctionCode(initialFunction) ? initialFunction : "ALL",
  );
  const scopeFromUrl = searchParams.get("scope");
  const [view, setView] = useState<"all" | "included" | "excluded">(
    scopeFromUrl === "included" || scopeFromUrl === "excluded" ? scopeFromUrl : "all",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const allowView = canView !== false;
  const allowEvidenceEdit = canEditEvidence ?? canEdit;

  useEffect(() => {
    const fromUrl = searchParams.get("function");
    const next = isFunctionCode(fromUrl) ? fromUrl : "ALL";
    setFunctionFilter(next);
    const scope = searchParams.get("scope");
    if (scope === "included" || scope === "excluded" || scope === "all") {
      setView(scope);
    }
  }, [searchParams]);

  const ordered = useMemo(
    () => assessments.slice().sort(compareByCatalog),
    [assessments],
  );

  const filtered = useMemo(() => {
    return ordered.filter((row) => {
      const fn = row.subcategory.category.function.code;
      if (functionFilter !== "ALL" && fn !== functionFilter) return false;
      if (view === "included" && !row.includedInProfile) return false;
      if (view === "excluded" && row.includedInProfile) return false;
      if (query) {
        const haystack = `${row.subcategory.code} ${row.subcategory.description}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [ordered, functionFilter, view, query]);

  const selected = assessments.find((row) => row.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  function applyFunctionFilter(code: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (code === "ALL") params.delete("function");
    else params.set("function", code);
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  function applyScopeFilter(nextView: "all" | "included" | "excluded") {
    setView(nextView);
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === "all") params.delete("scope");
    else params.set("scope", nextView);
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        {allowView
          ? "Click an outcome to open its full description and edit history."
          : "Outcome list is read-only for your role."}
      </p>
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", ...FUNCTION_ORDER].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => applyFunctionFilter(code)}
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
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search subcategory codes or outcomes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="max-w-sm"
          />
          <Select
            value={view}
            onChange={(event) =>
              applyScopeFilter(event.target.value as "all" | "included" | "excluded")
            }
            className="max-w-[180px]"
          >
            <option value="all">All</option>
            <option value="included">Included</option>
            <option value="excluded">Excluded</option>
          </Select>
        </div>
        <div className="rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="rounded-tl-xl px-4 py-3">Outcome</th>
                <th className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    Current
                    <HelpTip topic="assessmentTiers" />
                  </span>
                </th>
                <th className="px-4 py-3">Target</th>
                <th className="rounded-tr-xl px-4 py-3">Gap</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const color =
                  FUNCTION_META[row.subcategory.category.function.code]?.color ??
                  "#93a0b8";
                return (
                  <tr
                    key={row.id}
                    onClick={() => {
                      if (allowView) setSelectedId(row.id);
                    }}
                    className={cn(
                      "border-t border-[var(--border)]",
                      allowView && "cursor-pointer hover:bg-[var(--surface-2)]",
                      selectedId === row.id && "bg-[var(--surface-2)]",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-1 h-2 w-2 shrink-0 rounded-full"
                          style={{ background: color }}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="font-medium text-left hover:underline"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (allowView) setSelectedId(row.id);
                              }}
                            >
                              {row.subcategory.code}
                            </button>
                            {!row.includedInProfile ? <Badge>Excluded</Badge> : null}
                          </div>
                          <div className="line-clamp-2 text-[var(--muted)]">
                            {row.subcategory.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <InlineTierSelect
                        canEdit={canEdit}
                        value={row.currentTier}
                        otherValue={row.targetTier}
                        field="current"
                        assessmentId={row.id}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <InlineTierSelect
                        canEdit={canEdit}
                        value={row.targetTier}
                        otherValue={row.currentTier}
                        field="target"
                        assessmentId={row.id}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {gapFor(row) > 0 ? `+${gapFor(row)}` : gapFor(row)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      {selected && allowView ? (
        <AssessmentDetail
          key={selected.id}
          assessment={selected}
          canEdit={canEdit}
          canEditEvidence={allowEvidenceEdit}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}

function InlineTierSelect({
  assessmentId,
  field,
  value,
  otherValue,
  canEdit,
}: {
  assessmentId: string;
  field: "current" | "target";
  value: CsfTier | null;
  otherValue: CsfTier | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const emptyLabel = field === "current" ? "Not scored" : "Not set";
  const displayValue = draftValue ?? value ?? "";

  if (!canEdit) {
    return (
      <span className="text-[var(--muted)]">
        {value ? TIER_LABEL[value] : emptyLabel}
      </span>
    );
  }

  return (
    <>
      <Select
        value={displayValue}
        disabled={pending}
        className="min-w-[140px]"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          event.stopPropagation();
          const next = event.target.value;
          if (next === (value ?? "")) return;
          setDraftValue(next);
          if (value) return;
          const current = field === "current" ? next : (otherValue ?? "");
          const target = field === "target" ? next : (otherValue ?? "");
          startTransition(async () => {
            const result = await updateTiersAction(
              assessmentId,
              current,
              target,
              INITIAL_TIER_CHANGE_COMMENT,
            );
            if (result?.error) {
              setDraftValue(null);
              return;
            }
            setDraftValue(null);
            router.refresh();
          });
        }}
      >
        <option value="">{emptyLabel}</option>
        {TIERS.map((tier) => (
          <option key={tier} value={tier}>
            {TIER_LABEL[tier]}
          </option>
        ))}
      </Select>
      <ChangeReasonDialog
        open={draftValue !== null && Boolean(value)}
        field={field}
        pending={pending}
        onCancel={() => setDraftValue(null)}
        onConfirm={(comment) => {
          const next = draftValue ?? "";
          const current = field === "current" ? next : (otherValue ?? "");
          const target = field === "target" ? next : (otherValue ?? "");
          startTransition(async () => {
            const result = await updateTiersAction(assessmentId, current, target, comment);
            if (result?.error) return;
            setDraftValue(null);
            router.refresh();
          });
        }}
      />
    </>
  );
}

function ChangeReasonDialog({
  open,
  field,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  field: "current" | "target";
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (comment: string) => void;
}) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open) setComment("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4"
      onClick={(event) => {
        event.stopPropagation();
        if (!pending) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">
          Reason for {field === "current" ? "Current" : "Target"} change
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Optional. You can save the new value without a comment.
        </p>
        <Textarea
          className="mt-4"
          autoFocus
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="What changed and why?"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={() => onConfirm(comment)}>
            {pending ? "Saving…" : "Save change"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssessmentDetail({
  assessment,
  canEdit,
  canEditEvidence,
  onClose,
}: {
  assessment: AssessmentRow;
  canEdit: boolean;
  canEditEvidence: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [saveState, saveAction] = useActionState(
    async (prev: Awaited<ReturnType<typeof saveAssessmentAction>>, formData: FormData) => {
      const result = await saveAssessmentAction(prev, formData);
      if (result?.ok) router.refresh();
      return result;
    },
    undefined,
  );
  const [evidenceState, evidenceAction] = useActionState(
    async (prev: Awaited<ReturnType<typeof addEvidenceAction>>, formData: FormData) => {
      const result = await addEvidenceAction(prev, formData);
      if (result?.ok) router.refresh();
      return result;
    },
    undefined,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tierComment, setTierComment] = useState("");
  const [currentTier, setCurrentTier] = useState(assessment.currentTier ?? "");
  const [targetTier, setTargetTier] = useState(assessment.targetTier ?? "");
  const [confirmedCurrent, setConfirmedCurrent] = useState(assessment.currentTier ?? "");
  const [confirmedTarget, setConfirmedTarget] = useState(assessment.targetTier ?? "");
  const [pendingField, setPendingField] = useState<"current" | "target" | null>(null);
  const [included, setIncluded] = useState(assessment.includedInProfile);
  const [includePending, startInclude] = useTransition();
  const fn = assessment.subcategory.category.function;
  const category = assessment.subcategory.category;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        className="mx-auto my-6 w-full max-w-5xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
              {fn.code} · {category.code}
            </div>
            <h2 className="mt-1 text-2xl font-semibold">{assessment.subcategory.code}</h2>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-5 space-y-4 text-sm">
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Function · {fn.code}
              {FUNCTION_META[fn.code]?.short ? ` · ${FUNCTION_META[fn.code].short}` : ""}
            </h3>
            <p className="mt-1 leading-6 text-[var(--foreground)]">{fn.description}</p>
          </section>
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Category · {category.code}
              {category.name &&
              category.name !== category.description &&
              category.name.length < 80
                ? ` · ${category.name}`
                : ""}
            </h3>
            <p className="mt-1 leading-6 text-[var(--foreground)]">{category.description}</p>
          </section>
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Outcome · {assessment.subcategory.code}
            </h3>
            <p className="mt-1 leading-6 text-[var(--foreground)]">
              {assessment.subcategory.description}
            </p>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
          <div className="space-y-4">
      <form action={saveAction} className="space-y-4">
        <input type="hidden" name="assessmentId" value={assessment.id} />
        <input type="hidden" name="tierChangeComment" value={tierComment} />
        {included ? <input type="hidden" name="includedInProfile" value="on" /> : null}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={included}
            disabled={!canEdit || includePending}
            onChange={(event) => {
              const next = event.target.checked;
              setIncluded(next);
              startInclude(async () => {
                const result = await setIncludedInProfileAction(assessment.id, next);
                if (result?.error) {
                  setIncluded(!next);
                  return;
                }
                router.refresh();
              });
            }}
          />
          Included in organizational profile
        </label>
        <div>
          <Label htmlFor="rationale">Rationale</Label>
          <Textarea
            id="rationale"
            name="rationale"
            defaultValue={assessment.rationale ?? ""}
            disabled={!canEdit}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="currentTier">Current tier</Label>
            <Select
              id="currentTier"
              name="currentTier"
              value={currentTier}
              disabled={!canEdit}
              onChange={(event) => {
                const next = event.target.value;
                setCurrentTier(next);
                if (next === confirmedCurrent) return;
                if (!assessment.currentTier) {
                  setConfirmedCurrent(next);
                  return;
                }
                setPendingField("current");
              }}
            >
              <option value="">Not scored</option>
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {TIER_LABEL[tier]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="targetTier">Target tier</Label>
            <Select
              id="targetTier"
              name="targetTier"
              value={targetTier}
              disabled={!canEdit}
              onChange={(event) => {
                const next = event.target.value;
                setTargetTier(next);
                if (next === confirmedTarget) return;
                if (!assessment.targetTier) {
                  setConfirmedTarget(next);
                  return;
                }
                setPendingField("target");
              }}
            >
              <option value="">Not set</option>
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {TIER_LABEL[tier]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="currentPriority">Current priority</Label>
            <Select
              id="currentPriority"
              name="currentPriority"
              defaultValue={assessment.currentPriority ?? ""}
              disabled={!canEdit}
            >
              <option value="">—</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="targetPriority">Target priority</Label>
            <Select
              id="targetPriority"
              name="targetPriority"
              defaultValue={assessment.targetPriority ?? ""}
              disabled={!canEdit}
            >
              <option value="">—</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="currentStatus">Current status</Label>
          <Input
            id="currentStatus"
            name="currentStatus"
            defaultValue={assessment.currentStatus ?? ""}
            disabled={!canEdit}
          />
        </div>
        <div>
          <Label htmlFor="currentPractices">Current practices</Label>
          <Textarea
            id="currentPractices"
            name="currentPractices"
            defaultValue={assessment.currentPractices ?? ""}
            disabled={!canEdit}
          />
        </div>
        <div>
          <Label htmlFor="targetPractices">Target practices</Label>
          <Textarea
            id="targetPractices"
            name="targetPractices"
            defaultValue={assessment.targetPractices ?? ""}
            disabled={!canEdit}
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={assessment.notes ?? ""} disabled={!canEdit} />
        </div>
        {canEdit ? <SubmitButton>Save assessment</SubmitButton> : null}
        {saveState?.error ? <p className="text-sm text-[#e07a7a]">{saveState.error}</p> : null}
        {saveState?.ok ? <p className="text-sm text-[#4faf78]">Saved.</p> : null}
      </form>

      <ChangeReasonDialog
        open={pendingField !== null}
        field={pendingField ?? "current"}
        onCancel={() => {
          if (pendingField === "current") setCurrentTier(confirmedCurrent);
          if (pendingField === "target") setTargetTier(confirmedTarget);
          setPendingField(null);
        }}
        onConfirm={(comment) => {
          if (pendingField === "current") setConfirmedCurrent(currentTier);
          if (pendingField === "target") setConfirmedTarget(targetTier);
          setTierComment(comment);
          setPendingField(null);
        }}
      />

      <div className="space-y-3 border-t border-[var(--border)] pt-4">
        <h3 className="text-sm font-medium">Evidence</h3>
        {assessment.evidence.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No evidence linked yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {assessment.evidence.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3"
              >
                <div className="font-medium">{item.title}</div>
                {item.storedName ? (
                  <a
                    href={`/api/evidence/${item.id}/file`}
                    className="mt-1 block text-[var(--accent)] underline"
                  >
                    Download {item.fileName ?? "file"}
                  </a>
                ) : null}
                {item.url ? (
                  <SafeExternalLink
                    href={item.url}
                    className="mt-1 block text-[var(--accent)] underline"
                  >
                    {item.url}
                  </SafeExternalLink>
                ) : null}
                {item.notes ? (
                  <p className="mt-1 text-[var(--muted)]">{item.notes}</p>
                ) : null}
                {canEditEvidence ? (
                  <button
                    type="button"
                    className="mt-2 text-xs text-[#e07a7a]"
                    disabled={deletingId === item.id}
                    onClick={async () => {
                      setDeletingId(item.id);
                      await deleteEvidenceAction(item.id);
                      router.refresh();
                      setDeletingId(null);
                    }}
                  >
                    {deletingId === item.id ? "Removing…" : "Remove"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {canEditEvidence ? (
        <form action={evidenceAction} className="space-y-3">
          <h3 className="text-sm font-medium">Add evidence</h3>
          <input type="hidden" name="assessmentId" value={assessment.id} />
          <Input name="title" placeholder="Evidence title" />
          <div>
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.txt,application/pdf,image/png,image/jpeg"
            />
          </div>
          <Input name="url" placeholder="https://..." />
          <Textarea name="notes" placeholder="Notes" />
          <SubmitButton variant="secondary">Attach evidence</SubmitButton>
          {evidenceState?.error ? (
            <p className="text-sm text-[#e07a7a]">{evidenceState.error}</p>
          ) : null}
          {evidenceState?.ok ? (
            <p className="text-sm text-[#4faf78]">Evidence added.</p>
          ) : null}
        </form>
      ) : null}
          </div>

          <aside className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <h3 className="text-sm font-medium">Edit history</h3>
            {assessment.changes.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No Current or Target changes have been recorded for this outcome yet.
              </p>
            ) : (
              <ol className="space-y-3">
                {assessment.changes.map((change) => (
                  <li key={change.id} className="border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0">
                    <div className="text-xs text-[var(--muted)]">
                      {new Date(change.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm font-medium">{change.userName}</div>
                    <div className="mt-1 text-sm">
                      {FIELD_LABEL[change.field]}: {formatTierValue(change.fromValue)} →{" "}
                      {formatTierValue(change.toValue)}
                    </div>
                    {change.comment ? (
                      <p className="mt-1 text-sm text-[var(--muted)]">{change.comment}</p>
                    ) : (
                      <p className="mt-1 text-sm text-[var(--muted)]">No comment</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
