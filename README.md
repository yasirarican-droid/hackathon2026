# NASA Starboard — Abandoned, But Not Forgotten

The right-side question mark opens four rotating explorer tips per screen. Quiet idle guides and the prominent yellow Field Guide help visitors find evidence and track three learning goals per mission. [Guide behavior and controls](docs/explorer-guides.md).

An interactive Moon and Mars archive for school-age explorers. Three illustrated rooms connect equipment left behind with original NASA photographs, mission records and scientific evidence.

Live application: https://nasastarboard.app/  
Short demonstration: https://nasastarboard.app/submission/demo.mp4

## Explore, investigate, explain

Choose **Explore archive** to enter directly, or **Watch the story** for the illustrated journey and voiced welcome. Each room has a source-linked Field guide with three practice goals. Objects opened and completed learning goals are counted separately. Progress is saved in the visitor's browser, with a reset control and a usable fallback when storage is unavailable. No account or personal details are required.

The Sojourner/Pathfinder viewer supports selecting actual named reconstruction parts with pointer ray picking and equivalent keyboard-accessible buttons. Apollo/Viking use sourced functional labels and guided views. Original NASA model geometry is unchanged. The Sojourner/Pathfinder geometry is an educational reconstruction with disclosed simplifications, not NASA-issued engineering CAD.

## NASA evidence used

| Mission | NASA source material | Application use |
| --- | --- | --- |
| Apollo 11 | NSSDCA mission record 1969-059C, NASA mission records and original AS11 photographs | Compare the two lunar-module stages; follow an illustrative laser path; investigate returned samples and source images |
| Viking 1 | NASA PDS VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0, VL1 sols 1–30 PRESS_MEAN; NASA mission photographs | Compare genuine daily average pressure values, retain original archive flags and source rows, distinguish observations from claims about life |
| Sojourner / Pathfinder | NASA mission overview, NASA/JPL hardware records and Photojournal images PIA00638, PIA00611, PIA00672; NASA/JPL podcast excerpts | Explore the rover/lander partnership, component functions, original camera evidence and the source-reported 7/83-day summary comparison |

Every source and its specific use is mapped in `public/content/archive.json`. Original image identities, credits, URLs and hashes are in `media.json`; raw PDS URLs and extracted values are in `viking-pressure.json`. Simulated flight times, light animation and reconstructed models are illustrative. No synthetic telemetry is presented.

## Run locally

Requires Node.js and npm. No application API keys or backend are needed.

```sh
npm ci
npm run preview
```

Open http://127.0.0.1:4186. The checked-in viewer bundle is ready to serve. To rebuild it after changing `src/`, run `npm run build:viewer`.

```sh
npm run check
npx playwright install chrome
npm test
npm run test:learning
```

If Chrome is already installed, no browser installation is needed. Checks verify source/media hashes, the asset inventory, production provenance and browser interactions. The learning suite covers direct/story entry, correct-answer goals, persistence, reset, storage fallback and real reconstruction-part picking. Browser test reports are written to `docs/qa/`.

## Architecture and performance

Static HTML/CSS/ES modules, Three.js and local content JSON. Required mission assets finish in one opening loader; a versioned browser cache reduces repeat downloads. All later mission/object interactions reuse prepared assets. The optional submission video is excluded from the application preload. Decorative artwork is WebP; arrival films use optimized H.264 with preserved source audio packets. Original NASA evidence is unchanged.

## AI, rights and limitations

The shared **How this archive was made** card lists ImageGen illustrations, ChatGPT/Kling films, ElevenLabs narration, Suno music and Codex assistance. Historical NASA photographs, measurements and NASA/JPL archive voices are distinguished from creative content. The owner confirms paid-plan production of synthetic audio. AI disclosures are embedded in MP3 metadata; arrival films retain visible marks. At the owner's request, repeated illustration labels are consolidated in the production card; this choice is not represented as equivalent to the competition's visible-watermark requirement.

Project-authored code: **Apache-2.0**, see LICENSE and NOTICE. Media, NASA sources, fonts and third-party code have separate terms: see THIRD_PARTY.md and the in-app Sources panel. Apache-2.0 grants no NASA trademark or endorsement rights.

Practice completion is not a certification or proof of measured learning effectiveness. Automated tests are not a substitute for testing with children on actual devices. A short anonymous observation protocol is included under `docs/submission/`.

## Deployment

Serve only `public/` through a static HTTPS server. No development notes, environment files, private keys or Git history belong in that directory. The owner-managed server uses atomic release directories and preserves rollback targets. The current SSH release remains pinned while GitHub main is unchanged; a new main commit resumes normal automatic deployment. This repository branch is available for review before merging.
