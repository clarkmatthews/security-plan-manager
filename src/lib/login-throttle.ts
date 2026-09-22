const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const failures = new Map<string, number[]>();

function recent(email: string) {
  const now = Date.now();
  const stamps = (failures.get(email) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (stamps.length === 0) failures.delete(email);
  else failures.set(email, stamps);
  return stamps;
}

export function loginAttemptBlocked(email: string) {
  return recent(email).length >= MAX_FAILURES;
}

export function recordLoginFailure(email: string) {
  const stamps = recent(email);
  stamps.push(Date.now());
  failures.set(email, stamps);
}

export function clearLoginFailures(email: string) {
  failures.delete(email);
}
