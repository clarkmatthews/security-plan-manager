import EmbeddedPostgres from "embedded-postgres";
import { mkdirSync } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), ".pgdata");
mkdirSync(dataDir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
  onLog: (message) => {
    process.stdout.write(String(message));
  },
  onError: (message) => {
    process.stderr.write(String(message));
  },
});

async function main() {
  await pg.initialise();
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
  console.log("Embedded PostgreSQL is running on port 5432");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
