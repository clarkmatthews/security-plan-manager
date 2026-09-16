import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { requireMembership } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { evidenceFilePath } from "@/lib/evidence-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const membership = await requireMembership();
  if (!membership.permissions.EVIDENCE.view) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { id } = await params;

  const evidence = await prisma.evidence.findFirst({
    where: {
      id,
      organizationId: membership.organizationId,
    },
  });

  if (!evidence?.storedName) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const bytes = await readFile(
      evidenceFilePath(evidence.organizationId, evidence.id, evidence.storedName),
    );
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": evidence.mimeType ?? "application/octet-stream",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `attachment; filename="${evidence.fileName ?? evidence.storedName}"`,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
