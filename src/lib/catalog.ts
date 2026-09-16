import type { CsfTier, SubcategoryAssessment, Evidence } from "@prisma/client";
import { FUNCTION_ORDER, type AssessmentScoreInput } from "@/lib/scoring";

type CatalogSortable = {
  subcategory: {
    code: string;
    category: {
      code: string;
      function: { code: string };
    };
  };
};

export function compareByCatalog(a: CatalogSortable, b: CatalogSortable): number {
  const fnA = FUNCTION_ORDER.indexOf(
    a.subcategory.category.function.code as (typeof FUNCTION_ORDER)[number],
  );
  const fnB = FUNCTION_ORDER.indexOf(
    b.subcategory.category.function.code as (typeof FUNCTION_ORDER)[number],
  );
  const functionDelta = (fnA === -1 ? 99 : fnA) - (fnB === -1 ? 99 : fnB);
  if (functionDelta !== 0) return functionDelta;
  const categoryDelta = a.subcategory.category.code.localeCompare(
    b.subcategory.category.code,
  );
  if (categoryDelta !== 0) return categoryDelta;
  return a.subcategory.code.localeCompare(b.subcategory.code, undefined, {
    numeric: true,
  });
}

type AssessmentWithCatalog = SubcategoryAssessment & {
  evidence: Pick<Evidence, "id">[];
  subcategory: {
    code: string;
    description: string;
    category: {
      code: string;
      name: string;
      function: {
        code: string;
        name: string;
      };
    };
  };
};

export function toScoreInputs(
  assessments: AssessmentWithCatalog[],
): AssessmentScoreInput[] {
  return assessments.map((assessment) => ({
    includedInProfile: assessment.includedInProfile,
    currentTier: assessment.currentTier as CsfTier | null,
    targetTier: assessment.targetTier as CsfTier | null,
    subcategoryCode: assessment.subcategory.code,
    subcategoryDescription: assessment.subcategory.description,
    functionCode: assessment.subcategory.category.function.code,
    functionName: assessment.subcategory.category.function.name,
    categoryCode: assessment.subcategory.category.code,
    categoryName: assessment.subcategory.category.name,
    evidenceCount: assessment.evidence.length,
  }));
}
