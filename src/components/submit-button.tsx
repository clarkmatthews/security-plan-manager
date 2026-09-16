"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";

export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? "Working…" : children}
    </Button>
  );
}
