const make = (tag, cls = "", text) => {
  const node = document.createElement(tag);
  node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};
const control = (label, handler) => {
  const item = make("button", "recording-control", label);
  item.type = "button";
  item.addEventListener("click", handler);
  return item;
};
const time = (value) =>
  `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
export function createCassettePlayer({ asset, recordings }) {
  const audio = new Audio();
  audio.preload = "auto";
  audio.className = "cassette-audio";
  audio.hidden = true;
  let ui;
  let selected = 0;
  let epoch = 0;
  const blocked = () =>
    !ui ||
    !document.querySelector("#exhibit-dialog").open ||
    document.hidden ||
    document.body.classList.contains("orientation-blocked");
  function update() {
    if (!ui) return;
    const duration = Number.isFinite(audio.duration)
      ? audio.duration
      : recordings.clips[selected].durationSeconds;
    ui.play.textContent = audio.paused ? "Play recording" : "Pause recording";
    ui.mute.textContent = audio.muted ? "Sound off" : "Sound on";
    ui.mute.setAttribute("aria-pressed", String(!audio.muted));
    ui.seek.max = String(duration);
    ui.seek.value = String(audio.currentTime);
    ui.readout.textContent = `${time(audio.currentTime)} / ${time(duration)}`;
    const cues = recordings.clips[selected].transcript;
    ui.lines.forEach((line, index) => {
      const current =
        audio.currentTime >= cues[index].start &&
        audio.currentTime < cues[index].end;
      line.classList.toggle("is-current", current);
      if (current) line.setAttribute("aria-current", "true");
      else line.removeAttribute("aria-current");
    });
  }
  async function play() {
    if (blocked()) return;
    const request = epoch;
    try {
      await audio.play();
      if (request === epoch && blocked()) audio.pause();
    } catch {
      if (ui && request === epoch)
        ui.status.textContent = "Press Play recording to listen.";
    }
  }
  function select(index, autoplay = true) {
    epoch++;
    audio.pause();
    selected = index;
    const clip = recordings.clips[index];
    audio.src = asset(clip.file);
    audio.load();
    ui.choices.forEach((item, i) =>
      item.setAttribute("aria-pressed", String(i === index)),
    );
    ui.title.textContent = clip.title;
    ui.kind.textContent = clip.kind;
    ui.source.textContent = `Source recording: ${time(clip.start)}–${time(clip.end)} · NASA/JPL podcast, 2022`;
    ui.transcript.replaceChildren();
    ui.lines = clip.transcript.map((cue) => {
      const line = make("p", "recording-line");
      line.append(
        make("span", "recording-speaker", cue.speaker),
        make("span", "recording-words", cue.text),
      );
      ui.transcript.append(line);
      return line;
    });
    ui.status.textContent =
      "Ready to listen. You can also read the full text below.";
    update();
    if (autoplay) play();
  }
  function close() {
    epoch++;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audio.remove();
    ui = undefined;
  }
  function render(host) {
    close();
    const root = make("section", "cassette-player");
    const nav = make("nav", "recording-chapters");
    nav.setAttribute("aria-label", "Choose an audio chapter");
    const body = make("section", "recording-detail");
    const title = make("h3");
    const kind = make("p", "recording-kind");
    const source = make("p", "recording-source");
    const playButton = control("Play recording", () =>
      audio.paused ? play() : audio.pause(),
    );
    const replay = control("Replay", () => {
      audio.currentTime = 0;
      play();
    });
    const mute = control("Sound on", () => {
      audio.muted = !audio.muted;
      update();
    });
    const tools = make("div", "recording-controls");
    tools.append(playButton, replay, mute);
    const seek = make("input", "recording-seek");
    seek.type = "range";
    seek.min = "0";
    seek.step = ".1";
    seek.value = "0";
    seek.setAttribute("aria-label", "Recording playback position");
    seek.addEventListener("input", () => {
      audio.currentTime = Number(seek.value);
      update();
    });
    const readout = make("span", "recording-time");
    const status = make("p", "recording-status");
    status.setAttribute("role", "status");
    const transcript = make("div", "recording-transcript");
    transcript.setAttribute("aria-label", "Selected recording transcript");
    const choices = recordings.clips.map((clip, index) => {
      const item = control(
        `${String(index + 1).padStart(2, "0")} · ${clip.title} · ${Math.round(clip.durationSeconds)}s`,
        () => select(index),
      );
      nav.append(item);
      return item;
    });
    ui = {
      root,
      title,
      kind,
      source,
      play: playButton,
      mute,
      seek,
      readout,
      status,
      transcript,
      choices,
      lines: [],
    };
    body.append(
      title,
      kind,
      tools,
      seek,
      readout,
      status,
      make("h4", "", "Read along"),
      transcript,
      source,
    );
    const link = make(
      "a",
      "recording-source-link",
      "Open NASA’s full episode & transcript ↗",
    );
    link.href = recordings.source.page;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const download = make(
      "a",
      "recording-source-link",
      "Download all chapter transcripts ↓",
    );
    download.href = "content/sojourner-transcripts.txt";
    download.download = "sojourner-transcripts.txt";
    body.append(link, make("br"), download);
    root.append(nav, body, audio);
    host.append(root);
    select(0, false);
  }
  for (const event of [
    "timeupdate",
    "loadedmetadata",
    "durationchange",
    "volumechange",
  ])
    audio.addEventListener(event, update);
  audio.addEventListener("play", () => {
    if (ui) ui.status.textContent = "Listening… Follow the highlighted text.";
    update();
  });
  audio.addEventListener("pause", () => {
    if (ui)
      ui.status.textContent = audio.ended
        ? "Chapter finished. Choose another chapter or replay."
        : "Paused. Continue whenever you are ready.";
    update();
  });
  audio.addEventListener("ended", () => {
    if (ui)
      ui.status.textContent =
        "Chapter finished. Choose another chapter or replay.";
    update();
  });
  audio.addEventListener("error", () => {
    if (ui && audio.getAttribute("src"))
      ui.status.textContent =
        "This recording could not play. Its full text is available below.";
  });
  return {
    render,
    start: play,
    close,
    sync() {
      if (blocked()) audio.pause();
    },
  };
}
