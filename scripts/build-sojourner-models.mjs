import { writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { buildSojourner, buildPathfinder } from "../src/sojourner-models.js";
globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
  async readAsDataURL(blob) {
    this.result =
      "data:application/octet-stream;base64," +
      Buffer.from(await blob.arrayBuffer()).toString("base64");
    this.onloadend?.();
  }
};
const models = [];
for (const [id, build] of [
  ["sojourner", buildSojourner],
  ["pathfinder", buildPathfinder],
]) {
  const scene = build();
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(scene);
  let meshCount = 0;
  scene.traverse((x) => {
    if (x.isMesh) meshCount++;
  });
  const file = "assets/models/" + id + "-educational.glb";
  const binary = await new GLTFExporter().parseAsync(scene, { binary: true });
  const bytes = Buffer.from(binary);
  await writeFile("public/" + file, bytes);
  models.push({
    id,
    file,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    meshCount,
    boundsMeters: bounds.getSize(new THREE.Vector3()).toArray(),
    classification:
      "AI-assisted authored educational reconstruction based on NASA references; not a NASA-issued model or engineering CAD.",
    limitations:
      id === "sojourner"
        ? "Solar cell pattern, wheel cleats, joints, wiring, antenna length and material appearance are approximate. Main body proportion and six 13cm wheels follow NASA references. No internal engineering mechanisms reconstructed."
        : "Open-petal educational state, rover separate. Airbags, discarded arrival hardware, internal mechanisms and minute wiring omitted. Petal geometry, instrument arrangement and optical materials simplified. 2.75m overall horizontal span used as a reference; no claim to photogrammetric fidelity.",
  });
  console.log(id, bytes.length, meshCount, models.at(-1).boundsMeters);
}
const provenance = {
  created: "2026-11-14",
  tool: "OpenAI Codex authored deterministic Three.js geometry; GLTFExporter writes local GLB files. No image-to-3D service or third-party model used.",
  sources: [
    {
      url: "https://www.jpl.nasa.gov/news/press_kits/mpfland.pdf",
      usedFor:
        "July 1997 landing press kit, printed pages 7 and 28-32: rover dimensions, 13cm wheel diameter, component schematics, three-petal structure, deployed 2.75m span and camera mast about 1.5m.",
    },
    {
      url: "https://www-robotics.jpl.nasa.gov/what-we-do/flight-projects/pathfinder/",
      usedFor:
        "Rover hardware photograph, six-wheel rocker-bogie architecture, solar array, rear APXS, antenna and broad hardware arrangement.",
    },
    {
      url: "https://science.nasa.gov/photojournal/sojourner-near-barnacle-bill/",
      usedFor:
        "Independent mission photograph for comparing real rover hardware.",
    },
  ],
  models,
};
await writeFile(
  "public/content/sojourner-models.json",
  JSON.stringify(provenance, null, 2) + "\n",
);
