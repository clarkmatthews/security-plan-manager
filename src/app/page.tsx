import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui";
import { organizationExists } from "@/lib/signup-policy";

export default async function HomePage() {
  const session = await auth();
  const href = session?.user ? "/app" : "/login";
  const canBootstrap = !(await organizationExists());

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="font-semibold">Security Plan Manager</div>
        <Link href={href}>
          <Button>{session?.user ? "Open workspace" : "Sign in"}</Button>
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">
          NIST Cybersecurity Framework 2.0
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight">
          Score a brand against NIST CSF, then report it to the CISO and the board.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--muted)]">
          Operators assess Current vs Target profiles across Govern, Identify, Protect,
          Detect, Respond, and Recover. Leadership sees derived scores, coverage, and
          freezeable board snapshots - without losing the native NIST language.
        </p>
        <div className="mt-10 flex gap-4">
          {canBootstrap ? (
            <Link href="/signup">
              <Button>Create an organization</Button>
            </Link>
          ) : null}
          <Link href="/login">
            <Button variant={canBootstrap ? "secondary" : "primary"}>Sign in</Button>
          </Link>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            ["Operators", "Work subcategory by subcategory with evidence, tiers, and gap notes."],
            ["CISO", "Watch function heatmaps, coverage, and the largest control gaps."],
            ["Board", "Read published snapshots that stay frozen after operators keep scoring."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="font-medium">{title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
