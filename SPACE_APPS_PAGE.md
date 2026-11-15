# Abandoned, But Not Forgotten

**Subtitle:** An Interactive Moon & Mars Archive

**Event:** 2026 NASA Space Apps Challenge — Universal Event

**Project Demo:** https://youtu.be/UBaxWCMwD6A

**Final Project:** https://www.abandonedbutnotforgotten.org/

**Source Code:** https://github.com/yasirarican-droid/hackathon2026

## High-Level Project Summary

Abandoned, But Not Forgotten puts school-age explorers in the mission-control chair.

Three hand-illustrated control rooms—1969, 1976 and 1997—bring Apollo 11’s Eagle, Viking 1 and Sojourner into an interactive archive. Children replay each journey, turn 3D models, investigate real Viking weather measurements and listen to NASA/JPL archive audio. A floppy disk or CD opens a modern narrated mission story; a ringing telephone opens Last Signal.

Then the screens go quiet. Last Signal and Where is it now? connect each machine’s ending with NASA NSSDCA records and dated orbital photographs: where the hardware remains, why it was left behind and what it still teaches us. Uncertainty is part of the story: Sojourner’s precise final position and Eagle’s ascent-stage fate are not presented as established facts.

Guided quizzes celebrate curiosity with personalized explorer certificates. We chose three missions and told them deeply, so children leave asking about the rest. NASA evidence is credited through source links, and AI-assisted production is documented separately from authentic historical material.

## Detailed Project Description

### Why we built it

Launches are easy to remember. Equipment left behind is easier to overlook. NASA’s catalogs and archives preserve the evidence, but technical records can be difficult for a child to approach. We created an illustrated archive where school-age children can investigate that history through familiar objects, voices and questions.

### Three eras, chosen for depth

Apollo 11, Viking 1 and Mars Pathfinder/Sojourner connect the Moon and Mars through three different kinds of exploration: a crewed landing, a stationary laboratory and a rover/lander partnership. Three distinctive illustrated control rooms represent 1969, 1976 and 1997. We chose a small scope so each mission could have a full, understandable story. Our difference is the combination of three eras of hand-illustrated environments, genuine NASA archive data and audio, and the endings and present condition of the hardware.

### What children do

On first entering a mission, an illustrated journey leads through an arrival film and synchronized CRT introduction. Returning visitors can enter the console directly or replay the story. Inside each room, the left monitor explores the mission timeline, the center opens an interactive 3D viewer, and the right introduces lunar science, actual Viking pressure data or Sojourner’s planned-versus-actual duration.

Children open desk files and original photographs, read source-linked evidence, and mark explored objects in the Objects menu. A floppy disk or CD plays the modern narrated mission story. The Sojourner cassette offers four NASA/JPL podcast chapters with transcripts. Optional Field Guide activities and illustrated guides help visitors follow clues.

Where is it now? opens a NASA NSSDCA-linked status file with dated orbital evidence. The telephone opens Last Signal: a modern, sourced narrator story, with text, audio controls and a quiet CRT ending that returns to the timeline. It is not an authentic last spacecraft transmission. These activities are available for exploration rather than enforced as a single sequence.

The notebook checks understanding through three guided questions. Correct completion immediately celebrates with confetti and an optional-name/color explorer certificate. Each mission has its own award; completing all three quizzes earns a combined certificate. Object collection is separate from quiz success. Browser progress can be reset; no account is needed.

### Human contribution and implementation

The team led the concept, audience and scope decisions, content selection, historical checking, art direction, interaction review and final editorial choices. AI supported asset production, code and explanatory drafts. Confirmed project responsibilities are:

| Team member | Responsibility |
|---|---|
| **Enes Yasir ARICAN** | Project Lead & Technical Coordinator — software engineering, integration and technical review |
| **Semih KARTAL** | Research & Fact-Checking Lead — NASA source research and content verification |
| **Görkem AYGEL** | Art Direction & Visual Review — illustration style and visual consistency |
| **Emre ARICAN** | Usability & Testing Lead — interaction review, usability and application testing |

The implementation uses static HTML/CSS/JavaScript, Three.js viewers, local JSON source records and browser media APIs. Lazy media requests and optional local progress support repeat visits without requiring a backend or paid API at runtime. The website’s rooms are fictional illustrated archive environments, not faithful reconstructions of real NASA rooms.

### Educational purpose, limits and future work

The aim is curiosity and evidence-based questioning, not a claim of measured educational improvement. The present experience is English-only, intended for landscape use, and contains three missions. Browser media restrictions may require a tap. Automated testing does not establish universal accessibility or replace observation with children on real devices. Certificates are project rewards, not NASA qualifications.

Opportunity and Ingenuity are possible future chapters, not current features or dated commitments.

**Watch the demo:** https://youtu.be/UBaxWCMwD6A

**Explore the project:** https://www.abandonedbutnotforgotten.org/

An independent educational project created for the 2026 NASA Space Apps Challenge. Not affiliated with or endorsed by NASA.

## NASA Data

The project uses actual NASA sources throughout its exhibits, rather than attaching a generic NASA link to invented content. Each record is mapped to its educational use below.

| Source | What Was Used | Where It Appears in the App | Link |
|---|---|---|---|
| NASA NSSDCA: Apollo 11 LM / EASEP, **1969-059C** | Eagle’s stages, surface equipment and the uncertain fate of the ascent stage | Apollo exhibits, Where is it now? and Last Signal | [Catalog record](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C) |
| NASA NSSDCA: Viking 1 Lander, **1975-075C** | Lander identity, landing region, instruments and mission ending | Viking room and status file | [Catalog record](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1975-075C) |
| NASA NSSDCA: **MESURPR** and **1996-068A** | Sojourner rover and Pathfinder lander, their separate roles and communications link | Sojourner exhibits, relay explanation and status file | [Sojourner](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=MESURPR), [Pathfinder](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-068A) |
| NASA PDS: **VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0** | Thirty actual Viking 1 daily mean pressure samples, sols 1–30, PRESS_MEAN in mbar; source rows and quality flags retained | Animated Viking CRT and interactive weather investigation | [Dataset](https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0), [raw table](https://pds-atmospheres.nmsu.edu/PDS/data/vl_1001/data/vl_avep.dat) |
| NASA LRO/LROC: Apollo 11 landing site | Orbital photograph identifying the lower landing stage and surface trails | Apollo Where is it now? | [NASA image page](https://science.nasa.gov/resource/apollo-11-landing-site/) |
| NASA HiRISE: **PIA01881** and **PIA09105** | Viking 1 lander cutout and annotated Pathfinder hardware view | Viking and Sojourner status files | [Viking](https://science.nasa.gov/photojournal/viking-lander-1-thomas-a-mutch-memorial-station-imaged-from-orbit/), [Pathfinder](https://science.nasa.gov/photojournal/mars-pathfinder-landing-site-and-surroundings/) |
| NASA Apollo surface photographs | Original evidence including **AS11-40-5961** and **AS11-40-5952** | Photo albums, Eagle and lunar-science investigations | [Apollo 11 image library](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/images11.html) |
| NASA Photojournal: **PIA00381**, **PIA00611**, **PIA00638**, **PIA00672** and other individually credited images | Original surface views, rover/lander hardware and camera evidence | Viking and Sojourner photograph collections | [First Viking image](https://science.nasa.gov/photojournal/first-photograph-taken-on-mars-surface/), [Pathfinder mission](https://science.nasa.gov/mission/mars-pathfinder/) |
| NASA Historical Sounds: **Eagle Has Landed** | An unchanged 5.364-second historical audio clip; transcript context is separately identified | Apollo journey investigation | [NASA archive](https://www.nasa.gov/historical-sounds/) |
| NASA/JPL, **On a Mission S4E2: First Steps: Sojourner** | Four selected podcast excerpts with source intervals, speakers and transcripts; edited for listening clarity | Chapter-based Sojourner cassette player | [Podcast and transcript](https://www.nasa.gov/podcasts/on-a-mission/first-steps-sojourner-s4e2/) |
| NASA 3D Resources / **Michael D. Carbajal** | Original Apollo Lunar Module and Viking Lander geometry; viewing materials and lighting adjusted | Interactive Apollo and Viking model viewers | [Apollo model](https://science.nasa.gov/3d-resources/apollo-lunar-module/), [Viking model](https://science.nasa.gov/3d-resources/viking-lander/) |
| NASA NSSDCA objectives and NASA/JPL technical paper | **7 planned / 83 actual Martian sols**; one sol is about 24 Earth hours 40 minutes | Sojourner duration comparison and learning activities | [Objectives](https://nssdc.gsfc.nasa.gov/planetary/mesur.html), [JPL paper](https://www-robotics.jpl.nasa.gov/media/documents/ICESpaper.pdf) |

The original image identities, credits, download URLs and SHA256 values are preserved in public/content/media.json. Viking pressure values retain their PDS rows, units and archive flags in viking-pressure.json. The NASA/JPL podcast excerpts preserve source intervals, named speakers and transcripts in sojourner-recordings.json. Podcast chapters are edited listening excerpts; their processing is recorded. The short Apollo clip is an unchanged NASA-hosted historical recording.

NSSDCA records support mission identities and endings, while dated LRO/HiRISE imagery provides later orbital evidence. An image identifying Pathfinder is not treated as proof of Sojourner’s final parking position. The catalog’s uncertainty about Eagle’s upper-stage fate is retained. Photographs are archive evidence, not live telemetry. Flight, light-path and CRT animations are illustrative.

NASA’s generic Apollo Lunar Module and Viking models retain their original geometry. Display materials are adjusted for viewing. Sojourner/Pathfinder models are educational project reconstructions based on NASA references; they are not NASA-issued CAD.

## Space Agency Partner & Other Data

No additional space-agency partner dataset or official partnership is claimed. NASA-hosted university/USGS image credits are retained with each source. Public access to NASA material does not imply endorsement.

Other resources include Three.js (MIT), Draco decoder (Apache-2.0), esbuild (MIT), Playwright (Apache-2.0), and locally served Kalam, Patrick Hand and Share Tech Mono fonts (SIL Open Font License). Retained trial font files have their own OFL notices. Project interface illustrations, arrival videos, narration and music are distinguished from NASA evidence in the AI section and per-file provenance records.

Project-authored code uses Apache-2.0. Third-party content, recordings, models and generated media keep their applicable terms. Paid-plan Suno and ElevenLabs use is confirmed by the project owner; it is not presented as a blanket Apache license for the recordings. Source credits and license notices accompany the repository.

## Use of Artificial Intelligence

AI supported production; the project’s educational purpose and final decisions were team-led. The team chose the school-age audience, the three mission stories, source selection, historical interpretation, visual direction and interaction design, and reviewed integration and content.

| Tool | Purpose | How It Was Disclosed |
|---|---|---|
| **OpenAI Codex** | Software implementation, integration assistance, explanatory text and automated checks | Project Info, source documentation and AI usage records |
| **OpenAI ImageGen / ChatGPT** | Illustrated control rooms, interface artwork, fictional guides and visual production assistance | Shared project Info and per-asset provenance records |
| **ChatGPT + Kling AI** | Team-supplied illustrated arrival films | AI production credits in the films and project Info |
| **ElevenLabs** | Mission introductions, archive stories, naming story and Last Signal narration | Project Info, descriptive provenance and MP3 metadata; separate from historical audio |
| **Suno** | Homepage music | Project Info and audio provenance/metadata |

The application provides a shared production-information card identifying tools and uses. Arrival films include AI production credits; the team confirms that the Apollo film also carries its mark within the video. Synthetic narration and music have descriptive provenance and metadata. Code and explanatory text assistance is recorded separately. These statements describe the project’s disclosures and are not a claim of competition certification.

Authentic NASA photographs, PDS measurements, NASA 3D model geometry, the Apollo archive clip and NASA/JPL podcast voices are not presented as AI-generated. Last Signal and the mission stories are modern narrative recordings based on sources, not recovered spacecraft speech. Illustrative room art and fictional guide characters are not historical evidence. No synthetic scientific measurement dataset is used.
