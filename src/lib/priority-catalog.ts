import { compareByCatalog } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import type { OutcomeCatalogItem } from "@/lib/priorities";

export async function listOutcomeCatalog(): Promise<OutcomeCatalogItem[]> {
  const rows = await prisma.csfSubcategory.findMany({
    include: {
      category: { include: { function: true } },
    },
  });
  return rows
    .map((row) => ({ subcategory: row }))
    .sort(compareByCatalog)
    .map(({ subcategory: row }) => ({
      id: row.id,
      code: row.code,
      description: row.description,
      functionCode: row.category.function.code,
      functionName: row.category.function.name,
      categoryCode: row.category.code,
      categoryName: row.category.name,
    }));
}
