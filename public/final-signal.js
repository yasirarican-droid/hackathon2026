export function createFinalSignal({ host, spec, node, action, sources, blocked, complete }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const frame = node('section', 'final-signal-frame');
  frame.append(node('p', 'signal-label', 'LAST SIGNAL / MISSION MEMORY'));
  const title = node('h2', '', spec.title);
  title.id = 'exhibit-title';
  const note = node('p', 'signal-note', 'A modern narrator reflects on NASA records. These are not the spacecraft’s recorded last words.');
  const screen = node('div', 'signal-glass');
  const header = node('div', 'signal-screen-header');
  header.append(node('span', '', 'MISSION ARCHIVE'), node('span', 'signal-connection', 'END OF CONTACT'));
  const text = node('p', 'signal-text');
  const location = node('div', 'signal-location');
  location.append(node('span', '', 'LAST KNOWN REGION'), node('strong', '', spec.location));
  screen.append(header, title, text, location);
  const cabinet = node('div', 'signal-cabinet');
  for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
    const screw = node('i', 'signal-screw ' + corner);
    screw.setAttribute('aria-hidden', 'true');
    cabinet.append(screw);
  }
  const deck = node('div', 'signal-deck');
  deck.setAttribute('aria-hidden', 'true');
  const speaker = node('span', 'signal-speaker');
  const lamps = node('span', 'signal-lamps');
  for (let i = 0; i < 3; i++) lamps.append(node('i'));
  const plate = node('span', 'signal-plate', 'KEEP THEIR STORIES ALIVE');
  deck.append(speaker, lamps, plate, node('i', 'signal-dial'), node('i', 'signal-dial'));
  cabinet.append(screen, deck);
  const accessible = node('details', 'signal-transcript');
  accessible.append(node('summary', '', 'Read the complete story'), ...spec.paragraphs.map(p => node('p', '', p)));
  const controls = node('div', 'signal-controls');
  const counter = node('span', 'signal-counter');
  let sound = true;
  let audioContext;
  const audio = action('Sound on', () => { sound = !sound; audio.textContent = sound ? 'Sound on' : 'Sound off'; audio.setAttribute('aria-pressed', String(sound)); if (!sound) audioContext?.close(); });
  audio.setAttribute('aria-pressed', 'true');
  audio.setAttribute('aria-label', 'Toggle the brief screen static sound effect');
  const pause = action('Pause', () => { paused = !paused; pause.textContent = paused ? 'Resume' : 'Pause'; pause.setAttribute('aria-pressed', String(paused)); });
  const next = action('Next →', () => advance());
  const finish = action('Skip to timeline →', () => complete(false));
  controls.append(counter, audio, pause, next, finish);
  const evidence = node('details', 'signal-evidence');
  evidence.append(node('summary', '', 'NASA records behind this story'), sources(spec.sources));
  frame.append(cabinet, controls, note, accessible, evidence);
  host.append(frame);
  let index = 0;
  let elapsed = 0;
  let paused = false;
  let last = performance.now();
  let animation;
  let stopped = false;
  let ending = false;
  let blackout = 0;
  function render() {
    const paragraph = spec.paragraphs[index];
    text.textContent = reduced.matches ? paragraph : paragraph.slice(0, Math.floor(elapsed / 22));
    counter.textContent = `${index + 1} / ${spec.paragraphs.length}`;
    next.textContent = index === spec.paragraphs.length - 1 ? 'Thank you · Return home →' : 'Next →';
  }
  function advance() {
    if (ending || stopped) return;
    const paragraph = spec.paragraphs[index];
    if (!reduced.matches && elapsed < paragraph.length * 22) { elapsed = paragraph.length * 22; render(); return; }
    if (index < spec.paragraphs.length - 1) { index++; elapsed = 0; render(); }
    else {
      ending = true;
      frame.classList.add('signal-ending');
      controls.inert = true;
      if (sound) {
        try {
          audioContext = new AudioContext();
          const noise = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 1.5), audioContext.sampleRate);
          const samples = noise.getChannelData(0);
          for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
          const source = audioContext.createBufferSource();
          source.buffer = noise;
          const filter = audioContext.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 1600;
          const gain = audioContext.createGain();
          gain.gain.setValueAtTime(.025, audioContext.currentTime);
          gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.5);
          source.connect(filter).connect(gain).connect(audioContext.destination);
          source.start();
        } catch {}
      }
    }
  }
  function tick(now) {
    const delta = Math.min(100, now - last);
    last = now;
    if (!paused && !blocked()) {
      if (audioContext?.state === 'suspended' && sound) audioContext.resume().catch(() => {});
      if (ending) {
        blackout += delta;
        frame.style.setProperty('--signal-dark', String(Math.min(1, blackout / 1600)));
        if (blackout >= 1900) { complete(true); return; }
      } else {
        elapsed += delta;
        render();
        if (!reduced.matches && elapsed > spec.paragraphs[index].length * 22 + 5500) advance();
      }
    } else if (audioContext?.state === 'running') audioContext.suspend().catch(() => {});
    if (!stopped) animation = requestAnimationFrame(tick);
  }
  render();
  animation = requestAnimationFrame(tick);
  return {
    sync() { if (blocked() && audioContext?.state === 'running') audioContext.suspend().catch(() => {}); },
    stop() { stopped = true; cancelAnimationFrame(animation); if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {}); }
  };
}
