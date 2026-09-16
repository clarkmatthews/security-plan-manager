"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { NavLink } from "@/lib/rbac";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app" || pathname.startsWith("/app/brands");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavMenu({
  links,
  homeHref,
}: {
  links: NavLink[];
  homeHref: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--foreground)] hover:bg-[var(--surface-2)]"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav
            id={panelId}
            className="absolute inset-y-0 left-0 z-10 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <Link
                href={homeHref}
                prefetch={false}
                className="text-sm font-semibold tracking-tight"
              >
                Security Plan Manager
              </Link>
              <button
                type="button"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-1">
              {links.map((link) => {
                const active = isActive(pathname, link.href);
                const children = link.children ?? [];
                return (
                  <div key={link.href}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm",
                        active
                          ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                          : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                      )}
                    >
                      {link.label}
                    </Link>
                    {children.length > 0 ? (
                      <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-[var(--border)] pl-2">
                        {children.map((child) => {
                          const childActive =
                            pathname === child.href || pathname.startsWith(`${child.href}/`);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              prefetch={false}
                              className={cn(
                                "rounded-md px-3 py-1.5 text-sm",
                                childActive
                                  ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                                  : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                              )}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
