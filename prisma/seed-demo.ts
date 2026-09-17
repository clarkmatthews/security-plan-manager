import bcrypt from "bcryptjs";
import type { CsfTier, Priority, PrismaClient } from "@prisma/client";
import { computeScorecard } from "../src/lib/scoring";
import { toScoreInputs } from "../src/lib/catalog";
import { MANAGED_ROLES, PRODUCT_AREAS, defaultPermissionMap } from "../src/lib/rbac";
import { ensureOrganizationRoles, renameLegacyCsoIdentity } from "../src/lib/org-roles";

export const DEMO_PASSWORD = "ChangeMe123!";

const TIERS: CsfTier[] = [
  "PARTIAL",
  "RISK_INFORMED",
  "REPEATABLE",
  "ADAPTIVE",
];

const FUNCTION_BASE: Record<string, { current: number; target: number }> = {
  GV: { current: 2, target: 3 },
  ID: { current: 2, target: 3 },
  PR: { current: 3, target: 3 },
  DE: { current: 1, target: 3 },
  RS: { current: 2, target: 3 },
  RC: { current: 1, target: 3 },
};

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

function clampTier(index: number): CsfTier {
  return TIERS[Math.max(0, Math.min(TIERS.length - 1, index))];
}

function sampleFor(
  functionCode: string,
  sortOrder: number,
  coverage: "full" | "partial",
) {
  const base = FUNCTION_BASE[functionCode] ?? { current: 1, target: 3 };
  const excluded = coverage === "full" ? sortOrder % 17 === 0 : sortOrder % 9 === 0;
  const unscored =
    coverage === "full" ? sortOrder % 13 === 0 : sortOrder % 4 === 0;
  const currentIndex = Math.max(0, base.current - (sortOrder % 5 === 0 ? 1 : 0));
  const targetIndex = Math.min(3, base.target + (sortOrder % 8 === 0 ? 1 : 0));

  return {
    includedInProfile: !excluded,
    currentTier: excluded || unscored ? null : clampTier(currentIndex),
    targetTier: excluded ? null : clampTier(targetIndex),
    currentPriority: excluded
      ? null
      : PRIORITIES[functionCode === "DE" || functionCode === "RC" ? 2 : sortOrder % 3],
    targetPriority: excluded ? null : "HIGH",
    currentStatus:
      excluded || unscored
        ? null
        : currentIndex >= 3
          ? "Managed and reviewed"
          : currentIndex >= 2
            ? "Implemented with exceptions"
            : "Ad hoc / in progress",
    currentPractices: excluded
      ? null
      : "Documented control owner, quarterly review, and evidence in the GRC workspace.",
    targetPractices: excluded
      ? null
      : "Organization-wide standard with automated monitoring and board-level KRIs.",
    notes: excluded ? "Out of scope for this brand profile." : null,
  };
}

export async function seedDemoWorkspace(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await renameLegacyCsoIdentity(prisma);

  const ciso = await prisma.user.upsert({
    where: { email: "ciso@apex.example" },
    update: { name: "Jordan Hale", passwordHash },
    create: {
      email: "ciso@apex.example",
      name: "Jordan Hale",
      passwordHash,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@apex.example" },
    update: { name: "Sam Okonkwo", passwordHash },
    create: {
      email: "analyst@apex.example",
      name: "Sam Okonkwo",
      passwordHash,
    },
  });

  const board = await prisma.user.upsert({
    where: { email: "board@apex.example" },
    update: { name: "Priya Shah", passwordHash },
    create: {
      email: "board@apex.example",
      name: "Priya Shah",
      passwordHash,
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "apex-consumer" },
    update: { name: "Apex Consumer Brands" },
    create: {
      name: "Apex Consumer Brands",
      slug: "apex-consumer",
    },
  });

  await Promise.all([
    prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: ciso.id,
          organizationId: organization.id,
        },
      },
      update: { role: "CISO" },
      create: {
        userId: ciso.id,
        organizationId: organization.id,
        role: "CISO",
      },
    }),
    prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: analyst.id,
          organizationId: organization.id,
        },
      },
      update: { role: "ASSESSOR" },
      create: {
        userId: analyst.id,
        organizationId: organization.id,
        role: "ASSESSOR",
      },
    }),
    prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: board.id,
          organizationId: organization.id,
        },
      },
      update: { role: "EXEC_VIEWER" },
      create: {
        userId: board.id,
        organizationId: organization.id,
        role: "EXEC_VIEWER",
      },
    }),
  ]);

  await ensureOrganizationRoles(organization.id, prisma);

  const permissionCount = await prisma.rolePermission.count({
    where: { organizationId: organization.id },
  });
  if (permissionCount === 0) {
    await prisma.rolePermission.createMany({
      data: MANAGED_ROLES.flatMap((role) => {
        const access = defaultPermissionMap(role);
        return PRODUCT_AREAS.map((area) => ({
          organizationId: organization.id,
          role,
          area: area.code,
          canRead: access[area.code].view,
          canView: access[area.code].view,
          canEdit: access[area.code].edit,
        }));
      }),
    });
  }

  const retail = await prisma.brand.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "apex-retail",
      },
    },
    update: { name: "Apex Retail" },
    create: {
      organizationId: organization.id,
      name: "Apex Retail",
      slug: "apex-retail",
      description: "Consumer retail brand used for the published board scorecard.",
    },
  });

  const wholesale = await prisma.brand.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "apex-wholesale",
      },
    },
    update: { name: "Apex Wholesale" },
    create: {
      organizationId: organization.id,
      name: "Apex Wholesale",
      slug: "apex-wholesale",
      description: "In-progress assessment with lower coverage.",
    },
  });

  const subcategories = await prisma.csfSubcategory.findMany({
    include: { category: { include: { function: true } } },
    orderBy: { sortOrder: "asc" },
  });

  const retailProfile = await seedBrandProfile(prisma, {
    organizationId: organization.id,
    brandId: retail.id,
    period: "2026-Q3",
    coverage: "full",
    subcategories,
    publishedById: ciso.id,
    evidenceById: analyst.id,
    publish: true,
  });

  await seedBrandProfile(prisma, {
    organizationId: organization.id,
    brandId: wholesale.id,
    period: "2026-Q3",
    coverage: "partial",
    subcategories,
    publishedById: ciso.id,
    evidenceById: analyst.id,
    publish: false,
  });

  console.log("Demo workspace: Apex Consumer Brands");
  console.log("  CISO     ciso@apex.example / ChangeMe123!");
  console.log("  Analyst  analyst@apex.example / ChangeMe123!");
  console.log("  Board    board@apex.example / ChangeMe123!");
  console.log(`  Published retail profile ${retailProfile.period}`);
}

async function seedBrandProfile(
  prisma: PrismaClient,
  args: {
    organizationId: string;
    brandId: string;
    period: string;
    coverage: "full" | "partial";
    subcategories: Array<{
      id: string;
      sortOrder: number;
      category: { function: { code: string } };
    }>;
    publishedById: string;
    evidenceById: string;
    publish: boolean;
  },
) {
  const profile = await prisma.profile.upsert({
    where: {
      brandId_period: {
        brandId: args.brandId,
        period: args.period,
      },
    },
    update: { status: args.publish ? "PUBLISHED" : "DRAFT" },
    create: {
      organizationId: args.organizationId,
      brandId: args.brandId,
      period: args.period,
      status: args.publish ? "PUBLISHED" : "DRAFT",
    },
  });

  for (const subcategory of args.subcategories) {
    const sample = sampleFor(
      subcategory.category.function.code,
      subcategory.sortOrder,
      args.coverage,
    );
    await prisma.subcategoryAssessment.upsert({
      where: {
        profileId_subcategoryId: {
          profileId: profile.id,
          subcategoryId: subcategory.id,
        },
      },
      update: {
        ...sample,
        organizationId: args.organizationId,
      },
      create: {
        organizationId: args.organizationId,
        profileId: profile.id,
        subcategoryId: subcategory.id,
        ...sample,
      },
    });
  }

  await prisma.evidence.deleteMany({
    where: {
      organizationId: args.organizationId,
      assessment: { profileId: profile.id },
    },
  });

  if (args.coverage === "full") {
    const evidenceCodes = [
      "GV.SC-07",
      "ID.RA-05",
      "PR.AA-05",
      "DE.CM-01",
      "RC.RP-01",
    ];
    const assessments = await prisma.subcategoryAssessment.findMany({
      where: {
        profileId: profile.id,
        subcategory: { code: { in: evidenceCodes } },
      },
      include: { subcategory: true },
    });

    for (const assessment of assessments) {
      await prisma.evidence.create({
        data: {
          organizationId: args.organizationId,
          assessmentId: assessment.id,
          title: `Demo: ${assessment.subcategory.code} control evidence`,
          url: `https://intranet.apex.example/grc/${assessment.subcategory.code.toLowerCase()}`,
          notes: "Sample artifact for dashboard and evidence-locker evaluation.",
          createdById: args.evidenceById,
        },
      });
    }
  }

  const scored = await prisma.subcategoryAssessment.findMany({
    where: { profileId: profile.id },
    include: {
      evidence: true,
      subcategory: {
        include: { category: { include: { function: true } } },
      },
    },
  });

  const brand = await prisma.brand.findUniqueOrThrow({
    where: { id: args.brandId },
  });
  const scorecard = computeScorecard(toScoreInputs(scored));

  await prisma.reportSnapshot.deleteMany({
    where: { profileId: profile.id },
  });

  if (args.publish) {
    await prisma.reportSnapshot.create({
      data: {
        organizationId: args.organizationId,
        profileId: profile.id,
        publishedById: args.publishedById,
        scoresJson: {
          brandId: brand.id,
          brandName: brand.name,
          period: args.period,
          publishedAt: new Date().toISOString(),
          scorecard,
        },
      },
    });
  }

  return profile;
}
