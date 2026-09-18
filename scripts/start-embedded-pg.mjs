import EmbeddedPostgres from "embedded-postgres";
import { mkdirSync } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), ".pgdata");
mkdirSync(dataDir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: 5433,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: (message) => {
    process.stdout.write(String(message));
  },
  onError: (message) => {
    process.stderr.write(String(message));
  },
});

async function main() {
  try {
    await pg.initialise();
  } catch (error) {
    const text = String(error);
    if (!/not empty|already/i.test(text)) throw error;
    console.log("Using existing cluster");
  }
  await pg.start();
  try {
    await pg.createDatabase("security_plan");
    console.log("Created database security_plan");
  } catch (error) {
    const text = String(error);
    if (!/already exists/i.test(text)) {
      console.log("Database may already exist:", text);
    }
  }
  console.log("Embedded PostgreSQL is running on port 5433 (UTF-8)");
  await new Promise(() => {});
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
