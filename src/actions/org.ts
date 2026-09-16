"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { unstable_update } from "@/auth";
import { requireArea, requireSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getActiveMembership, isDeactivatedUser } from "@/lib/membership";
import { ensureRolePermissions } from "@/lib/role-permissions";
import { currentPeriod, slugify } from "@/lib/scoring";

const onboardingSchema = z.object({
  organizationName: z.string().min(2),
  brandName: z.string().min(2),
  period: z.string().min(4).optional(),
});

export type OrgState = { error?: string } | undefined;

async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>) {
  const root = slugify(base) || "org";
  let slug = root;
  let n = 2;
  while (await exists(slug)) {
    slug = `${root}-${n}`;
    n += 1;
  }
  return slug;
}

export async function completeOnboarding(
  _prev: OrgState,
  formData: FormData,
): Promise<OrgState> {
  const session = await requireSession();
  if (await getActiveMembership(session.user.id)) {
    redirect("/app");
  }
  if (await isDeactivatedUser(session.user.id)) {
    return { error: "This account has been deactivated. Contact an organization owner." };
  }

  const parsed = onboardingSchema.safeParse({
    organizationName: formData.get("organizationName"),
    brandName: formData.get("brandName"),
    period: formData.get("period") || currentPeriod(),
  });
  if (!parsed.success) {
    return { error: "Organization and brand names are required." };
  }

  const orgSlug = await uniqueSlug(parsed.data.organizationName, async (slug) => {
    const found = await prisma.organization.findUnique({ where: { slug } });
    return Boolean(found);
  });

  const subcategories = await prisma.csfSubcategory.findMany({
    select: { id: true },
  });
  if (subcategories.length === 0) {
    return {
      error: "NIST CSF catalog is not seeded. Run `npx prisma db seed` first.",
    };
  }

  const brandSlug = slugify(parsed.data.brandName) || "brand";

  const organization = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: parsed.data.organizationName,
        slug: orgSlug,
      },
    });

    await tx.membership.create({
      data: {
        userId: session.user.id,
        organizationId: org.id,
        role: "ORG_OWNER",
      },
    });

    await ensureRolePermissions(org.id, tx);

    const brand = await tx.brand.create({
      data: {
        organizationId: org.id,
        name: parsed.data.brandName,
        slug: brandSlug,
      },
    });

    await tx.profile.create({
      data: {
        organizationId: org.id,
        brandId: brand.id,
        period: parsed.data.period ?? currentPeriod(),
        assessments: {
          create: subcategories.map((subcategory) => ({
            organizationId: org.id,
            subcategoryId: subcategory.id,
          })),
        },
      },
    });

    return org;
  });

  await unstable_update({
    user: {
      organizationId: organization.id,
      role: "ORG_OWNER",
    },
  });

  redirect("/app");
}

export async function createBrandAction(
  _prev: OrgState,
  formData: FormData,
): Promise<OrgState> {
  const membership = await requireArea("PROGRAM", "edit");
  const name = String(formData.get("name") ?? "").trim();
  const period = String(formData.get("period") ?? currentPeriod()).trim();
  if (name.length < 2) {
    return { error: "Brand name is required." };
  }

  const slug = await uniqueSlug(name, async (value) => {
    const found = await prisma.brand.findUnique({
      where: {
        organizationId_slug: {
          organizationId: membership.organizationId,
          slug: value,
        },
      },
    });
    return Boolean(found);
  });

  const subcategories = await prisma.csfSubcategory.findMany({
    select: { id: true },
  });

  const brand = await prisma.brand.create({
    data: {
      organizationId: membership.organizationId,
      name,
      slug,
      profiles: {
        create: {
          organizationId: membership.organizationId,
          period,
          assessments: {
            create: subcategories.map((subcategory) => ({
              organizationId: membership.organizationId,
              subcategoryId: subcategory.id,
            })),
          },
        },
      },
    },
  });

  redirect(`/app/brands/${brand.id}`);
}
