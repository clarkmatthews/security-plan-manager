import { cveSyncIntervalHours, cveSyncIntervalMs } from "../lib/cve-constants";
import { syncCves } from "../lib/cve-sync";

let stopped = false;

function requestStop() {
  stopped = true;
}

process.on("SIGINT", requestStop);
process.on("SIGTERM", requestStop);

async function sleep(ms: number) {
  const end = Date.now() + ms;
  while (!stopped && Date.now() < end) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(1_000, end - Date.now())),
    );
  }
}

async function main() {
  const hours = cveSyncIntervalHours();
  console.log(`CVE GitHub delta cron: every ${hours} hour(s). Ctrl+C to stop.`);

  while (!stopped) {
    try {
      const result = await syncCves({ force: true });
      console.log(
        JSON.stringify(
          { at: new Date().toISOString(), intervalHours: hours, ...result },
          null,
          2,
        ),
      );
    } catch (error) {
      console.error("CVE cron sync failed", error);
    }
    if (stopped) break;
    await sleep(cveSyncIntervalMs());
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
