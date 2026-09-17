import type { SoftwareCategory } from "@prisma/client";

export const SOFTWARE_CATEGORIES: { value: SoftwareCategory; label: string }[] = [
  { value: "SECURITY", label: "Security" },
  { value: "AI", label: "AI" },
  { value: "BUSINESS_APPLICATION", label: "Business application" },
  { value: "INFRASTRUCTURE", label: "Infrastructure" },
  { value: "DEVELOPER_TOOL", label: "Developer tool" },
  { value: "COLLABORATION", label: "Collaboration" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_LABEL = Object.fromEntries(
  SOFTWARE_CATEGORIES.map((item) => [item.value, item.label]),
) as Record<SoftwareCategory, string>;

export function softwareCategoryLabel(category: SoftwareCategory) {
  return CATEGORY_LABEL[category] ?? category;
}

export function isSoftwareCategory(value: string): value is SoftwareCategory {
  return SOFTWARE_CATEGORIES.some((item) => item.value === value);
}

export function parseSoftwareCategory(value: string): SoftwareCategory | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isSoftwareCategory(trimmed)) return trimmed;
  const asCode = trimmed.toUpperCase().replace(/[\s-]+/g, "_");
  if (isSoftwareCategory(asCode)) return asCode;
  const match = SOFTWARE_CATEGORIES.find(
    (item) => item.label.toLowerCase() === trimmed.toLowerCase(),
  );
  return match?.value ?? null;
}

export function normalizeProductName(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isSearchableProductName(value: string) {
  return normalizeProductName(value).length >= 3;
}
