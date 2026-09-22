import { createHash, timingSafeEqual } from "crypto";

function sameText(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

function isLoopback(request: Request) {
  try {
    const { hostname } = new URL(request.url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function cronAuthorized(request: Request) {
  const secret = process.env.CVE_SYNC_SECRET?.trim() ?? "";
  const header = request.headers.get("authorization") ?? "";
  if (secret) return sameText(header, `Bearer ${secret}`);
  return process.env.NODE_ENV !== "production" && isLoopback(request);
}
