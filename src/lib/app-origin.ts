function configuredOrigin() {
  const raw = process.env.AUTH_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function loopbackOrigin(headerList: Headers) {
  const host = (headerList.get("host") ?? "").split(",")[0]?.trim() ?? "";
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) return null;
  const proto = headerList.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${proto}://${host}`;
}

/** Invite links use AUTH_URL. Request Host headers are not trusted. */
export function inviteOrigin(headerList: Headers) {
  return configuredOrigin() ?? loopbackOrigin(headerList) ?? "http://localhost:3000";
}
