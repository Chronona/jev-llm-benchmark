import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

// ダッシュボード表示用の results.json を dashboard/public/data/ に用意する。
// 優先順位: 直近の実測 (data/results.json) > 同梱サンプル (data/sample-results.json) > 自動生成
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const target = join(root, "dashboard", "public", "data", "results.json");

mkdirSync(dirname(target), { recursive: true });

if (existsSync(join(root, "data", "results.json"))) {
  copyFileSync(join(root, "data", "results.json"), target);
  console.log("Copied data/results.json to dashboard/public/data/results.json");
} else if (existsSync(join(root, "data", "sample-results.json"))) {
  copyFileSync(join(root, "data", "sample-results.json"), target);
  console.log(
    "Copied data/sample-results.json to dashboard/public/data/results.json"
  );
} else {
  console.log("No results found; generating sample results...");
  const sample = execFileSync("node", ["scripts/generate-sample-results.js"], {
    encoding: "utf-8",
    cwd: root,
  });
  writeFileSync(target, sample);
  console.log("Generated dashboard/public/data/results.json");
}
