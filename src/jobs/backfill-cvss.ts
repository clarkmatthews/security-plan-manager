import { prisma } from "../lib/prisma";
import { backfillCvssFromSummaries } from "../lib/cve-sync";

async function main() {
  const updated = await backfillCvssFromSummaries();
  const [total, scored, high] = await Promise.all([
    prisma.cveRecord.count(),
    prisma.cveRecord.count({ where: { cvssScore: { not: null } } }),
    prisma.cveRecord.count({ where: { cvssScore: { gt: 7.5 } } }),
  ]);
  console.log(
    JSON.stringify(
      {
        backfilled: updated,
        total,
        scored,
        high,
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
