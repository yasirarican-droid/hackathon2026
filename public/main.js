import {
  loadProgress,
  saveProgress,
  safeIds,
} from "./progress-store.js?v=20261114-guides1";
import {
  renderLearningGuide,
  mountPartLesson,
} from "./learning-guide.js?v=20261114-guides1";
import { createCassettePlayer } from "./cassette-player.js?v=20261114-guides1";
import { sojournerItems } from "./sojourner-room.js?v=20261114-guides1";
import { createCRTIntro } from "./crt-intro.js?v=20261114-guides1";
import { createSideScreens } from "./side-screens.js?v=20261114-guides1";
import {
  createMissionRoom,
  pressureChart,
  vikingItems,
} from "./mission-room.js?v=20261114-guides1";

import { createExplorerGuide } from "./explorer-guide.js?v=20261114-guides1";

const $ = (selector) => document.querySelector(selector);
const assets = new Map();
const completed = new Map();
const discoveries = new Set();
const vikingDiscoveries = new Set();
const sojournerDiscoveries = new Set();
const roomItems = [
  "mission",
  "eagle",
  "science",
  "photos",
  "seismometer",
  "footprint",
  "samples",
  "timeline",
  "radio",
  "apollo-story",
  "legacy",
];
const galleryItems = ["photos", "footprint", "seismometer", "reflector"];
const dialog = $("#exhibit-dialog");
const content = $("#exhibit-content");
let archive;
let learning;
const savedProgress = loadProgress();
const goalsSolved = new Set();
let progressSaved = false;
let media;
let lastFocus;
let activePanel;
let paused = false;
const quizProgress = new Map();
let preparing = false;
let prepared = false;
let noticeTimer;
let eagleExplorer;
let vikingExplorer;
let sojournerExplorer;
const storyPanels = new Set([
  "apollo-story",
  "viking-message",
  "sojourner-message",
]);
let crtIntro;
let missionRoom;
let sideScreens;
let explorerGuide;
let cassettePlayer;
let vikingPressure;
let crtIntroSeen = false;
let briefingSeen = false;
let briefingActive = false;
let briefingPaused = false;
let briefingAnimations = [];
const briefingReducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const arrivalVideo = $("#arrival-video");
arrivalVideo.muted = false;
let arrivalSoundWanted = true;
let arrivalAutoplayBlocked = false;
let arrivalSoundPending = false;
let arrivalSeen = false;
let entryMission = "apollo";
const entryVisits = new Map();
let arrivalActive = false;
let arrivalUserPaused = false;
let arrivalPlayPending = false;
let arrivalEpoch = 0;
const storyVoice = new Audio();
storyVoice.preload = "auto";
const homeMusic = new Audio();
homeMusic.loop = true;
homeMusic.volume = 0.35;
homeMusic.preload = "auto";
let musicWanted = true;
let musicStarting = false;
const orientationQuery = window.matchMedia(
  "(max-width: 1024px) and (orientation: portrait)",
);
let orientationFocus;

function syncOrientation() {
  const blocked = orientationQuery.matches;
  const wasBlocked = document.body.classList.contains("orientation-blocked");
  document.body.classList.toggle("orientation-blocked", blocked);
  $("#application").inert = blocked;
  $("#preparation").inert = blocked;
  $("#orientation-guard").setAttribute("aria-hidden", String(!blocked));
  if (blocked && !wasBlocked) {
    orientationFocus = document.activeElement;
    if (dialog.open) dialog.close();
    $("#orientation-title").focus();
  } else if (!blocked && wasBlocked && orientationFocus?.isConnected) {
    if (orientationFocus.getClientRects().length) orientationFocus.focus();
  }
  syncMusic();
}

function musicAllowed() {
  return (
    prepared &&
    musicWanted &&
    !orientationQuery.matches &&
    !$("#home-page").hidden &&
    !document.hidden &&
    !dialog.open
  );
}

function updateMusicButton() {
  const playing = !homeMusic.paused && !homeMusic.ended;
  const button = $("#music-toggle");
  button.textContent = playing ? "♫ Music on" : "♫ Music off";
  button.setAttribute("aria-pressed", String(playing));
  button.setAttribute(
    "aria-label",
    playing ? "Pause homepage music" : "Play homepage music",
  );
}

async function syncMusic() {
  sideScreens?.sync();
  cassettePlayer?.sync();
  crtIntro?.sync();
  syncBriefing();
  syncArrival();
  if (document.hidden || orientationQuery.matches) storyVoice.pause();
  eagleExplorer?.sync();
  vikingExplorer?.sync();
  sojournerExplorer?.sync();
  if (!musicAllowed()) {
    homeMusic.pause();
    updateMusicButton();
    return;
  }
  if (!homeMusic.paused || musicStarting) return;
  musicStarting = true;
  try {
    await homeMusic.play();
    if (!musicAllowed()) homeMusic.pause();
  } catch {
    updateMusicButton();
  } finally {
    musicStarting = false;
  }
}

homeMusic.addEventListener("playing", updateMusicButton);
homeMusic.addEventListener("pause", updateMusicButton);

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function asset(path) {
  if (!assets.has(path)) throw new Error("Asset was not prepared: " + path);
  return assets.get(path);
}

function link(title, url) {
  const anchor = node("a", "", title);
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("Invalid source");
  anchor.href = parsed.href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  return anchor;
}

function action(label, fn) {
  const button = node("button", "", label);
  button.type = "button";
  button.addEventListener("click", fn);
  return button;
}

function updateProgress(total, complete = false) {
  const bytes = [...completed.values()].reduce((sum, value) => sum + value, 0);
  const percent =
    total > 0
      ? Math.min(complete ? 100 : 99, Math.floor((bytes / total) * 100))
      : 0;
  $("#prepare-percent").textContent = String(percent);
  $("#preparation").style.setProperty("--load-progress", `${percent}%`);
  $("#prepare-progress").max = total;
  $("#prepare-progress").value = bytes;
}

async function download(entry, total) {
  if (assets.has(entry.path)) return;
  completed.set(entry.path, 0);
  const response = await fetch(`${entry.path}?v=${entry.sha256.slice(0, 16)}`, {
    cache: "force-cache",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error("Could not load " + entry.path);
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    completed.set(entry.path, Math.min(received, entry.bytes));
    updateProgress(total);
  }
  if (received !== entry.bytes) {
    completed.set(entry.path, 0);
    updateProgress(total);
    throw new Error("Archive changed during download: " + entry.path);
  }
  assets.set(
    entry.path,
    URL.createObjectURL(
      new Blob(chunks, {
        type:
          response.headers.get("Content-Type") || "application/octet-stream",
      }),
    ),
  );
}

async function prepare() {
  if (preparing || prepared) return;
  preparing = true;
  $("#prepare-retry").hidden = true;
  $("#prepare-status").hidden = true;
  $("#prepare-stage").textContent = "Loading…";
  try {
    const response = await fetch("content/manifest.json", {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("The archive manifest is unavailable.");
    const manifest = await response.json();
    const total = manifest.reduce((sum, entry) => sum + entry.bytes, 0);
    const queue = [...manifest];
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, async () => {
        while (queue.length) await download(queue.shift(), total);
      }),
    );
    const failure = results.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;
    $("#prepare-stage").textContent = "Preparing your illustrations…";
    homeMusic.src = asset("assets/audio/lets-explore.mp3");
    homeMusic.load();
    arrivalVideo.src = asset("assets/video/moon-arrival-web.mp4");
    arrivalVideo.load();
    archive = await (await fetch(asset("content/archive.json"))).json();
    learning = await (await fetch(asset("content/learning.json"))).json();
    restoreLearningProgress();
    const storyFile = archive.panels["apollo-story"].narration.file;
    if (storyFile) {
      storyVoice.src = asset(storyFile);
      storyVoice.load();
    }
    media = await (await fetch(asset("content/media.json"))).json();
    cassettePlayer = createCassettePlayer({
      asset,
      recordings: await (
        await fetch(asset("content/sojourner-recordings.json"))
      ).json(),
    });
    vikingPressure = await (
      await fetch(asset("content/viking-pressure.json"))
    ).json();
    for (const image of document.querySelectorAll("[data-asset]"))
      image.src = asset(image.dataset.asset);
    for (const [variable, path] of [
      ["--room-art", "apollo-room-v2.webp"],
      ["--props-art", "desk-props-v2.webp"],
    ]) {
      document.documentElement.style.setProperty(
        variable,
        `url("${asset("assets/art/" + path)}")`,
      );
    }
    await Promise.all(
      [...document.images].map((image) =>
        image.decode().catch(() => {
          throw new Error("An illustration could not be decoded.");
        }),
      ),
    );
    const { createEagleExplorer } = await import(
      asset("vendor/eagle-viewer.js")
    );
    eagleExplorer = await createEagleExplorer({
      modelURL: asset("assets/models/apollo-lunar-module.glb"),
      decoderJS: asset("vendor/draco/draco_wasm_wrapper.js"),
      decoderWasm: asset("vendor/draco/draco_decoder.wasm"),
      preview: $("#eagle-preview"),
    });
    if (eagleExplorer)
      $("#eagle-preview-hint").textContent =
        "NASA 3D MODEL · TAP TO EXPLORE ↗";
    missionRoom = createMissionRoom({
      asset,
      pressure: vikingPressure,
      duration: archive.sojournerDuration,
    });
    vikingExplorer = await createEagleExplorer({
      modelURL: asset("assets/models/viking-lander.glb"),
      decoderJS: asset("vendor/draco/draco_wasm_wrapper.js"),
      decoderWasm: asset("vendor/draco/draco_decoder.wasm"),
      preview: $("#viking-preview"),
      mission: "viking",
    });
    sojournerExplorer = await createEagleExplorer({
      modelURL: asset("assets/models/sojourner-educational.glb"),
      additionalModels: [asset("assets/models/pathfinder-educational.glb")],
      preview: $("#sojourner-preview"),
      mission: "sojourner",
      authored: true,
      modelLabels: [
        "Sojourner rover educational 3D reconstruction based on NASA references",
        "Mars Pathfinder lander educational 3D reconstruction based on NASA references",
      ],
    });
    crtIntro = createCRTIntro({
      spec: archive.crtIntro,
      audioURL: archive.crtIntro.audio.file
        ? asset(archive.crtIntro.audio.file)
        : null,
      blocked: () => document.hidden || orientationQuery.matches || dialog.open,
      onFinish: () => {
        crtIntroSeen = true;
        route();
        $("#room-page").tabIndex = -1;
        $("#room-page").focus({ preventScroll: true });
      },
    });
    sideScreens = createSideScreens({
      asset,
      archive,
      pressure: vikingPressure,
      openExhibit,
    });
    updateProgress(total, true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await Promise.all(
      $(".loading-ship")
        .getAnimations()
        .map((animation) => animation.finished.catch(() => {})),
    );
    prepared = true;
    $("#application").hidden = false;
    $("#preparation").hidden = true;
    route();
    explorerGuide = createExplorerGuide({
      asset,
      context: () => {
        const page = ["#apollo", "#viking", "#sojourner"].includes(location.hash)
          ? currentMission()
          : "home";
        return {
          page,
          solved: learning[page]?.goals.filter(g => goalsSolved.has(page + ":" + g.id)).length || 0,
          blocked: document.hidden || orientationQuery.matches || dialog.open || briefingActive || arrivalActive || crtIntro?.active || !prepared,
        };
      },
      open: openExhibit,
      navigate: () => {
        location.hash = "missions";
        document.querySelector('.year-label')?.focus({ preventScroll: true });
      },
    });
  } catch (error) {
    $("#prepare-stage").textContent = "Please try again.";
    $("#prepare-status").hidden = false;
    $("#prepare-status").textContent =
      "Some files could not load. Please try again.";
    console.error("Archive preparation failed:", error);
    $("#prepare-retry").hidden = false;
  } finally {
    preparing = false;
  }
}

function cancelBriefing() {
  briefingActive = false;
  for (const animation of briefingAnimations) animation.cancel();
  briefingAnimations = [];
  $("#briefing-screen").hidden = true;
  $("#briefing-screen").classList.remove("briefing-is-paused");
}

function currentMission() {
  return location.hash === "#sojourner"
    ? "sojourner"
    : location.hash === "#viking"
      ? "viking"
      : "apollo";
}
function restoreLearningProgress() {
  for (const [mission, ids, set] of [
    ["apollo", roomItems, discoveries],
    ["viking", vikingItems, vikingDiscoveries],
    ["sojourner", sojournerItems, sojournerDiscoveries],
  ])
    for (const id of safeIds(savedProgress.visited?.[mission], ids))
      set.add(id);
  const allowed = ["apollo", "viking", "sojourner"].flatMap((m) =>
    learning[m].goals.map((g) => m + ":" + g.id),
  );
  for (const id of safeIds(savedProgress.goals, allowed)) goalsSolved.add(id);
  for (const id of ["legacy", "viking-legacy", "sojourner-legacy"]) {
    const step = savedProgress.quiz?.[id];
    if (
      Number.isInteger(step) &&
      step >= 0 &&
      step <= archive.panels[id].quiz.length
    )
      quizProgress.set(id, step);
  }
  for (const mission of ["apollo", "viking", "sojourner"]) {
    const saved = savedProgress.entries?.[mission];
    if (saved && typeof saved === "object")
      entryVisits.set(mission, {
        briefingSeen: saved.briefingSeen === true,
        arrivalSeen: saved.arrivalSeen === true,
        crtIntroSeen: saved.crtIntroSeen === true,
      });
  }
  const visit = entryVisits.get(entryMission);
  if (visit) {
    briefingSeen = visit.briefingSeen;
    arrivalSeen = visit.arrivalSeen;
    crtIntroSeen = visit.crtIntroSeen;
  }
  saveAllProgress();
}
function saveAllProgress() {
  progressSaved = saveProgress({
    visited: {
      apollo: [...discoveries],
      viking: [...vikingDiscoveries],
      sojourner: [...sojournerDiscoveries],
    },
    goals: [...goalsSolved],
    quiz: Object.fromEntries(quizProgress),
    entries: Object.fromEntries([
      ...entryVisits,
      [entryMission, { briefingSeen, arrivalSeen, crtIntroSeen }],
    ]),
  });
  updateLearningUI();
}
function updateLearningUI() {
  if (!learning) return;
  for (const [mission, set] of [
    ["apollo", discoveries],
    ["viking", vikingDiscoveries],
    ["sojourner", sojournerDiscoveries],
  ]) {
    const count = learning[mission].goals.filter((g) =>
      goalsSolved.has(mission + ":" + g.id),
    ).length;
    const label = document.querySelector(
      `[data-learning-progress="${mission}"]`,
    );
    if (label)
      label.textContent = `${set.size} objects opened · ${count} / 3 learning goals`;
  }
  const mission = currentMission();
  const count = learning[mission].goals.filter((g) =>
    goalsSolved.has(mission + ":" + g.id),
  ).length;
  const guideButton = $("#learning-guide-open");
  if (guideButton) {
    guideButton.classList.toggle("goals-complete", count === 3);
    guideButton.setAttribute("aria-label", `Open Field Guide · ${count} of 3 goals complete`);
    guideButton.replaceChildren();
    const icon = node("span", "field-guide-icon", "✦");
    icon.setAttribute("aria-hidden", "true");
    const copy = node("span", "field-guide-copy");
    copy.append(node("strong", "", "Field Guide"), node("small", "", count === 3 ? "3 / 3 goals · Great exploring!" : `${count} / 3 goals · Follow the clues`));
    const dots = node("span", "field-guide-dots");
    dots.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 3; i++) dots.append(node("i", i < count ? "is-solved" : ""));
    guideButton.append(icon, copy, dots);
  }
}
function openLearningGuide() {
  renderLearningGuide({
    host: content,
    mission: currentMission(),
    data: learning,
    solved: goalsSolved,
    solve: (id) => {
      goalsSolved.add(id);
      saveAllProgress();
    },
    open: openExhibit,
    sources: sourceNotes,
    node,
    action,
    saved: progressSaved,
    reset: () => {
      if (
        !confirm(
          "Reset the objects opened, quiz progress and learning goals saved on this device?",
        )
      )
        return;
      discoveries.clear();
      vikingDiscoveries.clear();
      sojournerDiscoveries.clear();
      goalsSolved.clear();
      quizProgress.clear();
      saveAllProgress();
      openExhibit("learning-guide");
    },
  });
}
function enterMission(mission, story) {
  entryVisits.set(entryMission, { briefingSeen, arrivalSeen, crtIntroSeen });
  cancelBriefing();
  stopArrival();
  crtIntro?.stop();
  entryMission = mission;
  briefingSeen = arrivalSeen = crtIntroSeen = !story;
  entryVisits.set(mission, { briefingSeen, arrivalSeen, crtIntroSeen });
  saveAllProgress();
  if (location.hash === "#" + mission) route();
  else location.hash = mission;
}

function entryData() {
  return entryMission === "sojourner"
    ? archive.sojournerEntry
    : entryMission === "viking"
      ? archive.vikingEntry
      : {
          name: "Apollo 11",
          destination: "MOON",
          briefing: archive.briefing,
          crtIntro: archive.crtIntro,
          arrivalFile: "assets/video/moon-arrival-web.mp4",
          arrivalStatus: "Eagle approaches the Moon.",
          arrivalWatermarkEmbedded: true,
        };
}

function finishBriefing() {
  if (!briefingActive || location.hash !== "#" + entryMission) return;
  briefingSeen = true;
  cancelBriefing();
  route();
  if (!$("#room-page").hidden) {
    $("#room-page").tabIndex = -1;
    $("#room-page").focus({ preventScroll: true });
  }
}

function syncBriefing() {
  if (!briefingActive) return;
  const paused =
    briefingPaused ||
    document.hidden ||
    orientationQuery.matches ||
    dialog.open ||
    briefingReducedMotion.matches;
  $("#briefing-screen").classList.toggle("briefing-is-paused", paused);
  for (const animation of briefingAnimations) {
    if (paused) animation.pause();
    else animation.play();
  }
  $("#briefing-pause").textContent = briefingPaused
    ? "Resume animation"
    : "Pause animation";
  $("#briefing-pause").setAttribute("aria-pressed", String(briefingPaused));
  $("#briefing-pause").hidden = briefingReducedMotion.matches;
  $("#briefing-skip").textContent = briefingReducedMotion.matches
    ? "Enter archive →"
    : "Skip →";
}

function startBriefing() {
  if (!archive || location.hash !== "#" + entryMission) return;
  cancelBriefing();
  crtIntro?.stop();
  crtIntroSeen = false;
  stopArrival();
  arrivalSeen = false;
  if (dialog.open) dialog.close();
  briefingActive = true;
  briefingPaused = false;
  $("#home-page").hidden = true;
  $("#room-page").hidden = true;
  $("#briefing-screen").hidden = false;
  const entry = entryData();
  const data = entry.briefing;
  $("#briefing-screen").dataset.destination = entry.destination;
  $(".briefing-moon-label").textContent = entry.destination;
  $(".briefing-subtitle").replaceChildren(
    document.createTextNode(data.subtitle + " "),
  );
  $(".briefing-subtitle").append(node("span", "", "· " + data.year));
  $("#briefing-title").textContent = data.title;
  $("#briefing-distance").textContent =
    data.distanceText || `≈${data.distanceKm.toLocaleString("en-US")} km`;
  $("#briefing-distance-context").textContent =
    data.distanceContextText ||
    `${data.distanceMiles.toLocaleString("en-US")} miles · ${data.distanceContext}`;
  $("#briefing-landing").textContent = data.landing;
  $("#briefing-note").textContent = data.illustrationNote;
  const facts = $("#briefing-facts");
  facts.replaceChildren();
  for (const [label, value] of data.facts) {
    const fact = node("div", "briefing-fact");
    fact.append(node("span", "", label), node("strong", "", value));
    facts.append(fact);
  }
  const options = {
    duration: data.durationMs,
    fill: "forwards",
    easing: "cubic-bezier(0.35, 0, 0.3, 1)",
  };
  const journey = $("#briefing-ship").animate(
    [{ left: "0%" }, { left: "100%" }],
    options,
  );
  const trail = $(".briefing-flight-trail").animate(
    [{ width: "0%" }, { width: "100%" }],
    options,
  );
  briefingAnimations = [journey, trail];
  journey.finished
    .then(() => {
      if (briefingActive && briefingAnimations[0] === journey) finishBriefing();
    })
    .catch(() => {});
  if (briefingReducedMotion.matches)
    for (const animation of briefingAnimations)
      animation.currentTime = data.durationMs - 1;
  document.title = entry.name + " — Mission briefing";
  window.scrollTo(0, 0);
  $("#briefing-title").focus({ preventScroll: true });
  syncMusic();
}

function updateArrivalControls() {
  $("#arrival-play").textContent = arrivalVideo.paused ? "Play" : "Pause";
  $("#arrival-sound").textContent = arrivalVideo.muted
    ? "Sound off"
    : "Sound on";
  $("#arrival-sound").setAttribute("aria-pressed", String(!arrivalVideo.muted));
  const ready =
    Number.isFinite(arrivalVideo.duration) && arrivalVideo.duration > 0;
  $("#arrival-seek").disabled = !ready;
  if (ready)
    $("#arrival-seek").value = String(
      (arrivalVideo.currentTime / arrivalVideo.duration) * 100,
    );
}

function stopArrival() {
  arrivalEpoch++;
  arrivalActive = false;
  arrivalVideo.pause();
  arrivalVideo.currentTime = 0;
  $("#arrival-screen").hidden = true;
}

async function syncArrival() {
  if (!arrivalActive) return;
  if (
    arrivalUserPaused ||
    document.hidden ||
    orientationQuery.matches ||
    dialog.open
  ) {
    arrivalVideo.pause();
    updateArrivalControls();
    return;
  }
  if (!arrivalVideo.paused || arrivalPlayPending) return;
  arrivalPlayPending = true;
  const epoch = arrivalEpoch;
  try {
    await arrivalVideo.play();
    if (epoch !== arrivalEpoch) return;
    arrivalAutoplayBlocked = false;
    if (
      !arrivalActive ||
      arrivalUserPaused ||
      document.hidden ||
      orientationQuery.matches ||
      dialog.open
    )
      arrivalVideo.pause();
    else $("#arrival-status").textContent = entryData().arrivalStatus;
  } catch (error) {
    if (arrivalActive && epoch === arrivalEpoch) {
      arrivalAutoplayBlocked = error.name === "NotAllowedError";
      if (arrivalAutoplayBlocked && !arrivalVideo.muted) {
        arrivalVideo.muted = true;
        arrivalSoundPending = arrivalSoundWanted;
        try {
          await arrivalVideo.play();
          if (epoch !== arrivalEpoch) return;
          arrivalAutoplayBlocked = false;
          if (
            arrivalUserPaused ||
            document.hidden ||
            orientationQuery.matches ||
            dialog.open
          )
            arrivalVideo.pause();
          $("#arrival-status").textContent = "Playing. Tap to enable sound.";
          return;
        } catch {
          arrivalAutoplayBlocked = true;
        }
      }
      if (!arrivalAutoplayBlocked) arrivalUserPaused = true;
      $("#arrival-status").textContent =
        "Press Play to watch, or Skip to enter the archive.";
    }
  } finally {
    arrivalPlayPending = false;
    updateArrivalControls();
    if (arrivalActive && epoch !== arrivalEpoch) syncArrival();
  }
}

function startArrival() {
  if (!archive || location.hash !== "#" + entryMission) return;
  if (dialog.open) dialog.close();
  stopArrival();
  crtIntro?.stop();
  crtIntroSeen = false;
  arrivalActive = true;
  arrivalAutoplayBlocked = false;
  arrivalSoundPending = false;
  arrivalUserPaused = false;
  $("#home-page").hidden = true;
  $("#room-page").hidden = true;
  $("#briefing-screen").hidden = true;
  $("#arrival-screen").hidden = false;
  const entry = entryData();
  if (!entry.arrivalFile) {
    arrivalSeen = true;
    route();
    return;
  }
  $("#arrival-ai-credit").hidden =
    Boolean(entry.arrivalWatermarkEmbedded) ||
    !["viking", "sojourner"].includes(entryMission);
  const source = asset(entry.arrivalFile);
  if (arrivalVideo.getAttribute("src") !== source) {
    arrivalVideo.src = source;
    arrivalVideo.load();
  }
  arrivalVideo.setAttribute(
    "aria-label",
    "AI-generated illustrated " +
      entry.name +
      " arrival animation; not original NASA footage",
  );
  $("#arrival-title").textContent =
    entry.name.toUpperCase() + " / ILLUSTRATED ARRIVAL";
  arrivalVideo.muted = !arrivalSoundWanted;
  $("#arrival-status").textContent = arrivalUserPaused
    ? "Press Play to watch, or Skip to enter the archive."
    : entry.arrivalStatus;
  updateArrivalControls();
  document.title = entry.name + " — Illustrated arrival";
  window.scrollTo(0, 0);
  $("#arrival-title").focus({ preventScroll: true });
  syncMusic();
}

function finishArrival() {
  if (!arrivalActive || location.hash !== "#" + entryMission) return;
  arrivalSeen = true;
  stopArrival();
  route();
  if (!crtIntro?.active) {
    $("#room-page").tabIndex = -1;
    $("#room-page").focus({ preventScroll: true });
  }
}

function startCRTIntro() {
  if (!archive || !crtIntro || location.hash !== "#" + entryMission) return;
  $("#home-page").hidden = true;
  $("#room-page").hidden = false;
  $("#briefing-screen").hidden = true;
  $("#arrival-screen").hidden = true;
  crtIntroSeen = false;
  const entry = entryData();
  document.title = entry.name + " — CRT introduction";
  window.scrollTo(0, 0);
  crtIntro.configure({
    spec: entry.crtIntro,
    audioURL: entry.crtIntro.audio.file
      ? asset(entry.crtIntro.audio.file)
      : null,
  });
  crtIntro.start();
  syncMusic();
}

function route() {
  explorerGuide?.reset();
  if (!archive) return;
  updateLearningUI();
  if (dialog.open) dialog.close();
  const room = location.hash === "#apollo";
  const viking = location.hash === "#viking";
  const sojourner = location.hash === "#sojourner";
  const inRoom = room || viking || sojourner;
  if (!inRoom) {
    crtIntro?.stop();
    if (briefingActive) cancelBriefing();
    if (arrivalActive) stopArrival();
  }
  const nextMission = sojourner ? "sojourner" : viking ? "viking" : "apollo";
  if (inRoom && nextMission !== entryMission) {
    entryVisits.set(entryMission, { briefingSeen, arrivalSeen, crtIntroSeen });
    cancelBriefing();
    stopArrival();
    crtIntro?.stop();
    entryMission = nextMission;
    const visit = entryVisits.get(entryMission);
    briefingSeen = visit?.briefingSeen || false;
    arrivalSeen = visit?.arrivalSeen || false;
    crtIntroSeen = visit?.crtIntroSeen || false;
  }
  if (inRoom)
    missionRoom?.apply(sojourner ? "sojourner" : viking ? "viking" : "apollo");
  if (inRoom)
    sideScreens?.setMission(
      sojourner ? "sojourner" : viking ? "viking" : "apollo",
    );
  if (sojourner) $("#arrival-replay").hidden = !entryData().arrivalFile;
  if (inRoom && !briefingSeen) {
    if (!briefingActive) startBriefing();
    return;
  }
  if (briefingActive) cancelBriefing();
  if (inRoom && !arrivalSeen) {
    if (entryData().arrivalFile) {
      if (!arrivalActive) startArrival();
      return;
    }
    arrivalSeen = true;
  }
  if (inRoom && !crtIntroSeen) {
    if (!crtIntro?.active) startCRTIntro();
    return;
  }
  $("#home-page").hidden = inRoom;
  $("#room-page").hidden = !inRoom;
  const seen = sojourner
    ? sojournerDiscoveries
    : viking
      ? vikingDiscoveries
      : discoveries;
  $("#discovery-count").textContent =
    `${seen.size} / ${sojourner ? sojournerItems.length : viking ? vikingItems.length : roomItems.length} discoveries`;
  document.title = sojourner
    ? "Sojourner — Mars Archive"
    : viking
      ? "Viking 1 — Mars Archive"
      : room
        ? "Apollo 11 — Moon Archive"
        : "Abandoned, But Not Forgotten — Moon & Mars Archive";
  if (location.hash === "#missions")
    $("#missions").scrollIntoView({ behavior: "instant" });
  else window.scrollTo(0, 0);
  saveAllProgress();
  syncMusic();
}

function sourceNotes(ids) {
  const section = node("section", "source-notes");
  section.append(node("h3", "", "Follow the evidence"));
  for (const id of ids) {
    const source = archive.sources[id];
    section.append(link(source.title, source.url));
  }
  return section;
}

function imageFigure(id) {
  const record = media.find((item) => item.id === id);
  const figure = node("figure", "evidence-figure");
  const image = node("img");
  image.src = asset(record.file);
  image.alt = `${record.imageId} — ${record.credit}`;
  const caption = node(
    "figcaption",
    "",
    `${record.imageId} · ${record.credit}. ${record.kind || "Original NASA image"}; `,
  );
  caption.append(link("view source", record.source));
  figure.append(image, caption);
  return figure;
}

function showObjects() {
  openExhibit("objects");
}

function renderQuiz(host, questions) {
  let quizStep = quizProgress.get(activePanel) || 0;
  host.replaceChildren();
  if (quizStep >= questions.length) {
    host.append(
      node("p", "panel-tag", "THREE DISCOVERIES MADE"),
      node("h3", "", "Curiosity looks good on you."),
      node("p", "", "You followed the objects, measurements and evidence."),
      action("Explore again", () => {
        quizProgress.set(activePanel, 0);
        saveAllProgress();
        renderQuiz(host, questions);
      }),
    );
    const recap = node("ul", "quiz-recap");
    for (const question of questions)
      recap.append(node("li", "", question.explanation));
    host.append(
      recap,
      action("Open my field guide →", () => openExhibit("learning-guide")),
    );
    return;
  }
  const item = questions[quizStep];
  host.append(
    node("p", "panel-tag", `DISCOVERY ${quizStep + 1} / ${questions.length}`),
    node("h3", "", item.question),
  );
  const choices = node("div", "choices");
  const feedback = node("p", "quiz-feedback");
  feedback.setAttribute("aria-live", "polite");
  for (const [index, label] of item.choices.entries()) {
    const button = action(label, () => {
      if (index !== item.answer) {
        button.classList.add("incorrect");
        feedback.textContent = "Take another look. You can try again.";
        return;
      }
      button.classList.add("correct");
      choices
        .querySelectorAll("button")
        .forEach((control) => (control.disabled = true));
      feedback.textContent = item.explanation;
      const next = action(
        quizStep === questions.length - 1
          ? "See your discoveries →"
          : "Next discovery →",
        () => {
          quizStep++;
          quizProgress.set(activePanel, quizStep);
          saveAllProgress();
          renderQuiz(host, questions);
          host.querySelector("h3").tabIndex = -1;
          host.querySelector("h3").focus();
        },
      );
      host.append(next);
      next.focus();
    });
    choices.append(button);
  }
  host.append(choices, feedback);
}

function renderSources() {
  content.append(
    node("p", "panel-tag", "THE EVIDENCE DESK"),
    node("h2", "", "Sources & making this archive"),
  );
  content.lastElementChild.id = "exhibit-title";
  content.append(
    node(
      "p",
      "panel-intro",
      "What we used, where it came from, and what it supports.",
    ),
  );
  for (const [id, source] of Object.entries(archive.sources)) {
    const card = node("section", "source-card");
    const uses = Object.entries(archive.panels)
      .filter(([, panel]) => panel.sources.includes(id))
      .map(([, panel]) => panel.title)
      .concat(
        archive.briefing.sources.includes(id)
          ? ["Apollo 11 mission briefing"]
          : [],
      )
      .concat(
        archive.crtIntro.sources.includes(id)
          ? ["Apollo CRT introduction"]
          : [],
      )
      .concat(
        archive.vikingEntry.briefing.sources.includes(id)
          ? ["Viking Earth–Mars briefing"]
          : [],
      )
      .concat(
        archive.vikingEntry.crtIntro.sources.includes(id)
          ? ["Viking CRT introduction"]
          : [],
      )
      .concat(
        archive.sojournerEntry.briefing.sources.includes(id)
          ? ["Sojourner Earth–Mars briefing"]
          : [],
      )
      .concat(
        archive.sojournerEntry.crtIntro.sources.includes(id)
          ? ["Sojourner CRT introduction"]
          : [],
      )
      .join("; ");
    card.append(
      link(source.title, source.url),
      node("p", "", source.usedFor),
      node("small", "", `Used in: ${uses}. Checked 14 November 2026.`),
    );
    content.append(card);
  }
  content.append(node("h3", "", "Original NASA image records"));
  for (const item of media) {
    const card = node("section", "source-card");
    card.append(
      link(`${item.imageId} · ${item.credit}`, item.source),
      node("p", "", item.processing),
      node(
        "small",
        "",
        `Local file: ${item.file} · Retrieved ${item.retrieved} · SHA-256 ${item.sha256}`,
      ),
    );
    content.append(card);
  }
  const card = node("section", "source-card");
  card.append(
    node("h3", "", "AI assistance & third-party materials"),
    node(
      "p",
      "",
      "OpenAI Codex assisted code and original explanatory text. OpenAI ImageGen produced the decorative illustrations. Their origin and the production tools are described in How this archive was made. Original NASA photographs, data and archived NASA/JPL voices are separately credited. Narration was generated with ElevenLabs; homepage music with Suno. The owner confirms paid plans at production. ID3 disclosures are embedded in the synthetic MP3s. Narration is modern educational storytelling, not original mission audio. Per-file hashes, original source history and processing are in content/narration.json and related metadata.",
    ),
    node(
      "p",
      "",
      "Patrick Hand, Kalam and Share Tech Mono are served locally with their SIL Open Font License files. Scientific image credits are retained separately. This project is not endorsed by NASA. Project-authored code is Apache-2.0 licensed; media and third-party source content retain their own terms.",
    ),
  );
  const metadataLink = node("a", "", "AI usage and asset metadata");
  metadataLink.href = "content/ai-usage.json";
  card.append(metadataLink);
  const timelineArtLink = node(
    "a",
    "",
    "Illustrated timeline monitors — artwork provenance",
  );
  timelineArtLink.href = "content/timeline-art.json";
  card.append(timelineArtLink);
  const productionAuditLink = node(
    "a",
    "",
    "Production dates and retired-asset audit",
  );
  productionAuditLink.href = "content/production-audit.json";
  card.append(productionAuditLink);
  const licenseLink = node("a", "", "Apache 2.0 code license");
  licenseLink.href = "licenses/APACHE-2.0.txt";
  const thirdPartyLink = node(
    "a",
    "",
    "Third-party licenses, media rights and AI tools",
  );
  thirdPartyLink.href = "licenses/THIRD_PARTY.txt";
  card.append(licenseLink, thirdPartyLink);
  content.append(card);
  const modelCard = node("section", "source-card");
  modelCard.append(
    link(
      "NASA / Michael D. Carbajal — Apollo Lunar Module 3D model",
      archive.sources.model.url,
    ),
    node(
      "p",
      "",
      "The supplied GLB matches NASA's original download byte-for-byte. Used in the Meet Eagle CRT and enlarged 3D explorer. Geometry and embedded textures are unchanged; enhanced material appearance is a viewing adjustment.",
    ),
  );
  const modelMetadata = node(
    "a",
    "",
    "3D model verification and material details",
  );
  modelMetadata.href = "content/model.json";
  modelCard.append(modelMetadata);
  for (const [label, href] of [
    [
      "NASA Viking Lander — original model, file verification & display colors",
      "content/viking-model.json",
    ],
    ["Viking decorative prop provenance", "content/viking-props.json"],
    ["Sojourner decorative art provenance", "content/sojourner-art.json"],
    [
      "Sojourner and Pathfinder educational 3D model sources",
      "content/sojourner-models.json",
    ],
    [
      "Sojourner audio chapters, transcript and edit provenance",
      "content/sojourner-recordings.json",
    ],
  ]) {
    const localLink = node("a", "", label);
    localLink.href = href;
    modelCard.append(localLink);
  }
  content.append(modelCard);
  const videoCard = node("section", "source-card");
  videoCard.append(
    node("h3", "", "Owner-provided arrival animation"),
    node(
      "p",
      "",
      "moon-animation.mp4 is used between the mission briefing and the Apollo room. Playback uses a web-optimized video copy with the original audio stream and visible AI-generation mark; the supplied original is retained unchanged outside the published site. This illustrated film is not original NASA mission footage.",
    ),
  );
  const videoMetadata = node("a", "", "Video origin and file verification");
  videoMetadata.href = "content/video.json";
  videoCard.append(videoMetadata);
  content.append(videoCard);
  const vikingVideoCard = node("section", "source-card");
  vikingVideoCard.append(
    node("h3", "", "Viking arrival animation"),
    node(
      "p",
      "",
      "mars-viking-landed.mp4 was supplied by the owner. Playback uses a web-optimized copy; the original supplied video is retained unchanged outside the published site. The original audio stream is copied. This illustrated arrival is not NASA mission footage or recorded telemetry.",
    ),
  );
  const vikingVideoLink = node(
    "a",
    "",
    "Viking video provenance & original file hash",
  );
  vikingVideoLink.href = "content/viking-video.json";
  vikingVideoCard.append(vikingVideoLink);
  content.append(vikingVideoCard);
  const sojournerVideoCard = node("section", "source-card");
  sojournerVideoCard.append(
    node("h3", "", "Sojourner arrival animation"),
    node(
      "p",
      "",
      "mars-sojourney-landing.mp4 was supplied by the owner. Playback uses a web-optimized copy; the supplied original is retained unchanged outside the published site. AI-generated visual by ChatGPT + Kling AI, per owner attribution. This illustrated landing is not NASA mission footage or measured telemetry.",
    ),
  );
  const sojournerVideoLink = node(
    "a",
    "",
    "Sojourner video provenance & original file hash",
  );
  sojournerVideoLink.href = "content/sojourner-video.json";
  sojournerVideoCard.append(sojournerVideoLink);
  content.append(sojournerVideoCard);
}

function renderMissionStory(id) {
  const panel = archive.panels[id];
  const spread = node("div", "story-spread");
  const art = node("section", "story-art");
  const frame = node("figure", "story-postcard");
  const image = node("img");
  image.src = asset(panel.illustration);
  image.alt =
    panel.illustrationAlt ||
    "An imagined friendly Eagle lunar module with four landing legs on the Moon, saying Hello, explorer!";
  frame.append(image);
  const controls = node("div", "story-controls");
  const play = action("Play story", () => {
    if (storyVoice.paused) playStory();
    else storyVoice.pause();
  });
  const replay = action("Replay story", () => {
    storyVoice.currentTime = 0;
    playStory();
  });
  play.id = "story-play";
  const seek = node("input", "story-seek");
  seek.type = "range";
  seek.min = "0";
  seek.max = "100";
  seek.value = "0";
  seek.setAttribute("aria-label", "Story playback position");
  seek.addEventListener("input", () => {
    if (Number.isFinite(storyVoice.duration))
      storyVoice.currentTime = (Number(seek.value) / 100) * storyVoice.duration;
  });
  const status = node(
    "p",
    "story-status",
    panel.narration.file
      ? "Press play to hear the story."
      : "Read along. The voice message is being prepared.",
  );
  status.id = "story-status";
  status.setAttribute("role", "status");
  play.disabled = replay.disabled = seek.disabled = !panel.narration.file;
  controls.append(play, replay);
  art.append(
    frame,
    controls,
    seek,
    status,
    node(
      "p",
      "story-art-caption",
      panel.illustrationCaption ||
        "An imagined Eagle character. A story grounded in NASA facts.",
    ),
  );
  const copy = node("section", "story-copy");
  copy.append(node("p", "panel-tag", panel.tag));
  const heading = node("h2", "", panel.title);
  heading.id = "exhibit-title";
  copy.append(heading, node("p", "panel-intro", panel.intro));
  for (const paragraph of panel.paragraphs)
    copy.append(node("p", "story-paragraph", paragraph));
  copy.append(
    id === "apollo-story"
      ? action("Read the real landing transcript →", () => openExhibit("radio"))
      : action(
          id === "sojourner-message"
            ? "Explore the landing photographs →"
            : "Explore the first photograph →",
          () =>
            openExhibit(
              id === "sojourner-message" ? "sojourner-photos" : "viking-photos",
            ),
        ),
    sourceNotes(panel.sources),
  );
  spread.append(art, copy);
  content.append(spread);
}

async function playStory() {
  if (
    !storyPanels.has(activePanel) ||
    !archive.panels[activePanel].narration.file ||
    !dialog.open
  )
    return;
  const requestedPanel = activePanel;
  try {
    await storyVoice.play();
    if (
      activePanel !== requestedPanel ||
      !dialog.open ||
      document.hidden ||
      orientationQuery.matches
    )
      storyVoice.pause();
  } catch {
    if ($("#story-status"))
      $("#story-status").textContent = "Press Play story to listen.";
  }
}

function updateStoryControls() {
  if (!$("#story-play")) return;
  $("#story-play").textContent = storyVoice.paused
    ? "Play story"
    : "Pause story";
  if (
    storyPanels.has(activePanel) &&
    archive.panels[activePanel].narration.file
  )
    $("#story-status").textContent = storyVoice.ended
      ? "The story ends. Your exploration continues."
      : storyVoice.paused
        ? "Press play to continue the story."
        : "Listening to the mission story…";
  if (Number.isFinite(storyVoice.duration) && storyVoice.duration > 0)
    $(".story-seek").value = String(
      (storyVoice.currentTime / storyVoice.duration) * 100,
    );
}
for (const event of ["play", "pause", "ended", "timeupdate"])
  storyVoice.addEventListener(event, updateStoryControls);

function openExhibit(id) {
  explorerGuide?.reset();
  if (!archive) return;
  sideScreens?.closePanel();
  cassettePlayer?.close();
  if (!dialog.open) lastFocus = document.activeElement;
  activePanel = id;
  storyVoice.pause();
  storyVoice.currentTime = 0;
  if (storyPanels.has(id)) {
    const file = archive.panels[id].narration.file;
    if (file) storyVoice.src = asset(file);
    else storyVoice.removeAttribute("src");
    storyVoice.load();
  }
  dialog.classList.toggle("story-dialog", storyPanels.has(id));
  eagleExplorer?.preview();
  vikingExplorer?.preview();
  sojournerExplorer?.wireframe(false);
  sojournerExplorer?.selectModel(0);
  sojournerExplorer?.preview();
  content.replaceChildren();
  if (storyPanels.has(id)) renderMissionStory(id);
  else if (id === "learning-guide") openLearningGuide();
  else if (id === "sources") renderSources();
  else if (id === "objects") {
    const viking = location.hash === "#viking";
    const sojourner = location.hash === "#sojourner";
    content.append(
      node(
        "p",
        "panel-tag",
        sojourner
          ? "SOJOURNER / OBJECT INDEX"
          : viking
            ? "VIKING 1 / OBJECT INDEX"
            : "APOLLO 11 / OBJECT INDEX",
      ),
    );
    const heading = node("h2", "", "Choose a discovery");
    heading.id = "exhibit-title";
    const list = node("div", "object-list");
    for (const key of sojourner
      ? sojournerItems
      : viking
        ? vikingItems
        : [...roomItems, "reflector", "olive", "disc"])
      list.append(action(archive.panels[key].title, () => openExhibit(key)));
    content.append(
      heading,
      node(
        "p",
        "panel-intro",
        "Every object has a story. Every story has a source.",
      ),
      list,
    );
  } else {
    const panel = archive.panels[id];
    if (!panel) return;
    content.append(node("p", "panel-tag", panel.tag));
    const title = node("h2", "", panel.title);
    title.id = "exhibit-title";
    content.append(title, node("p", "panel-intro", panel.intro));
    sideScreens?.renderPanel(id, content);
    if (id === "sojourner-cassette") cassettePlayer?.render(content);
    const explorerModel =
      id === "eagle"
        ? eagleExplorer
        : id === "viking-lander"
          ? vikingExplorer
          : id === "sojourner-rover"
            ? sojournerExplorer
            : null;
    if (explorerModel) {
      const explorer = node("section", "eagle-explorer");
      const stage = node("div", "eagle-stage");
      const authored = id === "sojourner-rover";
      let rebuildParts = () => {};
      if (authored) {
        const chooser = node("div", "model-chooser");
        chooser.setAttribute("aria-label", "Choose rover or lander model");
        const reading = node(
          "p",
          "model-reading",
          "Sojourner rover · about 65 cm long. Six wheels, solar array and rear APXS. Small fittings and antenna dimensions are approximate.",
        );
        const choices = [
          [
            "Sojourner rover",
            "Sojourner rover · about 65 cm long. Six wheels, solar array and rear APXS. Small fittings and antenna dimensions are approximate.",
          ],
          [
            "Pathfinder lander",
            "Pathfinder lander · about 2.75 m across when open. Three solar petals, cameras and antennas. Airbags and internal mechanisms are omitted; the rover is shown separately.",
          ],
        ];
        const buttons = choices.map(([label, description], index) => {
          const choice = action(label, () => {
            explorerModel.selectModel(index);
            rebuildParts(index);
            reading.textContent = description;
            buttons.forEach((item, i) =>
              item.setAttribute("aria-pressed", String(i === index)),
            );
          });
          choice.setAttribute("aria-pressed", String(index === 0));
          chooser.append(choice);
          return choice;
        });
        reading.setAttribute("aria-live", "polite");
        explorer.append(chooser, reading);
      }
      const tools = node("div", "eagle-tools");
      tools.setAttribute("aria-label", "3D model controls");
      tools.append(
        action("Rotate left", () => explorerModel.rotate(-0.3)),
        action("Rotate right", () => explorerModel.rotate(0.3)),
        action("Tilt up", () => explorerModel.rotate(0, -0.2)),
        action("Tilt down", () => explorerModel.rotate(0, 0.2)),
        action("Zoom in +", () => explorerModel.zoom(0.8)),
        action("Zoom out −", () => explorerModel.zoom(1.25)),
        action("Reset view", () => explorerModel.reset()),
      );
      const palette = action(
        authored ? "Wireframe view" : "Original model colors",
        () => {
          const original = palette.getAttribute("aria-pressed") !== "true";
          palette.setAttribute("aria-pressed", String(original));
          if (authored) explorerModel.wireframe(original);
          else explorerModel.colors(original);
        },
      );
      palette.setAttribute("aria-pressed", "false");
      tools.append(palette);
      explorer.append(
        stage,
        tools,
        node(
          "p",
          "eagle-instructions",
          "Drag to rotate · Scroll or pinch to zoom · Arrow keys to turn",
        ),
        node(
          "p",
          "eagle-credit",
          authored
            ? "Educational 3D reconstructions created for this project from NASA references. Not NASA-issued models or engineering CAD. Materials, small fittings and some proportions are simplified."
            : id === "eagle"
              ? "3D model: NASA / Michael D. Carbajal. Materials adjusted for viewing; this is not an exact engineering reconstruction of Eagle."
              : "3D model: NASA / Michael D. Carbajal. Original geometry retained. Display colors are adjusted for viewing, not an exact reconstruction of historical paint.",
        ),
      );
      if (authored)
        explorer.append(
          node(
            "p",
            "model-scale-note",
            "Each model is fitted to the viewer separately. Their displayed sizes are not a size comparison.",
          ),
        );
      content.append(explorer);
      explorerModel.colors(false);
      if (authored) explorerModel.wireframe(false);
      explorerModel.mount(stage);
      const workbench = node("div", "model-workbench");
      stage.before(workbench);
      workbench.append(stage);
      explorerModel.sync();
      rebuildParts = (index = 0) => {
        explorer.querySelector(".part-lesson")?.remove();
        const key = authored
          ? index === 1
            ? "pathfinder"
            : "sojourner"
          : id === "eagle"
            ? "apollo"
            : "viking";
        mountPartLesson({
          host: workbench,
          spec: learning.parts[key],
          viewer: explorerModel,
          node,
          action,
          sources: sourceNotes,
        });
      };
      rebuildParts();
      explorer.append(
        action("Try the mission learning goals →", () =>
          openExhibit("learning-guide"),
        ),
      );
    }
    if (panel.facts) {
      const facts = node("div", "facts" + (id === "art-info" ? " production-tools" : ""));
      for (const [label, value] of panel.facts) {
        const fact = node("div", "fact");
        fact.append(node("span", "", label), node("strong", "", value));
        facts.append(fact);
      }
      content.append(facts);
    }
    const showPanelImage =
      panel.image && !["reflector", "viking-photos"].includes(id);
    const grid = node(
      "div",
      "panel-grid" + (showPanelImage ? "" : " no-image"),
    );
    const copy = node("div", "panel-copy");
    for (const paragraph of panel.paragraphs)
      copy.append(node("p", "", paragraph));
    grid.append(copy);
    if (showPanelImage) grid.append(imageFigure(panel.image));
    content.append(grid);
    if (id === "viking-weather") {
      const detail = node("details", "pressure-table");
      detail.append(
        node("summary", "", "View all 30 measurements & archive flags"),
      );
      const table = node("table");
      const head = node("tr");
      for (const label of ["Sol", "Mean pressure (mbar)", "Archive flags"])
        head.append(node("th", "", label));
      const thead = node("thead");
      thead.append(head);
      const tbody = node("tbody");
      for (const sample of vikingPressure.samples) {
        const row = node("tr");
        for (const value of [
          String(sample.sol),
          sample.pressure.toFixed(3),
          sample.flags,
        ])
          row.append(node("td", "", value));
        tbody.append(row);
      }
      table.append(thead, tbody);
      detail.append(
        table,
        link(
          "Read the original PDS label & flag definitions",
          vikingPressure.label,
        ),
        link("Open the unmodified PDS data table", vikingPressure.source),
      );
      content.append(detail);
    }
    if (panel.quotes) {
      const transcript = node("div", "transcript");
      for (const quote of panel.quotes) {
        const line = node("p");
        line.append(
          node("strong", "", `${quote.time} · ${quote.speaker}`),
          node("q", "", quote.text),
        );
        transcript.append(line);
      }
      content.append(transcript);
    }
    if (id === "art-info") {
      const nav = node("div", "panel-navigation");
      nav.append(action("View NASA sources →", () => openExhibit("sources")));
      content.append(nav);
    }
    if (id === "sojourner-rover") {
      const nav = node("div", "panel-navigation");
      for (const [label, key] of [
        ["Solar power →", "solar"],
        ["The communications team →", "relay"],
        ["Compare original photographs →", "barnacle"],
      ])
        nav.append(action(label, () => openExhibit("sojourner-" + key)));
      content.append(nav);
    }
    if (id === "science") {
      const nav = node("div", "panel-navigation");
      nav.append(
        action("Explore the reflector →", () => openExhibit("reflector")),
        action("Explore the seismometer →", () => openExhibit("seismometer")),
      );
      content.append(nav);
    }
    const gallery = id.startsWith("sojourner-")
      ? ["sojourner-photos", "sojourner-barnacle", "sojourner-yogi"]
      : id.startsWith("viking-")
        ? ["viking-photos", "viking-color", "viking-panorama"]
        : galleryItems;
    if (gallery.includes(id)) {
      const index = gallery.indexOf(id);
      const nav = node("nav", "panel-navigation");
      nav.setAttribute("aria-label", "Evidence gallery");
      nav.append(
        action("← Previous photograph", () =>
          openExhibit(gallery[(index + gallery.length - 1) % gallery.length]),
        ),
        node("span", "", `${index + 1} / ${gallery.length}`),
        action("Next photograph →", () =>
          openExhibit(gallery[(index + 1) % gallery.length]),
        ),
      );
      content.append(nav);
    }
    if (panel.question)
      content.append(node("p", "panel-question", panel.question));
    if (panel.quiz) {
      const quiz = node("section", "quiz");
      renderQuiz(quiz, panel.quiz);
      content.append(quiz);
    }
    if (panel.sources.length) content.append(sourceNotes(panel.sources));
    if (roomItems.includes(id) && location.hash === "#apollo") {
      discoveries.add(id);
      $("#discovery-count").textContent =
        `${discoveries.size} / ${roomItems.length} discoveries`;
    }
  }
  content.scrollTop = 0;
  if (location.hash === "#viking" && vikingItems.includes(id)) {
    vikingDiscoveries.add(id);
    $("#discovery-count").textContent =
      `${vikingDiscoveries.size} / ${vikingItems.length} discoveries`;
  }
  if (location.hash === "#sojourner" && sojournerItems.includes(id)) {
    sojournerDiscoveries.add(id);
    $("#discovery-count").textContent =
      `${sojournerDiscoveries.size} / ${sojournerItems.length} discoveries`;
  }
  document.body.classList.add("exhibit-open");
  if (!dialog.open) dialog.showModal();
  if (id === "sojourner-cassette") cassettePlayer?.start();
  if (storyPanels.has(id)) {
    if (location.hash === "#apollo") {
      discoveries.add(id);
      $("#discovery-count").textContent =
        `${discoveries.size} / ${roomItems.length} discoveries`;
    }
    if (archive.panels[id].narration.file) playStory();
  }
  saveAllProgress();
  syncMusic();
  $("#close-exhibit").focus();
}

function notify(text) {
  clearTimeout(noticeTimer);
  $("#notice").textContent = text;
  $("#notice").hidden = false;
  noticeTimer = setTimeout(() => ($("#notice").hidden = true), 4500);
}

document.addEventListener("click", async (event) => {
  const entry = event.target.closest(
    "[data-explore-mission],[data-story-mission]",
  );
  if (entry) {
    event.preventDefault();
    enterMission(
      entry.dataset.exploreMission || entry.dataset.storyMission,
      Boolean(entry.dataset.storyMission),
    );
    return;
  }
  if (event.target.closest("#music-toggle")) {
    musicWanted = homeMusic.paused;
    syncMusic();
  }
  const opener = event.target.closest("[data-open]");
  if (opener) openExhibit(opener.dataset.open);
  if (event.target.closest(".motion-toggle")) {
    paused = !paused;
    document.body.classList.toggle("motion-paused", paused);
    document.querySelectorAll(".motion-toggle").forEach((button) => {
      button.textContent = paused ? "Resume motion" : "Pause motion";
      button.setAttribute("aria-pressed", String(paused));
    });
    eagleExplorer?.sync();
  }
  if (event.target.closest("[data-fullscreen]")) {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      notify(
        "Fullscreen is unavailable in this browser. You can keep exploring here.",
      );
    }
  }
  if (!event.target.closest("#music-toggle") && homeMusic.paused && musicWanted)
    syncMusic();
  if (arrivalActive && arrivalAutoplayBlocked) syncArrival();
  if (arrivalActive && arrivalSoundPending && arrivalSoundWanted) {
    arrivalSoundPending = false;
    arrivalVideo.muted = false;
    updateArrivalControls();
  }
});

$("#close-exhibit").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => {
  sideScreens?.closePanel();
  cassettePlayer?.close();
  storyVoice.pause();
  storyVoice.currentTime = 0;
  eagleExplorer?.preview();
  vikingExplorer?.preview();
  sojournerExplorer?.wireframe(false);
  sojournerExplorer?.selectModel(0);
  sojournerExplorer?.preview();
  document.body.classList.remove("exhibit-open");
  syncMusic();
  if (lastFocus?.isConnected && lastFocus.getClientRects().length)
    lastFocus.focus();
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
$("#objects-button").addEventListener("click", showObjects);
$("#compact-objects").addEventListener("click", showObjects);
$("#lamp-toggle").addEventListener("click", () => {
  const off = $("#room-stage").classList.toggle("lamp-off");
  $("#lamp-toggle").setAttribute("aria-pressed", String(!off));
  $("#lamp-toggle").setAttribute(
    "aria-label",
    off ? "Turn desk lamp on" : "Turn desk lamp off",
  );
});
document.addEventListener("visibilitychange", () => {
  document.body.classList.toggle(
    "exhibit-open",
    document.hidden || dialog.open,
  );
  syncMusic();
});
window.addEventListener("hashchange", route);
$("#briefing-skip").addEventListener("click", finishBriefing);
$("#arrival-skip").addEventListener("click", finishArrival);
$("#crt-intro-restart").addEventListener("click", startCRTIntro);
$("#arrival-replay").addEventListener("click", () => {
  arrivalSeen = false;
  startArrival();
});
$("#arrival-play").addEventListener("click", () => {
  arrivalUserPaused = !arrivalVideo.paused;
  syncArrival();
});
$("#arrival-sound").addEventListener("click", () => {
  arrivalSoundWanted = arrivalVideo.muted;
  arrivalSoundPending = false;
  arrivalVideo.muted = !arrivalSoundWanted;
  updateArrivalControls();
});
$("#arrival-restart").addEventListener("click", () => {
  arrivalVideo.currentTime = 0;
  arrivalUserPaused = false;
  syncArrival();
});
$("#arrival-seek").addEventListener("input", (event) => {
  if (Number.isFinite(arrivalVideo.duration))
    arrivalVideo.currentTime =
      (Number(event.target.value) / 100) * arrivalVideo.duration;
});
for (const event of [
  "play",
  "pause",
  "timeupdate",
  "loadedmetadata",
  "volumechange",
])
  arrivalVideo.addEventListener(event, updateArrivalControls);
arrivalVideo.addEventListener("ended", finishArrival);
arrivalVideo.addEventListener("error", () => {
  if (arrivalActive)
    $("#arrival-status").textContent =
      "This video could not play. You can still enter with Skip.";
});
$("#briefing-replay").addEventListener("click", startBriefing);
$("#briefing-pause").addEventListener("click", () => {
  briefingPaused = !briefingPaused;
  syncBriefing();
});
briefingReducedMotion.addEventListener("change", syncBriefing);
orientationQuery.addEventListener("change", syncOrientation);
syncOrientation();
$("#prepare-retry").addEventListener("click", prepare);
prepare();
