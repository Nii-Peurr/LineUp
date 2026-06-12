import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const nextDir = fileURLToPath(new URL("../.next", import.meta.url));

try {
  rmSync(nextDir, { recursive: true, force: true });
} catch (error) {
  console.error(
    "Unable to clear .next. Stop any running Next.js server for this project and try again."
  );
  console.error(error);
  process.exit(1);
}
