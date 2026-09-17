import Link from "next/link";
import { requireArea } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { brandWhereFor } from "@/lib/brand-access";
import { computeScorecard, formatScore } from "@/lib/scoring";
import { toScoreInputs } from "@/lib/catalog";
import { CreateBrandForm } from "@/components/create-brand-form";
import { Card } from "@/components/ui";

export default async function AppHomePage() {
  const membership = await requireArea("PROGRAM", "view");

  const brands = await prisma.brand.findMany({
    where: brandWhereFor(membership),
    include: {
      profiles: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          assessments: {
            include: {
              evidence: true,
              subcategory: {
                include: { category: { include: { function: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Cybersecurity program</h1>
        <p className="mt-2 text-[var(--muted)]">
          Brands roll up Current vs Target NIST CSF 2.0 profiles for CISO and board reporting.
        </p>
      </div>

      {brands.length === 0 ? (
        <Card>
          {membership.permissions.PROGRAM.edit ? (
            <>
              <h2 className="text-lg font-medium">Create your first brand</h2>
              <p className="mt-2 mb-4 text-sm text-[var(--muted)]">
                The CSF catalog is already loaded. A profile will be created with all 106
                subcategories.
              </p>
              <CreateBrandForm />
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">No brands have been created yet.</p>
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {brands.map((brand) => {
              const profile = brand.profiles[0];
              const scorecard = profile
                ? computeScorecard(toScoreInputs(profile.assessments))
                : null;
              const card = (
                  <Card className="h-full transition hover:border-[var(--accent)]">
                    <h2 className="text-xl font-medium">{brand.name}</h2>
                    <div className="mt-4 flex gap-6 text-sm text-[var(--muted)]">
                      <span>Current {formatScore(scorecard?.overallCurrent ?? null)}</span>
                      <span>Target {formatScore(scorecard?.overallTarget ?? null)}</span>
                      <span>
                        Coverage {scorecard ? Math.round(scorecard.coverage * 100) : 0}%
                      </span>
                    </div>
                  </Card>
              );
              return (
                <Link key={brand.id} href={`/app/brands/${brand.id}`} prefetch={false}>
                  {card}
                </Link>
              );
            })}
          </div>
          {membership.permissions.PROGRAM.edit ? (
            <Card className="max-w-md">
              <h2 className="mb-4 text-lg font-medium">Add another brand</h2>
              <CreateBrandForm />
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

