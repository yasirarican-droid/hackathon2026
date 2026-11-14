import { readdir, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const audit = JSON.parse(
  await readFile("public/content/production-audit.json", "utf8"),
);
const banned = new Set(audit.retiredAssets.map((record) => record.sha256));
const cutoff = Date.parse(audit.cutoffUTC);
async function walk(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = directory + "/" + item.name;
    if (item.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}
for (const path of await walk("public/assets")) {
  const hash = createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
  assert.ok(!banned.has(hash), "Retired pre-start asset present: " + path);
}
const images = await walk("public/assets/art");
for (const path of images) {
  const record = audit.activeArtwork.find(
    (record) => "public/" + record.file === path,
  );
  assert.ok(record, "Unregistered artwork: " + path);
  assert.equal(
    createHash("sha256")
      .update(await readFile(path))
      .digest("hex"),
    record.sha256,
  );
  if (path.endsWith(".svg")) {
    const markup = await readFile(path, "utf8");
    assert.ok(
      markup.includes(">AI-generated</text>"),
      "Missing embedded visible AI label",
    );
    const embedded = markup.match(/data:image\/webp;base64,([^"]+)/);
    assert.ok(embedded, "Missing original embedded image");
    assert.equal(
      createHash("sha256")
        .update(Buffer.from(embedded[1], "base64"))
        .digest("hex"),
      record.sourceWebPSHA256,
    );
  }
  assert.ok(
    Date.parse(record.observedGeneratedOutputWriteUTC) >= cutoff,
    "Generated output predates cutoff: " + path,
  );
  assert.ok(
    (await stat(path)).mtimeMs >= cutoff,
    "Asset filesystem date predates cutoff: " + path,
  );
}
console.log(
  `Production audit passed: ${images.length} post-start generated illustrations; ${banned.size} retired hashes absent from public assets. NASA/third-party source dates retained.`,
);
