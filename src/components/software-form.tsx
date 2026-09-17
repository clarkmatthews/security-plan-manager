"use client";

import { useActionState } from "react";
import {
  createSoftwareAction,
  updateSoftwareAction,
  type SoftwareState,
} from "@/actions/software";
import { SOFTWARE_CATEGORIES } from "@/lib/software";
import { Input, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function SoftwareForm({
  brandId,
  softwareId,
  defaults,
  submitLabel,
}: {
  brandId: string;
  softwareId?: string;
  defaults?: {
    productName: string;
    companyName: string;
    version: string;
    category: string;
    notes: string;
  };
  submitLabel: string;
}) {
  const action = softwareId
    ? updateSoftwareAction.bind(null, brandId, softwareId)
    : createSoftwareAction.bind(null, brandId);
  const [state, formAction] = useActionState<SoftwareState, FormData>(action, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${softwareId ?? "new"}-productName`}>Product name</Label>
        <Input
          id={`${softwareId ?? "new"}-productName`}
          name="productName"
          defaultValue={defaults?.productName}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${softwareId ?? "new"}-companyName`}>Company name</Label>
        <Input
          id={`${softwareId ?? "new"}-companyName`}
          name="companyName"
          defaultValue={defaults?.companyName}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${softwareId ?? "new"}-version`}>Version</Label>
        <Input
          id={`${softwareId ?? "new"}-version`}
          name="version"
          defaultValue={defaults?.version}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${softwareId ?? "new"}-category`}>Category</Label>
        <Select
          id={`${softwareId ?? "new"}-category`}
          name="category"
          defaultValue={defaults?.category ?? "BUSINESS_APPLICATION"}
          required
        >
          {SOFTWARE_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${softwareId ?? "new"}-notes`}>Notes</Label>
        <Textarea
          id={`${softwareId ?? "new"}-notes`}
          name="notes"
          defaultValue={defaults?.notes}
        />
      </div>
      {state?.error ? (
        <p className="sm:col-span-2 text-sm text-[#e07a7a]">{state.error}</p>
      ) : null}
      <div className="sm:col-span-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
