import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

mkdirSync("public/data", { recursive: true });

if (existsSync("data/results.json")) {
  copyFileSync("data/results.json", "public/data/results.json");
  console.log("Copied data/results.json to public/data/results.json");
} else {
  console.log("No data/results.json found; generating sample results...");
  const sample = execFileSync("node", ["scripts/generate-sample-results.js"], {
    encoding: "utf-8",
    cwd: dirname(__dirname),
  });
  writeFileSync("public/data/results.json", sample);
  console.log("Generated public/data/results.json");
}
