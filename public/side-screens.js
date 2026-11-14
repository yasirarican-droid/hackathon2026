import { durationChart } from "./sojourner-room.js?v=20261114-learning1";
import { pressureChart } from "./mission-room.js?v=20261114-learning1";

const el = (tag, className = "", text) => {
  const item = document.createElement(tag);
  item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
};
const button = (label, handler, className = "activity-button") => {
  const item = el("button", className, label);
  item.type = "button";
  item.addEventListener("click", handler);
  return item;
};

export function createSideScreens({ asset, archive, pressure, openExhibit }) {
  const get = (selector) => document.querySelector(selector);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const compactBlocked = () =>
    document.hidden ||
    get("#room-page").hidden ||
    get("#exhibit-dialog").open ||
    document.body.matches(
      ".motion-paused,.orientation-blocked,.crt-intro-active",
    );
  const panelBlocked = () =>
    document.hidden ||
    !get("#exhibit-dialog").open ||
    document.body.matches(".motion-paused,.orientation-blocked");
  const image = (file, alt) => {
    const item = el("img");
    item.src = asset(file);
    item.alt = alt;
    return item;
  };
  let mission;
  let previews = [];
  let activities = [];
  const left = el("span", "crt-experience journey-preview");
  const right = el("span", "crt-experience science-preview");
  left.setAttribute("aria-hidden", "true");
  right.setAttribute("aria-hidden", "true");
  get(".crt-left").insertBefore(left, get(".crt-left .crt-hint"));
  get(".crt-right").insertBefore(right, get(".crt-right .crt-hint"));
  document.body.classList.add("has-side-screens");

  function clock(interval, update, blocked, playing = true, once = false) {
    let frame;
    let last;
    let elapsed = 0;
    let index = 0;
    let disposed = false;
    function tick(time) {
      frame = null;
      if (disposed || !playing || blocked() || reduced.matches) {
        last = null;
        return;
      }
      if (last !== null && last !== undefined)
        elapsed += Math.min(time - last, 100);
      last = time;
      if (elapsed >= interval) {
        elapsed %= interval;
        index++;
        if (update(index) === false && once) playing = false;
      }
      if (playing) frame = requestAnimationFrame(tick);
    }
    function sync() {
      if (frame) cancelAnimationFrame(frame);
      frame = null;
      last = null;
      if (!disposed && playing && !blocked() && !reduced.matches)
        frame = requestAnimationFrame(tick);
    }
    return {
      sync,
      play(value) {
        playing = value;
        sync();
      },
      reset() {
        elapsed = 0;
        index = 0;
        last = null;
      },
      dispose() {
        disposed = true;
        if (frame) cancelAnimationFrame(frame);
      },
    };
  }

  function progressDots(events, select) {
    const track = el("div", "journey-dots");
    const dots = events.map((event, index) => {
      const dot = select
        ? button(
            `${event.shortDate} · ${event.name}`,
            () => select(index),
            "journey-dot-button",
          )
        : el("span", "journey-dot");
      track.append(dot);
      return dot;
    });
    return {
      track,
      update(index) {
        dots.forEach((dot, i) => {
          dot.classList.toggle("is-current", i === index);
          if (select) dot.setAttribute("aria-pressed", String(i === index));
        });
      },
    };
  }

  function renderJourneyPreview() {
    left.replaceChildren();
    const events = archive.screenActivities.journeys[mission];
    const dots = progressDots(events);
    const card = el("span", "journey-preview-card");
    const date = el("b", "journey-date");
    const name = el("strong", "journey-name");
    const note = el(
      "small",
      "screen-evidence-label",
      "SOURCED DATES · ILLUSTRATED REPLAY",
    );
    const photo = image("assets/archive/viking-first.jpg", "");
    photo.className = "first-photo-preview";
    card.append(date, name, photo);
    left.append(dots.track, card, note);
    function select(index) {
      const step = index % events.length;
      const event = events[step];
      dots.update(step);
      date.textContent = event.shortDate;
      name.textContent = event.name;
      const reveal = mission === "viking" && step === events.length - 1;
      photo.hidden = !reveal;
      photo.classList.toggle("is-scanning", reveal);
    }
    select(0);
    previews.push(clock(4200, select, compactBlocked));
  }

  function lightDiagram() {
    const diagram = el("div", "light-diagram");
    const earth = el("span", "light-earth", "EARTH");
    const line = el("span", "light-path");
    line.append(el("span", "light-pulse"));
    const moon = el("span", "light-reflector", "MOON");
    diagram.append(earth, line, moon);
    return diagram;
  }

  function renderReflectorPreview() {
    right.replaceChildren();
    const row = el("span", "reflector-preview-row");
    row.append(image("assets/archive/reflector.jpg", ""));
    const count = el("span", "reflector-count");
    count.append(el("strong", "", "100"), el("span", "", "tiny reflectors"));
    row.append(count);
    const diagram = lightDiagram();
    right.append(
      row,
      diagram,
      el(
        "small",
        "screen-evidence-label",
        "ILLUSTRATED LIGHT PATH · NOT TO SCALE",
      ),
    );
    let phase = 0;
    const update = (index) => {
      phase = index % 4;
      diagram.dataset.phase = String(phase);
    };
    update(0);
    previews.push(clock(1300, update, compactBlocked));
  }

  function pressureView(compact = false) {
    const root = el(
      "div",
      "pressure-explorer" + (compact ? " pressure-compact" : ""),
    );
    const readout = el("div", "pressure-readout");
    const day = el("span", "pressure-day");
    const value = el("strong", "pressure-value");
    readout.append(day, value);
    const chart = pressureChart(pressure);
    const trace = chart.querySelector("polyline");
    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    marker.setAttribute("r", "4");
    marker.setAttribute("class", "pressure-marker");
    chart.append(marker);
    root.append(readout, chart);
    function select(index) {
      const sample = pressure.samples[index];
      day.textContent = `SOL ${sample.sol}`;
      value.textContent = `${sample.pressure.toFixed(3)} mbar`;
      marker.setAttribute("cx", String(48 + ((sample.sol - 1) / 29) * 356));
      marker.setAttribute(
        "cy",
        String(155 - ((sample.pressure - 7.2) / 0.5) * 125),
      );
      trace.setAttribute(
        "points",
        pressure.samples
          .slice(0, !compact || reduced.matches ? 30 : index + 1)
          .map(
            (point) =>
              `${48 + ((point.sol - 1) / 29) * 356},${155 - ((point.pressure - 7.2) / 0.5) * 125}`,
          )
          .join(" "),
      );
      chart.setAttribute(
        "aria-label",
        `Viking 1 daily mean pressure, sol ${sample.sol}: ${sample.pressure.toFixed(3)} millibars.`,
      );
    }
    select(0);
    return { root, select };
  }

  function setMission(next) {
    if (mission === next) return;
    previews.forEach((task) => task.dispose());
    previews = [];
    mission = next;
    renderJourneyPreview();
    get(".crt-left").setAttribute(
      "aria-label",
      `Explore ${mission === "apollo" ? "Apollo 11" : mission === "sojourner" ? "Sojourner" : "Viking 1"} mission journey`,
    );
    get(".crt-left .crt-hint").textContent = "TAP TO REPLAY THE JOURNEY ↗";
    if (mission === "apollo") {
      renderReflectorPreview();
      get(".crt-right .crt-hint").textContent = "TAP TO SEND A LIGHT PULSE ↗";
      get(".crt-right").setAttribute(
        "aria-label",
        "Explore Apollo 11 reflector and send an illustrated light pulse",
      );
    } else if (mission === "sojourner") {
      right.replaceChildren(durationChart(archive.sojournerDuration, true));
      get(".crt-right .crt-hint").textContent =
        "TAP TO COMPARE THE MISSION DAYS ↗";
      get(".crt-right").setAttribute(
        "aria-label",
        "Compare Sojourner planned seven days and NASA-reported eighty-three days",
      );
    } else {
      const view = pressureView(true);
      right.replaceChildren(
        view.root,
        el("small", "screen-evidence-label", "MEASURED ARCHIVE · SOLS 1–30"),
      );
      previews.push(
        clock(
          1000,
          (index) => view.select(Math.min(index % 33, 29)),
          compactBlocked,
        ),
      );
      get(".crt-right .crt-hint").textContent =
        "TAP TO EXPLORE MARS WEATHER ↗";
      get(".crt-right").setAttribute(
        "aria-label",
        "Explore Viking 1 measured air pressure and compare Mars days",
      );
    }
    sync();
  }

  function quizLink(root) {
    root.append(
      button("Try the notebook quiz →", () =>
        openExhibit(mission === "apollo" ? "legacy" : mission + "-legacy"),
      ),
    );
  }

  function renderJourney(root, kind) {
    const events = archive.screenActivities.journeys[kind];
    const heading = el("h3", "", "Choose a moment in the journey");
    const detail = el("section", "journey-detail");
    detail.setAttribute("aria-live", "polite");
    const date = el("p", "activity-date");
    const title = el("h4");
    const copy = el("p");
    const photo = el("figure", "journey-evidence");
    const picture = el("img");
    const caption = el("figcaption");
    photo.append(picture, caption);
    const actions = el("div", "activity-controls");
    detail.append(date, title, copy, photo, actions);
    let selected = 0;
    let playing = false;
    const dots = progressDots(events, (index) => {
      playing = false;
      playback.play(false);
      play.textContent = "Play journey";
      select(index);
    });
    function select(index) {
      selected = index % events.length;
      const event = events[selected];
      dots.update(selected);
      date.textContent = event.date;
      title.textContent = event.name;
      copy.textContent = event.description;
      photo.hidden = !event.file;
      if (event.file) {
        picture.src = asset(event.file);
        picture.alt = event.caption;
        caption.textContent = event.caption;
      }
      actions.replaceChildren();
      if (kind === "viking" && selected === events.length - 1)
        actions.append(
          button("Explore the first photograph →", () =>
            openExhibit("viking-photos"),
          ),
        );
    }
    const playback = clock(
      4500,
      () => select(selected + 1),
      panelBlocked,
      false,
    );
    activities.push(playback);
    const play = button("Play journey", () => {
      playing = !playing;
      playback.play(playing);
      play.textContent = playing ? "Pause journey" : "Play journey";
    });
    play.disabled = reduced.matches;
    const previous = button("← Previous moment", () =>
      select((selected + events.length - 1) % events.length),
    );
    const next = button("Next moment →", () => select(selected + 1));
    const controls = el("div", "activity-controls");
    controls.append(previous, play, next);
    root.append(
      heading,
      dots.track,
      detail,
      controls,
      el(
        "p",
        "activity-note",
        "Dates are historical records. Playback is accelerated and does not represent flight speed or distance.",
      ),
    );
    select(0);
    quizLink(root);
  }

  function renderLight(root, id) {
    root.append(el("h3", "", "Can light bring information home?"));
    const evidence = el("div", "reflector-activity-evidence");
    const figure = el("figure");
    figure.append(
      image(
        "assets/archive/reflector.jpg",
        "NASA photograph AS11-40-5952: Apollo 11 laser reflector",
      ),
      el("figcaption", "", "AS11-40-5952 · NASA / Neil Armstrong"),
    );
    const fact = el("div", "reflector-fact");
    fact.append(
      el("strong", "", "100"),
      el("p", "", "small corner-cube reflectors in the Apollo 11 array"),
    );
    evidence.append(figure, fact);
    const diagram = lightDiagram();
    diagram.classList.add("light-diagram-large");
    const status = el(
      "p",
      "activity-feedback",
      "The laser begins at an observatory on Earth.",
    );
    status.setAttribute("role", "status");
    const stages = [
      "The observatory sends a pulse toward the Moon.",
      "The lunar reflector returns some light toward Earth.",
      "Some reflected light travels back toward the observatory.",
      "The observatory detects the returning light. Scientists time the round trip to measure distance.",
    ];
    const pulse = clock(
      1100,
      (index) => {
        diagram.dataset.phase = String(index);
        status.textContent = stages[Math.min(index, 3)];
        if (index >= 3) {
          send.disabled = false;
          return false;
        }
      },
      panelBlocked,
      false,
      true,
    );
    activities.push(pulse);
    const send = button("Send a light pulse", () => {
      pulse.reset();
      diagram.dataset.phase = "0";
      status.textContent = stages[0];
      if (reduced.matches) {
        diagram.dataset.phase = "2";
        status.textContent = stages[3];
        return;
      }
      send.disabled = true;
      pulse.play(true);
    });
    root.append(
      evidence,
      diagram,
      send,
      status,
      el(
        "p",
        "activity-note",
        "Illustrated light path · not to scale or actual light-travel time. This demonstrates the method, not a new measurement.",
      ),
    );
    if (id !== "reflector")
      root.append(
        button("See the original reflector evidence →", () =>
          openExhibit("reflector"),
        ),
      );
    quizLink(root);
  }

  function renderWeather(root) {
    root.append(el("h3", "", "Follow a month of Mars weather"));
    const view = pressureView();
    const label = el(
      "label",
      "activity-slider-label",
      "Choose a Mars day (sol)",
    );
    const slider = el("input", "weather-sol-slider");
    slider.type = "range";
    slider.min = "1";
    slider.max = "30";
    slider.step = "1";
    slider.value = "1";
    slider.setAttribute("aria-label", "Choose a Mars day from 1 to 30");
    label.append(slider);
    const flag = el("p", "activity-note");
    let current = 0;
    let playing = false;
    function select(index) {
      current = index;
      view.select(index);
      slider.value = String(index + 1);
      flag.textContent = `NASA PDS · VL1 · Sol ${index + 1} · Archive flag: ${pressure.samples[index].flags}`;
    }
    const playback = clock(
      1000,
      () => select((current + 1) % 30),
      panelBlocked,
      false,
    );
    activities.push(playback);
    const play = button("Play days", () => {
      playing = !playing;
      playback.play(playing);
      play.textContent = playing ? "Pause days" : "Play days";
    });
    play.disabled = reduced.matches;
    slider.addEventListener("input", () => {
      playing = false;
      playback.play(false);
      play.textContent = "Play days";
      select(Number(slider.value) - 1);
    });
    root.append(
      view.root,
      label,
      play,
      flag,
      el(
        "p",
        "activity-note",
        "Real daily averages in millibars. Lines join recorded points without smoothing. Playback is accelerated; this is not live weather.",
      ),
    );
    const comparison = el("section", "weather-comparison");
    comparison.append(el("h4", "", "Which day had higher air pressure?"));
    const selectors = el("div", "activity-controls");
    const selectorsList = [0, 29].map((initial, i) => {
      const label = el("label", "", i === 0 ? "First day " : "Second day ");
      const menu = el("select", "weather-compare-select");
      menu.setAttribute(
        "aria-label",
        i === 0 ? "First comparison sol" : "Second comparison sol",
      );
      pressure.samples.forEach((sample, index) => {
        const option = el("option", "", `Sol ${sample.sol}`);
        option.value = String(index);
        menu.append(option);
      });
      menu.value = String(initial);
      label.append(menu);
      selectors.append(label);
      return menu;
    });
    const feedback = el("p", "activity-feedback");
    feedback.setAttribute("role", "status");
    const answers = el("div", "activity-controls");
    function refresh() {
      const [a, b] = selectorsList.map(
        (menu) => pressure.samples[Number(menu.value)],
      );
      feedback.textContent = `Sol ${a.sol}: ${a.pressure.toFixed(3)} mbar · Sol ${b.sol}: ${b.pressure.toFixed(3)} mbar`;
      answers.replaceChildren();
      for (const sample of [a, b])
        answers.append(
          button(`Sol ${sample.sol} was higher`, () => {
            if (a.pressure === b.pressure)
              feedback.textContent =
                "These selections have equal pressure. Try two different days.";
            else if (sample.pressure === Math.max(a.pressure, b.pressure))
              feedback.textContent = `You found it! Sol ${sample.sol} was higher. Difference (calculated): ${Math.abs(a.pressure - b.pressure).toFixed(3)} mbar.`;
            else
              feedback.textContent =
                "Look at the two measured values. The larger number means higher pressure. Try again.";
          }),
        );
    }
    selectorsList.forEach((menu) => menu.addEventListener("change", refresh));
    refresh();
    comparison.append(selectors, feedback, answers);
    root.append(comparison);
    select(0);
    quizLink(root);
  }

  function renderPhoto(root) {
    root.append(el("h3", "", "Find three clues in the first photograph"));
    const frame = el("div", "first-photo-discovery");
    const picture = image(
      "assets/archive/viking-first.jpg",
      "NASA PIA00381: rocks, fine surface material and Viking 1 footpad on the right",
    );
    frame.append(picture);
    const feedback = el(
      "p",
      "activity-feedback",
      "Choose a clue. The original photo stays unchanged underneath the markers.",
    );
    feedback.setAttribute("role", "status");
    const clues = [
      {
        name: "Footpad",
        x: 87,
        y: 72,
        copy: "Part of Viking 1’s landing footpad is visible at the right. The explorer appears in its own picture!",
      },
      {
        name: "Rock",
        x: 43,
        y: 23,
        copy: "Look at this rock’s uneven surface. A photograph records shape and texture; it does not by itself tell us everything the rock is made of.",
      },
      {
        name: "Fine material",
        x: 31,
        y: 73,
        copy: "Fine-grained material lies between the rocks. NASA describes sand or dust; this picture alone does not identify every grain.",
      },
    ];
    const list = el("div", "activity-controls");
    const markers = [];
    function choose(index) {
      markers.forEach((marker, i) =>
        marker.setAttribute("aria-pressed", String(i === index)),
      );
      feedback.textContent = clues[index].copy;
    }
    clues.forEach((clue, index) => {
      const marker = button(
        String(index + 1),
        () => choose(index),
        "photo-clue",
      );
      marker.style.left = clue.x + "%";
      marker.style.top = clue.y + "%";
      marker.setAttribute(
        "aria-label",
        `Explore ${clue.name.toLowerCase()} clue`,
      );
      marker.setAttribute("aria-pressed", "false");
      markers.push(marker);
      frame.append(marker);
      list.append(button(`${index + 1} · ${clue.name}`, () => choose(index)));
    });
    let revealTask;
    const replay = button("Replay the picture arriving", () => {
      if (revealTask) {
        revealTask.dispose();
        activities = activities.filter((task) => task !== revealTask);
      }
      if (reduced.matches) return;
      const animation = picture.animate(
        [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }],
        { duration: 3500, fill: "forwards" },
      );
      const task = {
        sync() {
          if (panelBlocked() || reduced.matches) animation.pause();
          else if (animation.playState !== "finished") animation.play();
        },
        dispose() {
          animation.cancel();
        },
      };
      revealTask = task;
      activities.push(task);
      task.sync();
    });
    root.append(
      frame,
      el(
        "p",
        "activity-note",
        "PIA00381 · NASA/JPL · Viking 1, 20 July 1976. Picture-arrival animation is illustrative, not original transmission timing.",
      ),
      list,
      feedback,
      replay,
    );
    quizLink(root);
  }

  function renderDuration(root) {
    root.append(el("h3", "", "A small plan. A much longer adventure."));
    const chart = durationChart(archive.sojournerDuration);
    const feedback = el("p", "activity-feedback", "Which duration is longer?");
    feedback.setAttribute("role", "status");
    const choices = el("div", "activity-controls");
    choices.append(
      button(
        "7 planned days",
        () =>
          (feedback.textContent =
            "Look at the two bars. Try the larger number."),
      ),
      button(
        "83 reported days",
        () =>
          (feedback.textContent =
            "You found it! NASA reports 83 days of rover operation, beyond the seven-day plan."),
      ),
    );
    root.append(
      chart,
      choices,
      feedback,
      el(
        "p",
        "activity-note",
        "NASA mission-summary values in days. Bar growth is illustrative, not live telemetry, sols or a day-by-day record.",
      ),
    );
    quizLink(root);
  }

  function closePanel() {
    activities.forEach((task) => task.dispose());
    activities = [];
  }
  function renderPanel(id, host) {
    closePanel();
    if (
      ![
        "mission",
        "viking-mission",
        "sojourner-mission",
        "sojourner-duration",
        "science",
        "reflector",
        "viking-weather",
        "viking-photos",
      ].includes(id)
    )
      return;
    const root = el("section", "screen-activity");
    root.dataset.activity = id;
    if (["mission", "viking-mission", "sojourner-mission"].includes(id))
      renderJourney(root, id === "mission" ? "apollo" : id.split("-")[0]);
    else if (id === "sojourner-duration") renderDuration(root);
    else if (id === "science" || id === "reflector") renderLight(root, id);
    else if (id === "viking-weather") renderWeather(root);
    else renderPhoto(root);
    host.append(root);
  }
  function sync() {
    document.body.classList.toggle(
      "screen-motion-blocked",
      compactBlocked() || reduced.matches,
    );
    previews.forEach((task) => task.sync());
    activities.forEach((task) => task.sync());
  }
  reduced.addEventListener("change", sync);
  return { setMission, renderPanel, closePanel, sync };
}
