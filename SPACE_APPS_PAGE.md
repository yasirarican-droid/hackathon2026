# Abandoned, But Not Forgotten

**Subtitle:** An Interactive Moon & Mars Archive

**Event:** 2026 NASA Space Apps Challenge — Universal Local Event

Development of the submitted interactive application began on November 14, 2026.

**Project Demo:** https://youtu.be/UBaxWCMwD6A

**Final Project:** https://www.abandonedbutnotforgotten.org/

**Source Code:** https://github.com/yasirarican-droid/hackathon2026

## High-Level Project Summary

School-age explorers enter three illustrated control rooms: Apollo 11, Viking 1 and Sojourner. They turn 3D models, investigate real Viking weather, open NASA photographs and listen to archive audio. Where is it now? and Last Signal connect each machine’s ending with what remains today. Guided quizzes reward discovery with personalized certificates. We chose three missions for depth, so children leave asking about the rest.

## Detailed Project Description

Spacecraft can stop transmitting while their contribution to science lives on. Our project makes those stories approachable for school-age children through three illustrated control rooms representing 1969, 1976 and 1997.

Each room combines a mission timeline, a 3D viewer and a science investigation. Children explore desk objects, original NASA photographs and linked sources. A floppy disk or CD plays a modern mission story; Sojourner’s cassette offers four NASA/JPL podcast chapters with transcripts.

Where is it now? connects direct NSSDCA records with dated orbital photographs and explains the hardware’s condition and why it remained. The ringing telephone opens Last Signal, a sourced modern narration that ends with a fading CRT and a return to the timeline. Eagle’s ascent-stage fate and Sojourner’s exact final parking location remain uncertain in the account.

Three guided notebook questions earn a personalized mission certificate; all three quizzes unlock a combined award. Optional clues, explorer guides and browser-saved progress help visitors continue at their own pace.

We deliberately chose three missions to give each a complete story. The team led the concept, source selection, scientific checking, art direction and interaction review: Enes Yasir ARICAN coordinated software and integration, Semih KARTAL led research and fact-checking, Görkem AYGEL reviewed art and visual consistency, and Emre ARICAN led usability and testing.

The application uses static HTML, CSS and JavaScript, Three.js and local JSON records. It is English-only and designed for landscape exploration. Opportunity and Ingenuity are possible future chapters.

An independent educational project created for the 2026 NASA Space Apps Challenge. Not affiliated with or endorsed by NASA.

## NASA Data

| Source | What Was Used | Where It Appears in the App | Link |
|---|---|---|---|
| NASA NSSDCA | Apollo **1969-059C**, Viking **1975-075C**, Sojourner **MESURPR**, Pathfinder **1996-068A**; mission identities, hardware and endings | Mission exhibits, status files and Last Signal | [Apollo](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C), [Viking](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-075C), [Sojourner](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=MESURPR), [Pathfinder](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-068A) |
| NASA PDS | **VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0**, VL1 sols 1–30, PRESS_MEAN in mbar; original rows and flags retained | Viking weather CRT and investigation | [Dataset](https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0) |
| LRO/LROC and HiRISE | Apollo landing-site photograph, **PIA01881** Viking and **PIA09105** Pathfinder views | Where is it now? files | [Apollo](https://science.nasa.gov/resource/apollo-11-landing-site/), [Viking](https://science.nasa.gov/photojournal/viking-lander-1-thomas-a-mutch-memorial-station-imaged-from-orbit/), [Pathfinder](https://science.nasa.gov/photojournal/mars-pathfinder-landing-site-and-surroundings/) |
| NASA photographs and audio | Original surface images, including **AS11-40-5961**, and the historical Eagle Has Landed clip | Photo albums and Apollo journey investigation | [Apollo image library](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/images11.html), [Historical Sounds](https://www.nasa.gov/historical-sounds/) |
| NASA/JPL, First Steps: Sojourner | Four podcast excerpts with source intervals, speakers and transcripts | Sojourner cassette player | [Podcast](https://www.nasa.gov/podcasts/on-a-mission/first-steps-sojourner-s4e2/) |
| NASA 3D Resources / Michael D. Carbajal | Apollo Lunar Module and Viking Lander geometry | Interactive model viewers | [Apollo](https://science.nasa.gov/3d-resources/apollo-lunar-module/), [Viking](https://science.nasa.gov/3d-resources/viking-lander/) |

NSSDCA objectives and a [NASA/JPL technical paper](https://www-robotics.jpl.nasa.gov/media/documents/ICESpaper.pdf) support Sojourner’s seven planned and 83 actual Martian sols. Image credits, IDs, hashes and data provenance are retained in the repository. The [README source table](https://github.com/yasirarican-droid/hackathon2026#real-nasa-data-and-historical-sources) gives the full source-to-feature mapping.

## Space Agency Partner & Other Data

Other resources include Three.js (MIT), Draco (Apache-2.0), esbuild (MIT), Playwright (Apache-2.0), and locally served Kalam, Patrick Hand and Share Tech Mono fonts (SIL OFL). Sojourner and Pathfinder models are educational reconstructions created for this project using NASA references. Project code uses Apache-2.0; media and other dependencies retain their applicable terms. No additional space-agency partner dataset was used.

## Use of Artificial Intelligence

| Tool | Purpose |
|---|---|
| OpenAI Codex | Code, integration assistance, explanatory drafts and automated checks |
| OpenAI ImageGen / ChatGPT | Illustrated control rooms, interface artwork and guide characters |
| ChatGPT + Kling AI | Illustrated arrival films |
| ElevenLabs | Modern mission, CRT and Last Signal narration |
| Suno | Homepage music |

AI tools, their uses, supporting sources and production records are documented in Project Info, AI_DISCLOSURE.md and per-file metadata. The team led the concept, historical source selection, visual direction and final review. NASA photographs, PDS measurements, historical voices and NASA model geometry are credited separately from AI-assisted content.
