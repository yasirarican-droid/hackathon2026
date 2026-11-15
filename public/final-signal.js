export function createFinalSignal({ host, spec, node, action, sources, blocked, complete, audioURL }) {
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
  const voice = audioURL ? node('audio', 'signal-voice') : null;
  const playback = node('div', 'signal-playback');
  const seek = node('input', 'signal-seek');
  seek.type = 'range';
  seek.min = '0';
  seek.max = '1000';
  seek.step = '1';
  seek.value = '0';
  seek.setAttribute('aria-label', 'Seek Last Signal narration');
  const time = node('span', 'signal-time', '0:00');
  const status = node('p', 'signal-audio-status');
  status.setAttribute('role', 'status');
  playback.hidden = !voice;
  playback.append(seek, time);
  if (voice) {
    voice.hidden = true;
    voice.preload = 'auto';
    voice.src = audioURL;
    frame.append(voice);
  }
  let sound = true;
  let failed = false;
  let autoplayBlocked = false;
  let starting = false;
  let audioContext;
  const audio = action('Sound on', () => { sound = !sound; audio.textContent = sound ? 'Sound on' : 'Sound off'; audio.setAttribute('aria-pressed', String(sound)); if (voice) voice.muted = !sound; if (!sound && audioContext?.state !== 'closed') audioContext?.close().catch(() => {}); });
  audio.setAttribute('aria-pressed', 'true');
  audio.setAttribute('aria-label', voice ? 'Toggle Last Signal narration and static sound' : 'Toggle the brief screen static sound effect');
  const pause = action('Pause', () => {
    if (voice && !failed) {
      if (autoplayBlocked || paused) { autoplayBlocked = false; paused = false; }
      else paused = true;
      sync();
    } else paused = !paused;
    updateControls();
  });
  const next = action('Next →', () => advance());
  const finish = action('Skip to timeline →', () => complete(false));
  controls.append(counter, audio, pause, next, finish);
  const evidence = node('details', 'signal-evidence');
  evidence.append(node('summary', '', 'NASA records behind this story'), sources(spec.sources));
  frame.append(cabinet, playback, controls, status, note, accessible, evidence);
  host.append(frame);
  let index = 0;
  let elapsed = 0;
  let paused = false;
  let last = performance.now();
  let animation;
  let stopped = false;
  let ending = false;
  let blackout = 0;
  function formatTime(value) {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }
  function updateControls() {
    pause.textContent = autoplayBlocked ? 'Play narration' : paused ? 'Resume' : 'Pause';
    pause.setAttribute('aria-pressed', String(paused));
    next.disabled = Boolean(voice && !failed && index === spec.paragraphs.length - 1);
    next.textContent = index === spec.paragraphs.length - 1
      ? voice && !failed ? 'Final paragraph' : 'Thank you · Return home →'
      : 'Next →';
  }
  function render() {
    if (voice && !failed) {
      const position = voice.currentTime;
      index = Math.max(0, spec.audio.paragraphs.findLastIndex(p => position + .001 >= p.start));
      const paragraph = spec.audio.paragraphs[index];
      text.textContent = reduced.matches || autoplayBlocked ? spec.paragraphs[index] : paragraph.cues.map(cue => {
        if (position < cue.start) return '';
        if (position >= cue.end) return cue.text;
        const fraction = Math.max(0, Math.min(1, (position - cue.start) / Math.max(.005, cue.end - cue.start)));
        return cue.text.slice(0, Math.ceil(cue.text.length * fraction));
      }).join('');
      const duration = Number.isFinite(voice.duration) ? voice.duration : spec.audio.durationSeconds;
      seek.value = String(Math.round(position / duration * 1000));
      time.textContent = formatTime(position) + ' / ' + formatTime(duration);
      seek.setAttribute('aria-valuetext', formatTime(position) + ' of ' + formatTime(duration));
    } else {
      const paragraph = spec.paragraphs[index];
      text.textContent = reduced.matches ? paragraph : paragraph.slice(0, Math.floor(elapsed / 22));
    }
    counter.textContent = `${index + 1} / ${spec.paragraphs.length}`;
    updateControls();
  }
  function advance() {
    if (ending || stopped) return;
    if (voice && !failed) {
      if (index < spec.paragraphs.length - 1) {
        voice.currentTime = spec.audio.paragraphs[index + 1].start;
        render();
      }
      return;
    }
    const paragraph = spec.paragraphs[index];
    if (!reduced.matches && elapsed < paragraph.length * 22) { elapsed = paragraph.length * 22; render(); return; }
    if (index < spec.paragraphs.length - 1) { index++; elapsed = 0; render(); }
    else beginEnding();
  }
  function beginEnding() {
    if (ending || stopped) return;
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
        if (voice && !failed) {
          render();
          if (voice.ended && !autoplayBlocked) beginEnding();
        } else {
          elapsed += delta;
          render();
          if (!reduced.matches && elapsed > spec.paragraphs[index].length * 22 + 5500) advance();
        }
      }
    } else if (audioContext?.state === 'running') audioContext.suspend().catch(() => {});
    if (!stopped) animation = requestAnimationFrame(tick);
  }
  async function sync() {
    if (stopped) return;
    if (blocked() || paused || ending) {
      voice?.pause();
      if (audioContext?.state === 'running') audioContext.suspend().catch(() => {});
      return;
    }
    if (!voice || failed || !voice.paused || voice.ended || starting || autoplayBlocked) return;
    starting = true;
    try {
      await voice.play();
      if (stopped || blocked() || paused || ending) voice.pause();
      else status.textContent = '';
    } catch {
      if (!stopped && !failed && !paused && !blocked()) {
        autoplayBlocked = true;
        status.textContent = 'Press Play narration to hear the message. The story is also readable below.';
        render();
      }
    } finally { starting = false; updateControls(); }
  }
  seek.addEventListener('input', () => {
    if (!voice || failed || !Number.isFinite(voice.duration)) return;
    voice.currentTime = Number(seek.value) / 1000 * voice.duration;
    render();
  });
  if (voice) {
    for (const event of ['timeupdate', 'seeked', 'loadedmetadata']) voice.addEventListener(event, () => { if (!stopped) render(); });
    voice.addEventListener('ended', () => { if (!stopped && !blocked() && !paused) beginEnding(); });
    voice.addEventListener('error', () => {
      if (stopped) return;
      failed = true;
      voice.pause();
      playback.hidden = true;
      status.textContent = 'The recording could not play. You can still read the complete story or use Next.';
      render();
    });
    voice.load();
  }
  render();
  animation = requestAnimationFrame(tick);
  return {
    start: sync,
    sync,
    stop() {
      stopped = true;
      cancelAnimationFrame(animation);
      if (voice) { voice.pause(); voice.removeAttribute('src'); voice.load(); }
      if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
    }
  };
}
