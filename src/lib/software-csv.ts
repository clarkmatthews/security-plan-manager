import type { SoftwareCategory } from "@prisma/client";
import {
  SOFTWARE_CATEGORIES,
  parseSoftwareCategory,
  softwareCategoryLabel,
  normalizeProductName,
} from "@/lib/software";

export const SOFTWARE_CSV_HEADERS = [
  "id",
  "productName",
  "companyName",
  "version",
  "category",
  "notes",
] as const;

export type SoftwareCsvAsset = {
  id: string;
  productName: string;
  companyName: string;
  version: string;
  category: SoftwareCategory;
  notes: string | null;
  archivedAt: Date | string | null;
};

export type SoftwareCsvRow = {
  line: number;
  id: string;
  productName: string;
  companyName: string;
  version: string;
  category: SoftwareCategory;
  notes?: string;
};

export type SoftwareImportPlan = {
  creates: Array<{
    productName: string;
    companyName: string;
    version: string;
    category: SoftwareCategory;
    notes?: string;
  }>;
  updates: Array<{
    id: string;
    productName: string;
    companyName: string;
    version: string;
    category: SoftwareCategory;
    notes?: string;
    restore: boolean;
    rematch: boolean;
  }>;
  archives: string[];
};

function neutralizeCsvCell(value: string) {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function csvEscape(value: string) {
  const safe = neutralizeCsvCell(value);
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function serializeSoftwareCsv(assets: SoftwareCsvAsset[]) {
  const lines = [
    SOFTWARE_CSV_HEADERS.join(","),
    ...assets.map((asset) =>
      [
        asset.id,
        asset.productName,
        asset.companyName,
        asset.version,
        softwareCategoryLabel(asset.category),
        asset.notes ?? "",
      ]
        .map((value) => csvEscape(value))
        .join(","),
    ),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function splitCsvLines(text: string) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of normalized) {
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }
    if (char === "\n" && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) lines.push(current);
  return lines;
}

function headerKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "");
}

const HEADER_ALIASES: Record<string, (typeof SOFTWARE_CSV_HEADERS)[number]> = {
  id: "id",
  productname: "productName",
  product: "productName",
  companyname: "companyName",
  company: "companyName",
  version: "version",
  category: "category",
  notes: "notes",
  note: "notes",
};

export function parseSoftwareCsv(text: string): { error: string } | { rows: SoftwareCsvRow[] } {
  const lines = splitCsvLines(text);
  if (lines.length === 0) {
    return { error: "The file is empty. Download the template, edit it, and upload again." };
  }

  const headers = parseCsvLine(lines[0]).map(headerKey);
  const index = new Map<(typeof SOFTWARE_CSV_HEADERS)[number], number>();
  headers.forEach((header, i) => {
    const mapped = HEADER_ALIASES[header];
    if (mapped) index.set(mapped, i);
  });

  for (const required of ["productName", "companyName", "version", "category"] as const) {
    if (!index.has(required)) {
      return {
        error: `The template needs a ${required} column. Download a fresh template and keep the header row.`,
      };
    }
  }

  const rows: SoftwareCsvRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const read = (key: (typeof SOFTWARE_CSV_HEADERS)[number]) => {
      const at = index.get(key);
      return at == null ? "" : (cells[at] ?? "").trim();
    };
    const productName = read("productName");
    const companyName = read("companyName");
    const version = read("version");
    const categoryValue = read("category");
    if (!productName && !companyName && !version && !categoryValue) continue;

    const category = parseSoftwareCategory(categoryValue);
    const line = i + 1;
    if (!productName) return { error: `Row ${line}: product name is required.` };
    if (!companyName) return { error: `Row ${line}: company name is required.` };
    if (!version) return { error: `Row ${line}: version is required.` };
    if (!category) {
      return {
        error: `Row ${line}: category must be one of ${SOFTWARE_CATEGORIES.map((item) => item.label).join(", ")}.`,
      };
    }

    rows.push({
      line,
      id: read("id"),
      productName,
      companyName,
      version,
      category,
      notes: read("notes") || undefined,
    });
  }

  return { rows };
}

function assetKey(item: { productName: string; companyName: string; version: string }) {
  return [
    normalizeProductName(item.productName),
    normalizeProductName(item.companyName),
    normalizeProductName(item.version),
  ].join("::");
}

export function planSoftwareImport(
  existing: SoftwareCsvAsset[],
  rows: SoftwareCsvRow[],
): { error: string } | SoftwareImportPlan {
  const byId = new Map(existing.map((item) => [item.id, item]));
  const unused = new Map(existing.map((item) => [item.id, item]));
  const usedIds = new Set<string>();

  const creates: SoftwareImportPlan["creates"] = [];
  const updates: SoftwareImportPlan["updates"] = [];

  for (const row of rows) {
    let match = row.id ? byId.get(row.id) : undefined;
    if (row.id && !match) {
      return { error: `Row ${row.line}: id ${row.id} was not found in this brand's inventory.` };
    }
    if (match && usedIds.has(match.id)) {
      return { error: `Row ${row.line}: id ${match.id} appears more than once in the file.` };
    }

    if (!match) {
      const key = assetKey(row);
      const leftover = [...unused.values()];
      match =
        leftover.find((item) => !item.archivedAt && assetKey(item) === key) ??
        leftover.find((item) => item.archivedAt && assetKey(item) === key);
    }

    if (!match) {
      creates.push({
        productName: row.productName,
        companyName: row.companyName,
        version: row.version,
        category: row.category,
        notes: row.notes,
      });
      continue;
    }

    usedIds.add(match.id);
    unused.delete(match.id);
    updates.push({
      id: match.id,
      productName: row.productName,
      companyName: row.companyName,
      version: row.version,
      category: row.category,
      notes: row.notes,
      restore: Boolean(match.archivedAt),
      rematch: match.productName !== row.productName,
    });
  }

  return {
    creates,
    updates,
    archives: [...unused.values()].filter((item) => !item.archivedAt).map((item) => item.id),
  };
}
