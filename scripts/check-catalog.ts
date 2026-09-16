import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [functions, categories, subcategories] = await Promise.all([
    prisma.csfFunction.count(),
    prisma.csfCategory.count(),
    prisma.csfSubcategory.count(),
  ]);
  console.log(`catalog ${functions}/${categories}/${subcategories}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
