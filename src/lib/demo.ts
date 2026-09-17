export function isDemoLoginEnabled() {
  if (process.env.DEMO_LOGIN === "1") return true;
  if (process.env.DEMO_LOGIN === "0") return false;
  return process.env.NODE_ENV !== "production";
}
