# Owner-supplied Last Signal and naming recordings

Four MP3s supplied by the owner on 15 November 2026 local time are included:

| Screen | Supplied file | Measured duration |
|---|---|---|
| Sojourner naming story | sojorner-name.mp3 | 41.247 s |
| Eagle Last Signal | eagle-last-signal.mp3 | 54.909 s |
| Viking Last Signal | viking-last-signal.mp3 | 59.960 s |
| Sojourner Last Signal | sojorner-last-signal.mp3 | 68.411 s |

The naming story starts automatically from the astronaut naming-story control and provides native audio controls. It is stopped on close, another exhibit, navigation, orientation guard and hidden tabs. The naming paragraph spelling remains the verified Valerie Ambroise and Sojourner Truth; recognition output is not used as a fact source.

Each Last Signal uses its own prepared audio URL. Local cached base.en speech recognition supplied word timing estimates; those were matched to the approved written script. Matching anchor proportions are 98.6%, 99.3% and 98.1%. Unmatched spellings or numeral forms are interpolated between adjacent recognized anchors; these are editorial estimates, not manual phoneme alignment or original NASA timestamps. The written mission facts and source citations are preserved.

Rendering follows audio.currentTime exclusively when voice is available. The typed words and active paragraph freeze on Pause, follow the seek control, and move to the next paragraph's recorded start when Next is used. Reduced motion displays the full active paragraph while narration continues. The final Next control is disabled in the final paragraph: the actual recording's ended event starts the static/fade-to-black return. Trailing silence present in the supplied MP3 remains part of the recording. Skip returns without completing the farewell. Close removes the old player source; no overlapping old voice is left playing. Sound on/off mutes the actual narration and the optional procedural static.

If autoplay is rejected, Play narration is shown without losing readable text. If decoding fails, readable text and manual progression remain available. Background pause preserves whether the user had paused manually. The close control avoids scrolling the freshly opened CRT past its title when the seek bar receives initial native dialog focus.

AI disclosure was added to ID3 without re-encoding. Every encoded audio packet was compared with the owner file and verified identical. Original Downloads files remain untouched. Source/original SHA256, deployed SHA256, byte count, duration and modifications are in public/content/narration.json. Tool attribution follows the project's existing owner-declared narrator workflow; per-file tool/plan cannot be independently established from MP3 bytes. No new voice has been synthesized by the agent.

Verification: scripts/last-signal-audio-check.mjs checks four correct recordings, three automatic voice starts, actual media-clock paragraph/word rendering, pause, seek, next, mute, no premature ending while paused, real audio-ended fade, close/skip cleanup, naming-story autoplay, landscape controls and autoplay-block recovery. Original file hashes, exact packet comparisons and cue integrity are checked separately. These are browser and source checks, not a claim of a human listening review.
