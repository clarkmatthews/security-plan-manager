import { PrismaClient } from "@prisma/client";
import { existsSync } from "fs";
import path from "path";
import { CSF_CORE, catalogCounts, type CsfCatalog } from "./data/csf-core";

const prisma = new PrismaClient();

type XlsxModule = {
  readFile: (file: string) => { Sheets: Record<string, unknown>; SheetNames: string[] };
  utils: {
    sheet_to_json: (sheet: unknown, opts: { header: number }) => unknown[][];
  };
};

function parseOutcomeCell(value: unknown): { code: string; description?: string } | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  const match = text.match(
    /^(GV|ID|PR|DE|RS|RC)(?:\.([A-Z]{2}))?(?:-(\d{2}))?\b/,
  );
  if (!match) return null;
  const code = match[0];
  const rest = text.slice(match[0].length).replace(/^[\s:—-]+/, "").trim();
  return { code, description: rest || undefined };
}

async function catalogFromXlsx(filePath: string): Promise<CsfCatalog | null> {
  try {
    const imported = (await import("xlsx")) as unknown as {
      readFile?: (file: string) => { Sheets: Record<string, unknown>; SheetNames: string[] };
      utils?: { sheet_to_json: (sheet: unknown, opts: { header: number }) => unknown[][] };
      default?: XlsxModule;
    };
    const XLSX = (imported.default ?? imported) as XlsxModule;
    if (typeof XLSX.readFile !== "function") {
      console.warn("xlsx.readFile unavailable; using bundled CSF Core.");
      return null;
    }

    const workbook = XLSX.readFile(filePath);
    const sheet =
      workbook.Sheets["Current and Target Profile"] ??
      workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return null;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const functions: CsfCatalog["functions"] = [];
    let currentFunction: CsfCatalog["functions"][number] | null = null;
    let currentCategory: CsfCatalog["functions"][number]["categories"][number] | null =
      null;

    for (const row of rows) {
      const cells = Array.isArray(row) ? row : [];
      const parsed =
        parseOutcomeCell(cells[0]) ??
        parseOutcomeCell(cells[1]) ??
        parseOutcomeCell(
          [cells[0], cells[1]].filter((v) => typeof v === "string").join(" "),
        );
      if (!parsed) continue;

      const descriptionFromRow =
        parsed.description ||
        (typeof cells[1] === "string" && !parseOutcomeCell(cells[1])
          ? String(cells[1]).trim()
          : "") ||
        (typeof cells[2] === "string" ? String(cells[2]).trim() : "");

      if (/^(GV|ID|PR|DE|RS|RC)$/.test(parsed.code)) {
        currentFunction = {
          code: parsed.code,
          name: descriptionFromRow.split(".")[0] || parsed.code,
          description: descriptionFromRow,
          categories: [],
        };
        functions.push(currentFunction);
        currentCategory = null;
        continue;
      }

      if (/^(GV|ID|PR|DE|RS|RC)\.[A-Z]{2}$/.test(parsed.code)) {
        if (!currentFunction) continue;
        currentCategory = {
          code: parsed.code,
          name: descriptionFromRow.split(":")[0] || parsed.code,
          description: descriptionFromRow,
          subcategories: [],
        };
        currentFunction.categories.push(currentCategory);
        continue;
      }

      if (/^(GV|ID|PR|DE|RS|RC)\.[A-Z]{2}-\d{2}$/.test(parsed.code)) {
        if (!currentCategory) continue;
        currentCategory.subcategories.push({
          code: parsed.code,
          description: descriptionFromRow || parsed.code,
        });
      }
    }

    const counts = catalogCounts({ functions });
    if (counts.functions === 6 && counts.categories === 22 && counts.subcategories === 106) {
      return { functions };
    }
    console.warn(
      `xlsx parse produced ${counts.functions}/${counts.categories}/${counts.subcategories}; expected 6/22/106. Using bundled CSF Core.`,
    );
    return null;
  } catch (error) {
    console.warn("Could not parse xlsx; using bundled CSF Core.", error);
    return null;
  }
}

async function seed() {
  const bundled = catalogCounts(CSF_CORE);
  if (
    bundled.functions !== 6 ||
    bundled.categories !== 22 ||
    bundled.subcategories !== 106
  ) {
    throw new Error(
      `Bundled catalog is ${bundled.functions}/${bundled.categories}/${bundled.subcategories}, expected 6/22/106`,
    );
  }

  const xlsxPath = path.join(
    process.cwd(),
    "docs",
    "nist",
    "CSF 2.0 Organizational Profile Template.xlsx",
  );
  let catalog = CSF_CORE;
  if (existsSync(xlsxPath)) {
    const parsed = await catalogFromXlsx(xlsxPath);
    if (parsed) {
      catalog = parsed;
      console.log("Seeded CSF catalog from Organizational Profile Template.xlsx");
    }
  }

  const counts = catalogCounts(catalog);
  console.log(
    `Seeding NIST CSF 2.0 catalog: ${counts.functions} functions, ${counts.categories} categories, ${counts.subcategories} subcategories`,
  );

  let functionOrder = 0;
  for (const fn of catalog.functions) {
    const dbFunction = await prisma.csfFunction.upsert({
      where: { code: fn.code },
      update: {
        name: fn.name,
        description: fn.description,
        sortOrder: functionOrder,
      },
      create: {
        code: fn.code,
        name: fn.name,
        description: fn.description,
        sortOrder: functionOrder,
      },
    });
    functionOrder += 1;

    let categoryOrder = 0;
    for (const category of fn.categories) {
      const dbCategory = await prisma.csfCategory.upsert({
        where: { code: category.code },
        update: {
          name: category.name,
          description: category.description,
          sortOrder: categoryOrder,
          functionId: dbFunction.id,
        },
        create: {
          code: category.code,
          name: category.name,
          description: category.description,
          sortOrder: categoryOrder,
          functionId: dbFunction.id,
        },
      });
      categoryOrder += 1;

      let subcategoryOrder = 0;
      for (const subcategory of category.subcategories) {
        await prisma.csfSubcategory.upsert({
          where: { code: subcategory.code },
          update: {
            description: subcategory.description,
            sortOrder: subcategoryOrder,
            categoryId: dbCategory.id,
          },
          create: {
            code: subcategory.code,
            description: subcategory.description,
            sortOrder: subcategoryOrder,
            categoryId: dbCategory.id,
          },
        });
        subcategoryOrder += 1;
      }
    }
  }

  const [functions, categories, subcategories] = await Promise.all([
    prisma.csfFunction.count(),
    prisma.csfCategory.count(),
    prisma.csfSubcategory.count(),
  ]);
  console.log(`Catalog in database: ${functions}/${categories}/${subcategories}`);

  const { seedDemoWorkspace } = await import("./seed-demo");
  await seedDemoWorkspace(prisma);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
