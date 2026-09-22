import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

export const MAX_EVIDENCE_BYTES = 15 * 1024 * 1024;

export const ALLOWED_EVIDENCE_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/plain": ".txt",
};

export function uploadsRoot() {
  return path.join(process.cwd(), "uploads");
}

export function evidenceDirectory(organizationId: string, evidenceId: string) {
  return path.join(uploadsRoot(), organizationId, evidenceId);
}

export function evidenceFilePath(
  organizationId: string,
  evidenceId: string,
  storedName: string,
) {
  return path.join(evidenceDirectory(organizationId, evidenceId), storedName);
}

const MIME_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
};

export function mimeForStoredName(storedName: string) {
  return MIME_BY_EXTENSION[path.extname(storedName).toLowerCase()] ?? "application/octet-stream";
}

export function sanitizeFileName(name: string) {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return (base || "evidence").slice(0, 180);
}

export function extensionFor(file: File) {
  const fromMime = ALLOWED_EVIDENCE_TYPES[file.type];
  if (fromMime) return fromMime;
  const ext = path.extname(file.name).toLowerCase();
  if ([".pdf", ".png", ".jpg", ".jpeg", ".docx", ".xlsx", ".txt"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return null;
}

export async function storeEvidenceFile(args: {
  organizationId: string;
  evidenceId: string;
  file: File;
}) {
  if (args.file.size > MAX_EVIDENCE_BYTES) {
    throw new Error("File is larger than 15MB.");
  }
  const ext = extensionFor(args.file);
  if (!ext) {
    throw new Error("Use a PDF, PNG, JPEG, DOCX, XLSX, or TXT file.");
  }

  const storedName = `file${ext}`;
  const directory = evidenceDirectory(args.organizationId, args.evidenceId);
  await mkdir(directory, { recursive: true });
  const bytes = Buffer.from(await args.file.arrayBuffer());
  await writeFile(
    path.join(directory, storedName),
    bytes,
  );

  return {
    fileName: sanitizeFileName(args.file.name),
    storedName,
    mimeType: mimeForStoredName(storedName),
    sizeBytes: args.file.size,
  };
}

export async function removeEvidenceFiles(
  organizationId: string,
  evidenceId: string,
) {
  await rm(evidenceDirectory(organizationId, evidenceId), {
    recursive: true,
    force: true,
  });
}
