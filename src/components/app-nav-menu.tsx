"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { NavLink } from "@/lib/rbac";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string, exact = false) {
  if (exact || href === "/app") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function brandRoot(path: string) {
  const match = path.match(/^\/app\/brands\/[^/]+/);
  return match?.[0] ?? null;
}

function NavLinkList({
  links,
  pathname,
  depth = 0,
  onNavigate,
}: {
  links: NavLink[];
  pathname: string;
  depth?: number;
  onNavigate: (href: string) => void;
}) {
  return (
    <div
      className={
        depth === 0
          ? "flex flex-col gap-1"
          : "ml-3 mt-1 flex flex-col gap-0.5 border-l border-[var(--border)] pl-2"
      }
    >
      {links.map((link) => {
        const children = link.children ?? [];
        const hasChildren = children.length > 0;
        const active = isActive(pathname, link.href, hasChildren);
        return (
          <div key={`${link.href}:${link.label}`}>
            <Link
              href={link.href}
              prefetch={false}
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey ||
                  event.button !== 0
                ) {
                  return;
                }
                event.preventDefault();
                onNavigate(link.href);
              }}
              className={cn(
                "block cursor-pointer rounded-md px-3 text-sm",
                depth === 0 ? "py-2" : "py-1.5",
                active
                  ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
              )}
            >
              {link.label}
            </Link>
            {hasChildren ? (
              <NavLinkList
                links={children}
                pathname={pathname}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
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
  const router = useRouter();
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

  function goTo(href: string) {
    if (pathname === href) {
      setOpen(false);
      return;
    }

    // App Router can no-op Link/router.push for parent routes (dashboard vs
    // assessment) and for sibling brand dashboards that share [brandId].
    const currentBrand = brandRoot(pathname);
    const nextBrand = brandRoot(href);
    if (
      pathname.startsWith(`${href}/`) ||
      (currentBrand && nextBrand && currentBrand !== nextBrand)
    ) {
      window.location.assign(href);
      return;
    }

    router.push(href);
  }

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
            className="absolute inset-0 z-0 bg-black/55"
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
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  ) {
                    return;
                  }
                  event.preventDefault();
                  goTo(homeHref);
                }}
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
              <NavLinkList links={links} pathname={pathname} onNavigate={goTo} />
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
