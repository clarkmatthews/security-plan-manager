export function attachmentDisposition(filename: string) {
  const safe = filename.replace(/[\r\n"]/g, "_").slice(0, 180) || "download";
  return `attachment; filename="${safe}"`;
}
