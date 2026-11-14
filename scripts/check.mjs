import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";

const archive = JSON.parse(
  await readFile("public/content/archive.json", "utf8"),
);
const narration = JSON.parse(
  await readFile("public/content/narration.json", "utf8"),
);
for (const recording of narration.recordings) {
  const bytes = await readFile("public/" + recording.file);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    recording.sha256,
  );
  assert.equal(bytes.length, recording.bytes);
}
assert.equal(
  archive.crtIntro.audio.cues.map((cue) => cue.text).join(""),
  archive.crtIntro.paragraphs.join("\n\n"),
);
assert.equal(
  archive.vikingEntry.crtIntro.audio.cues.map((cue) => cue.text).join(""),
  archive.vikingEntry.crtIntro.paragraphs.join("\n\n"),
);
for (const cue of archive.vikingEntry.crtIntro.audio.cues)
  assert.ok(cue.start >= 0 && cue.end > cue.start && cue.end <= 51.664);
const sojournerIntro = archive.sojournerEntry.crtIntro;
assert.equal(
  sojournerIntro.audio.cues.map((cue) => cue.text).join(""),
  sojournerIntro.paragraphs.join("\n\n"),
);
for (const cue of sojournerIntro.audio.cues)
  assert.ok(cue.start >= 0 && cue.end > cue.start && cue.end <= 48.886);
const media = JSON.parse(await readFile("public/content/media.json", "utf8"));
const manifest = JSON.parse(
  await readFile("public/content/manifest.json", "utf8"),
);
const html = await readFile("public/index.html", "utf8");
const video = JSON.parse(await readFile("public/content/video.json", "utf8"));
const vikingVideo = JSON.parse(
  await readFile("public/content/viking-video.json", "utf8"),
);
assert.equal(
  createHash("sha256")
    .update(await readFile("public/" + vikingVideo.file))
    .digest("hex"),
  vikingVideo.sha256,
);
const videoBytes = await readFile("public/" + video.file);
assert.equal(
  createHash("sha256").update(videoBytes).digest("hex"),
  video.sha256,
);
const model = JSON.parse(await readFile("public/content/model.json", "utf8"));
const modelBytes = await readFile("public/" + model.file);
assert.equal(
  createHash("sha256").update(modelBytes).digest("hex"),
  model.sha256,
);
assert.equal(modelBytes.subarray(0, 4).toString(), "glTF");
assert.equal(modelBytes.readUInt32LE(4), 2);
assert.equal((html.match(/<article class="mission-card /g) || []).length, 3);
assert.ok(!/[çğıöşüÇĞİÖŞÜ]/u.test(JSON.stringify(archive)));
for (const [id, panel] of Object.entries(archive.panels)) {
  for (const source of panel.sources)
    assert.ok(archive.sources[source], `${id}: missing source ${source}`);
  if (panel.image)
    assert.ok(
      media.find((item) => item.id === panel.image),
      `${id}: missing media`,
    );
}
for (const events of Object.values(archive.screenActivities.journeys)) {
  for (const event of events) {
    for (const source of event.sources)
      assert.ok(archive.sources[source], `Missing journey source: ${source}`);
    if (event.file)
      assert.ok(
        media.some((record) => record.file === event.file),
        `Uncredited journey evidence: ${event.file}`,
      );
  }
}
for (const record of media) {
  const bytes = await readFile("public/" + record.file);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    record.sha256,
    "Evidence changed: " + record.file,
  );
  assert.ok(new URL(record.download).hostname.endsWith("nasa.gov"));
}
for (const entry of manifest) {
  const bytes = await readFile("public/" + entry.path);
  assert.equal(bytes.length, entry.bytes, "Stale size: " + entry.path);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    entry.sha256,
    "Stale manifest: " + entry.path,
  );
}
for (const match of html.matchAll(/data-asset="([^"]+)"/g))
  await stat("public/" + match[1]);
assert.ok(html.includes('id="arrival-video"'));
assert.ok(!html.includes("<audio"));
console.log(
  `Checked: 3 mission cards, ${Object.keys(archive.panels).length} panels, ${media.length} unchanged NASA images, ${manifest.length} manifest resources.`,
);

const sojournerVideo = JSON.parse(
  await readFile("public/content/sojourner-video.json", "utf8"),
);
assert.equal(
  createHash("sha256")
    .update(await readFile("public/" + sojournerVideo.file))
    .digest("hex"),
  sojournerVideo.sha256,
);

const learning = JSON.parse(
  await readFile("public/content/learning.json", "utf8"),
);
for (const mission of ["apollo", "viking", "sojourner"]) {
  assert.equal(learning[mission].goals.length, 3);
  for (const goal of learning[mission].goals) {
    assert.ok(archive.panels[goal.evidence]);
    assert.ok(goal.answer >= 0 && goal.answer < goal.choices.length);
    for (const id of goal.sources)
      assert.equal(learning.sourceURLs[id], archive.sources[id].url);
  }
}
for (const spec of Object.values(learning.parts))
  for (const part of spec.parts)
    for (const id of part.sources) assert.ok(archive.sources[id]);
for (const record of narration.recordings) {
  const bytes = await readFile("public/" + record.file);
  assert.ok(
    bytes.includes(Buffer.from("AI-generated", "utf8")) ||
      bytes.includes(Buffer.from("AI-generated", "utf16le")),
  );
}
