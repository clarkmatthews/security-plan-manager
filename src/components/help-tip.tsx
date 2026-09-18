"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { HELP_TOPICS, type HelpTopicId } from "@/content/help-topics";
import { cn } from "@/lib/utils";

export function HelpTip({
  topic,
  className,
}: {
  topic: HelpTopicId;
  className?: string;
}) {
  const item = HELP_TOPICS[topic];
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onReposition() {
      const button = rootRef.current?.querySelector("button");
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const width = 320;
      const left = Math.min(rect.left, Math.max(8, window.innerWidth - width - 8));
      setCoords({ top: rect.bottom + 8, left });
    }

    onReposition();
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={cn("inline-flex shrink-0", className)}>
      <button
        type="button"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        aria-label={`About ${item.title}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const rect = event.currentTarget.getBoundingClientRect();
          const width = 320;
          const left = Math.min(rect.left, Math.max(8, window.innerWidth - width - 8));
          setCoords({ top: rect.bottom + 8, left });
          setOpen((current) => !current);
        }}
      >
        <CircleHelp className="h-4 w-4" aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={item.title}
          className="fixed z-50 w-72 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-left shadow-lg sm:w-80"
          style={{ top: coords.top, left: coords.left }}
        >
          <p className="text-sm font-medium text-[var(--foreground)]">{item.title}</p>
          {item.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-2 text-sm text-[var(--muted)]">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
    </span>
  );
}

export function HeadingWithHelp({
  as: Tag = "h1",
  topic,
  className,
  children,
}: {
  as?: "h1" | "h2";
  topic: HelpTopicId;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Tag className={className}>{children}</Tag>
      <HelpTip topic={topic} />
    </div>
  );
}

export function WidgetLabel({
  topic,
  children,
}: {
  topic: HelpTopicId;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{children}</div>
      <HelpTip topic={topic} />
    </div>
  );
}
