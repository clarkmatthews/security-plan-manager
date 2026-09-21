import { cveSyncIntervalHours } from "../lib/app-config";
import { syncCves } from "../lib/cve-sync";
import { syncCveMetricsIfStale } from "../lib/cve-metrics";

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
  const hours = await cveSyncIntervalHours();
  console.log(`CVE GitHub delta cron: every ${hours} hour(s) from Config. Ctrl+C to stop.`);

  while (!stopped) {
    try {
      const intervalHours = await cveSyncIntervalHours();
      const result = await syncCves({ force: true });
      const metrics = await syncCveMetricsIfStale();
      console.log(
        JSON.stringify(
          { at: new Date().toISOString(), intervalHours, cves: result, metrics },
          null,
          2,
        ),
      );
    } catch (error) {
      console.error("CVE cron sync failed", error);
    }
    if (stopped) break;
    await sleep((await cveSyncIntervalHours()) * 60 * 60 * 1000);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
