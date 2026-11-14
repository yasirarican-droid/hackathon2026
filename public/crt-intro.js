export function createCRTIntro({ spec, audioURL, blocked, onFinish }) {
  const get = (selector) => document.querySelector(selector);
  const room = get("#room-page");
  const stage = get("#room-stage");
  const panel = get("#crt-intro-screen");
  const terminal = get("#crt-intro-terminal");
  const text = get("#crt-intro-text");
  const scroll = get("#crt-intro-scroll");
  const progress = get("#crt-intro-progress");
  const voice = new Audio();
  voice.id = "crt-intro-audio";
  voice.hidden = true;
  panel.append(voice);
  voice.preload = "auto";
  if (audioURL) {
    voice.src = audioURL;
    voice.load();
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let fullText = spec.paragraphs.join("\n\n");
  scroll.replaceChildren(text, get(".crt-intro-cursor"));
  get("#crt-intro-label").textContent = spec.label;
  get("#crt-intro-accessible").textContent = fullText;
  let active = false;
  let paused = false;
  let revealing = false;
  let sound = true;
  let clock;
  let zoom;
  let frame;
  let epoch = 0;
  let lastCount = -1;
  let zoomTransform = "";
  let startingVoice = false;

  function positionCamera() {
    if (!active) return;
    if (revealing) {
      complete();
      return;
    }
    const crt = get(".crt-center");
    const consolePlane = get(".room-console");
    if (!stage.offsetWidth || !stage.offsetHeight) return;
    const scale = 3.15;
    const x = crt.offsetLeft + crt.offsetWidth / 2;
    const y = consolePlane.offsetTop + crt.offsetTop + crt.offsetHeight / 2;
    zoomTransform = `matrix(${scale},0,0,${scale},${stage.offsetWidth / 2 - x * scale},${stage.offsetHeight / 2 - y * scale})`;
    stage.style.transformOrigin = "0 0";
    stage.style.transform = zoomTransform;
  }

  function render() {
    const duration =
      audioURL && Number.isFinite(voice.duration)
        ? voice.duration * 1000
        : spec.previewDurationMs;
    const elapsed = audioURL
      ? voice.currentTime * 1000
      : Number(clock?.currentTime || 0);
    const fraction = Math.min(1, Math.max(0, elapsed / duration));
    let shown = fullText.slice(0, Math.floor(fullText.length * fraction));
    if (audioURL && spec.audio.cues.length) {
      shown = spec.audio.cues
        .map((cue) => {
          const amount = Math.max(
            0,
            Math.min(
              1,
              (voice.currentTime - cue.start) /
                Math.max(0.01, cue.end - cue.start),
            ),
          );
          return cue.text.slice(0, Math.floor(cue.text.length * amount));
        })
        .filter(Boolean)
        .join("");
    }
    if (reduced.matches && !audioURL) shown = fullText;
    if (shown.length !== lastCount) {
      text.textContent = shown;
      lastCount = shown.length;
      scroll.scrollTop = scroll.scrollHeight;
    }
    if (audioURL || reduced.matches)
      progress.style.transform = `scaleX(${fraction})`;
  }

  function tick() {
    render();
    frame = null;
    if (
      active &&
      !paused &&
      !blocked() &&
      !revealing &&
      !(reduced.matches && !audioURL)
    )
      frame = requestAnimationFrame(tick);
  }

  async function sync() {
    if (!active) return;
    const waiting = paused || blocked();
    if (!blocked() && !revealing) positionCamera();
    panel.classList.toggle("intro-is-paused", waiting);
    get("#crt-intro-pause").textContent = paused ? "Resume" : "Pause";
    if (revealing) {
      if (waiting) zoom?.pause();
      else zoom?.play();
      return;
    }
    if (waiting) {
      clock?.pause();
      voice.pause();
      if (frame) cancelAnimationFrame(frame);
      frame = null;
      return;
    }
    if (audioURL) {
      if (voice.paused && !startingVoice) {
        startingVoice = true;
        const currentEpoch = epoch;
        try {
          await voice.play();
          if (currentEpoch !== epoch || blocked() || paused || !active)
            voice.pause();
        } catch {
          if (active && currentEpoch === epoch) {
            paused = true;
            get("#crt-intro-pause").textContent = "Play";
            get("#crt-intro-status").textContent =
              "Press Play to hear the introduction.";
          }
        } finally {
          startingVoice = false;
        }
      }
    } else if (!reduced.matches) clock?.play();
    render();
    if (
      !frame &&
      active &&
      !paused &&
      !blocked() &&
      !(reduced.matches && !audioURL)
    )
      frame = requestAnimationFrame(tick);
  }

  function stop() {
    epoch++;
    active = false;
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    clock?.cancel();
    zoom?.cancel();
    clock = zoom = null;
    voice.pause();
    voice.currentTime = 0;
    stage.style.transform = "";
    stage.style.transformOrigin = "";
    room.inert = false;
    panel.hidden = true;
    terminal.hidden = true;
    document.body.classList.remove("crt-intro-active", "crt-intro-revealing");
  }

  function complete() {
    if (!active) return;
    stop();
    onFinish();
  }

  function finish() {
    if (!active || revealing) return;
    if (reduced.matches) {
      complete();
      return;
    }
    revealing = true;
    clock?.cancel();
    voice.pause();
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    document.body.classList.add("crt-intro-revealing");
    panel.hidden = true;
    zoom = stage.animate(
      [{ transform: zoomTransform }, { transform: "matrix(1,0,0,1,0,0)" }],
      {
        duration: spec.revealMs,
        easing: "cubic-bezier(.2,.7,.2,1)",
        fill: "forwards",
      },
    );
    const currentEpoch = epoch;
    zoom.finished
      .then(() => {
        if (active && epoch === currentEpoch) complete();
      })
      .catch(() => {});
    sync();
  }

  function start() {
    stop();
    active = true;
    paused = false;
    revealing = false;
    lastCount = -1;
    room.hidden = false;
    room.inert = true;
    panel.hidden = false;
    terminal.hidden = false;
    document.body.classList.add("crt-intro-active");
    get("#crt-intro-status").textContent = audioURL
      ? "NASA-BASED NARRATION · NOT ARCHIVAL AUDIO"
      : "TEXT PREVIEW · NARRATION PENDING";
    get("#crt-intro-sound").disabled = !audioURL;
    get("#crt-intro-sound").setAttribute("aria-pressed", String(sound));
    get("#crt-intro-sound").textContent = sound ? "Sound on" : "Sound off";
    get("#crt-intro-pause").hidden = reduced.matches && !audioURL;
    get("#crt-intro-skip").textContent =
      reduced.matches && !audioURL ? "Enter archive →" : "Skip intro →";
    voice.muted = !sound;
    progress.style.transform = "scaleX(0)";
    if (!audioURL) {
      clock = progress.animate(
        [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
        { duration: spec.previewDurationMs, fill: "forwards" },
      );
      const currentEpoch = epoch;
      clock.finished
        .then(() => {
          if (active && currentEpoch === epoch) finish();
        })
        .catch(() => {});
      if (reduced.matches) {
        clock.pause();
        clock.currentTime = spec.previewDurationMs - 1;
      }
    }
    positionCamera();
    scroll.scrollTop = 0;
    render();
    sync();
    get(
      reduced.matches && !audioURL ? "#crt-intro-skip" : "#crt-intro-pause",
    ).focus({ preventScroll: true });
  }

  function configure(next) {
    stop();
    spec = next.spec;
    audioURL = next.audioURL;
    fullText = spec.paragraphs.join("\n\n");
    get("#crt-intro-label").textContent = spec.label;
    get("#crt-intro-accessible").textContent = fullText;
    get(".crt-intro-hud .console-button").textContent =
      spec.hudLabel || "MISSION ARCHIVE / 20 JUL 1969";
    panel.querySelector("[data-open]").dataset.open =
      spec.textPanel || "crt-intro-text";
    panel.setAttribute("aria-label", spec.label);
    if (audioURL) voice.src = audioURL;
    else voice.removeAttribute("src");
    voice.load();
  }

  get("#crt-intro-pause").addEventListener("click", () => {
    paused = !paused;
    sync();
  });
  get("#crt-intro-replay").addEventListener("click", start);
  get("#crt-intro-skip").addEventListener("click", complete);
  get("#crt-intro-sound").addEventListener("click", () => {
    sound = !sound;
    voice.muted = !sound;
    get("#crt-intro-sound").setAttribute("aria-pressed", String(sound));
    get("#crt-intro-sound").textContent = sound ? "Sound on" : "Sound off";
  });
  voice.addEventListener("ended", finish);
  voice.addEventListener("timeupdate", render);
  voice.addEventListener("waiting", render);
  window.addEventListener("resize", positionCamera);
  reduced.addEventListener("change", () => {
    positionCamera();
    sync();
  });
  return {
    configure,
    start,
    stop,
    sync,
    get active() {
      return active;
    },
  };
}
