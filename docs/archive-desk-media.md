# Recorded story archives and Last Signal phones

The existing owner-recorded stories are unchanged. Their primary desk entry points are now a 5.25-inch floppy in Apollo, a 3.5-inch floppy in Viking and a CD in Sojourner. The three phones now open their own Last Signal narrator stories; the old story IDs are kept, so saved exploration and certificate requirements stay compatible. Story recording MP3 filenames are retained for provenance and their bytes are unchanged.

All three props were newly generated with built-in OpenAI ImageGen after the event cutoff, using the existing telephone as the style reference and the owner-supplied product photos only as shape references. They contain no copied game labels, NASA branding or flags. Final files:

- public/assets/art/archive-floppy-525-v1.webp
- public/assets/art/archive-floppy-35-v1.webp
- public/assets/art/archive-cd-v1.webp

Original RGBA outputs remain outside the project. WebP conversion retains original dimensions and exact alpha; original/output hashes and observed generation times are recorded in content/archive-desk-media.json and production-audit.json. Prompts are recorded in docs/archive-desk-prompts.md. Credits remain in the shared production card at the owner's request.

## Historical distinction

The owner requested these formats for the three rooms. They are imagined retrospective archive controls, not asserted to be original mission-year equipment. IBM's own history dates initial commercial floppy drives to 1971, after Apollo 11; the requested 3.5-inch format also postdates Viking's 1976 landing. This distinction is stated once in Info. No new scientific mission facts or fabricated historical artifacts are inferred from the props. Technical background: https://www.ibm.com/history/floppy-disk and Sony annual-report archive https://www.sony.com/en/SonyInfo/IR/library/ar/8ido18000005fmm3-att/1980-E.pdf .

## Typography and CRT design

Kalam Bold provides the selected handwritten headings, Patrick Hand provides body text, and Share Tech Mono remains on CRT contents, diagrams within those screens and the Last Signal text. Fonts are served locally with SIL OFL licenses. The owner selected the earlier handwritten pair after the comic-font trial; trial font provenance remains in archive-desk-media.json.

The Last Signal cabinet now has a textured ivory bezel, four screws, curved dark glass, a screen reflection/scanline overlay, mission title and last known region, lower speaker grille, indicator lamps and decorative tuning dials. Decorative controls are hidden from assistive technology. Transcript and NASA evidence remain expandable below the working Pause/Next/Skip controls. The existing gentle static/fade-to-black ending returns home. No new voice recording has been generated. Recording-ready scripts are outside the project in Downloads/Last Signal Seslendirme Metinleri.

The phone notification is now unboxed, angled comic lettering on two lines: LAST / SIGNAL!, with a dark outline and gold fill. Its opacity pulses between 0.22 and 1 with a small shake during the phone ringing cycle. The pulses are spaced about 0.62 seconds apart. Pause motion and reduced motion stop it. It does not generate an unsolicited ringing sound. Opening the phone closes any earlier narration and opening a story disk stops a previous final sequence.

## Verification

archive-desk-check.mjs verifies exact displayed prop bytes against the manifest, three recorded-story autoplays from the new disk/CD controls, three phone-to-Last-Signal routes, the notification motion settings, the cabinet/location/font roles, uncovered media hit targets and reachable CRT controls at 1920×1080, 1024×600 and 844×390. Screenshots were visually inspected. Existing browser, learning, story playback, side-screen, plaque and full certificate/farewell suites passed. These are automated checks, not a user study with children.
