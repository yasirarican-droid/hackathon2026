import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

async function walk(directory) {
  const result = [];
  for (const file of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, file.name);
    if (file.isDirectory()) { if (file.name !== "submission") result.push(...(await walk(full))); }
    else if (
      ![
        "manifest.json",
        "index.html",
        "main.js",
        "styles.css",
        "crt-intro.js",
        "mission-room.js",
        "side-screens.js",
        "sojourner-room.js",
        "cassette-player.js",
        "learning-guide.js",
        "progress-store.js",
        "explorer-guide.js",
      ].includes(file.name) &&
      !full.endsWith(".txt")
    )
      result.push(full);
  }
  return result;
}
const files = await walk("public");
const manifest = [];
for (const file of files.sort()) {
  manifest.push({
    path: path.relative("public", file).replaceAll("\\", "/"),
    bytes: (await stat(file)).size,
    sha256: createHash("sha256")
      .update(await readFile(file))
      .digest("hex"),
  });
}
await writeFile(
  "public/content/manifest.json",
  JSON.stringify(manifest, null, 2),
);
process.stdout.write(
  `Prepared ${manifest.length} files / ${(manifest.reduce((sum, item) => sum + item.bytes, 0) / 1048576).toFixed(1)} MB\n`,
);
