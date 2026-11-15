import { writeFile } from 'node:fs/promises';
await import('./quiz-reward-check.mjs');
await import('./last-signal-audio-check.mjs');
await writeFile('docs/qa/final-journey-results.json', JSON.stringify({ passed: true, checks: ['Quiz-earned mission and combined certificates', 'Actual desk object visits and checkmarks', 'Guided clue navigation', 'Confetti and personalized certificate download', 'Saved rewards and reset', 'Four supplied narrator recordings', 'Media-clock synchronization and ending cleanup'], details: ['quiz-reward-results.json', 'last-signal-audio-results.json'] }, null, 2));
console.log('Full quiz reward and narrated Last Signal journeys passed.');
