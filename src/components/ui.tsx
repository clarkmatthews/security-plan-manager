import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary:
      "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90",
    secondary:
      "bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-3)]",
    ghost: "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]",
    danger: "bg-[#8f3b3b] text-white hover:opacity-90",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full min-h-[88px] rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]", className)}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}
