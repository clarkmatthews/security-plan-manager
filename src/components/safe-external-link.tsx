import type { ReactNode } from "react";
import { parseSafeHttpUrl } from "@/lib/safe-url";

export function SafeExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children?: ReactNode;
}) {
  const safe = parseSafeHttpUrl(href);
  if (!safe) return null;
  return (
    <a href={safe} className={className} target="_blank" rel="noopener noreferrer">
      {children ?? safe}
    </a>
  );
}
