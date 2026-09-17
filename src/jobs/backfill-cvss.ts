import { prisma } from "../lib/prisma";
import { backfillCvssFromSummaries } from "../lib/cve-sync";
import { parseCvssFromText } from "../lib/cvss";

async function main() {
  const updated = await backfillCvssFromSummaries();
  const [total, scored, high] = await Promise.all([
    prisma.cveRecord.count(),
    prisma.cveRecord.count({ where: { cvssScore: { not: null } } }),
    prisma.cveRecord.count({ where: { cvssScore: { gt: 7.5 } } }),
  ]);
  const fusion = await prisma.softwareCveMatch.findMany({
    where: {
      acknowledgedAt: null,
      software: { archivedAt: null, productName: { contains: "Fusion", mode: "insensitive" } },
    },
    include: {
      cve: { select: { cveId: true, summary: true, cvssScore: true } },
      software: { select: { productName: true, companyName: true } },
    },
    take: 8,
  });
  console.log(
    JSON.stringify(
      {
        backfilled: updated,
        total,
        scored,
        high,
        fusion: fusion.map((row) => ({
          product: row.software.productName,
          cveId: row.cve.cveId,
          cvssScore: row.cve.cvssScore,
          parsed: parseCvssFromText(row.cve.summary),
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
