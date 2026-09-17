import { NextResponse } from "next/server";
import { requireArea, requireBrandAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { attachmentDisposition } from "@/lib/content-disposition";
import { serializeSoftwareCsv } from "@/lib/software-csv";
import { slugify } from "@/lib/scoring";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ brandId: string }> },
) {
  const { brandId } = await params;
  const membership = await requireArea("SOFTWARE", "view");
  requireBrandAccess(membership, brandId);

  const brand = await prisma.brand.findFirst({
    where: { id: brandId, organizationId: membership.organizationId },
    select: { name: true },
  });
  if (!brand) {
    return NextResponse.json({ error: "Brand not found." }, { status: 404 });
  }

  const assets = await prisma.softwareAsset.findMany({
    where: { brandId, organizationId: membership.organizationId, archivedAt: null },
    orderBy: { productName: "asc" },
    select: {
      id: true,
      productName: true,
      companyName: true,
      version: true,
      category: true,
      notes: true,
      archivedAt: true,
    },
  });

  const filename = `${slugify(brand.name) || "brand"}-software-inventory.csv`;
  return new NextResponse(serializeSoftwareCsv(assets), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": attachmentDisposition(filename),
      "cache-control": "no-store",
    },
  });
}
