import { createSojournerRoom } from "./sojourner-room.js?v=20261114-learning1";
export const vikingItems = [
  "viking-mission",
  "viking-lander",
  "viking-weather",
  "viking-photos",
  "viking-color",
  "viking-panorama",
  "viking-soil",
  "viking-timeline",
  "viking-message",
  "viking-legacy",
];

export function pressureChart(data) {
  const ns = "http://www.w3.org/2000/svg";
  const make = (tag, attributes = {}, text) => {
    const el = document.createElementNS(ns, tag);
    for (const [name, value] of Object.entries(attributes))
      el.setAttribute(name, value);
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const svg = make("svg", {
    viewBox: "0 0 420 190",
    class: "pressure-chart",
    role: "img",
    "aria-label":
      "Viking 1 archived daily mean pressure, sols 1 to 30; 7.629 to 7.286 millibars.",
  });
  const x = (sol) => 48 + ((sol - 1) / 29) * 356;
  const y = (pressure) => 155 - ((pressure - 7.2) / 0.5) * 125;
  svg.append(make("text", { x: 48, y: 15 }, "Daily mean pressure (mbar)"));
  for (const tick of [7.3, 7.5, 7.7]) {
    svg.append(
      make("line", {
        x1: 48,
        x2: 404,
        y1: y(tick),
        y2: y(tick),
        class: "chart-grid",
      }),
      make(
        "text",
        { x: 39, y: y(tick) + 3, "text-anchor": "end" },
        tick.toFixed(1),
      ),
    );
  }
  svg.append(make("path", { d: "M48 28V155H404", class: "chart-axis" }));
  svg.append(
    make("polyline", {
      points: data.samples
        .map(
          (point) =>
            `${x(point.sol).toFixed(2)},${y(point.pressure).toFixed(2)}`,
        )
        .join(" "),
      class: "chart-trace",
    }),
  );
  for (const tick of [1, 15, 30])
    svg.append(
      make(
        "text",
        { x: x(tick), y: 170, "text-anchor": "middle" },
        String(tick),
      ),
    );
  svg.append(
    make(
      "text",
      { x: 226, y: 186, "text-anchor": "middle" },
      "Sol since landing",
    ),
  );
  return svg;
}

export function createMissionRoom({ asset, pressure, duration }) {
  const get = (selector) => document.querySelector(selector);
  const stage = get("#room-stage");
  const textSelectors = [
    ".room-toolbar h1",
    ".crt-left .terminal-lines",
    ".crt-center .crt-heading",
    "#eagle-preview-hint",
    ".crt-right .crt-heading",
    ".crt-right .crt-hint",
    ".console-plaque",
    ".folder .prop-label",
    ".event-paper",
    ".telephone .desk-tip",
  ];
  const originals = textSelectors.map((selector) => ({
    el: get(selector),
    html: get(selector).innerHTML,
  }));
  const openers = [...stage.querySelectorAll("[data-open]")].map((el) => ({
    el,
    key: el.dataset.open,
    label: el.getAttribute("aria-label"),
  }));
  const prints = [...stage.querySelectorAll(".desk-print")].map((el) => ({
    el,
    src: el.querySelector("img").src,
    alt: el.querySelector("img").alt,
    caption: el.querySelector("span").textContent,
  }));
  const modelPreview = document.createElement("span");
  modelPreview.id = "viking-preview";
  modelPreview.className = "viking-model-preview";
  modelPreview.hidden = true;
  const image = document.createElement("img");
  image.src = asset("assets/archive/viking-lander.png");
  image.alt = "NASA Viking lander model rendering, not a Mars photograph";
  modelPreview.append(image);
  get(".crt-center").insertBefore(modelPreview, get("#eagle-preview-hint"));
  const chart = pressureChart(pressure);
  chart.setAttribute("hidden", "");
  get(".crt-right").insertBefore(chart, get(".crt-right .crt-hint"));
  const sojournerRoom = createSojournerRoom({ asset });
  let current = "apollo";

  function apply(mission) {
    if (mission === current) return;
    current = mission;
    const viking = mission === "viking";
    stage.dataset.mission = mission;
    get("#room-page").setAttribute(
      "aria-label",
      viking
        ? "Viking 1 illustrated Mars archive"
        : "Apollo 11 illustrated archive",
    );
    stage.style.setProperty(
      "--room-art",
      `url("${asset(viking ? "assets/art/viking-room-v1.webp" : "assets/art/apollo-room-v2.webp")}")`,
    );
    stage.style.setProperty(
      "--viking-lamp",
      `url("${asset("assets/art/viking-banker-lamp-v2.webp")}")`,
    );
    stage.style.setProperty(
      "--viking-phone",
      `url("${asset("assets/art/viking-telephone-v2.webp")}")`,
    );
    for (const item of originals) item.el.innerHTML = item.html;
    for (const item of openers) {
      item.el.dataset.open = item.key;
      if (item.label) item.el.setAttribute("aria-label", item.label);
    }
    for (const item of prints) {
      item.el.querySelector("img").src = item.src;
      item.el.querySelector("img").alt = item.alt;
      item.el.querySelector("span").textContent = item.caption;
    }
    for (const id of [
      "#briefing-replay",
      "#arrival-replay",
      "#crt-intro-restart",
    ])
      get(id).hidden = false;
    get("#eagle-preview").hidden = mission !== "apollo";
    sojournerRoom.preview.hidden = mission !== "sojourner";
    modelPreview.hidden = !viking;
    get(".science-lines").hidden = viking;
    chart.toggleAttribute("hidden", !viking);
    get(".room-backdrop").setAttribute(
      "aria-label",
      viking
        ? "Illustrated olive-green CRT console above a warm wooden archive desk"
        : "Illustrated ivory CRT console above a warm wooden archive desk",
    );
    if (mission === "sojourner") {
      sojournerRoom.apply(duration);
      return;
    }
    if (!viking) return;
    const mapping = {
      mission: "mission",
      eagle: "lander",
      science: "weather",
      photos: "photos",
      seismometer: "color",
      footprint: "panorama",
      samples: "soil",
      timeline: "timeline",
      "apollo-story": "message",
      legacy: "legacy",
    };
    for (const item of openers)
      if (mapping[item.key]) {
        item.el.dataset.open = "viking-" + mapping[item.key];
        item.el.setAttribute(
          "aria-label",
          "Explore Viking 1 " + mapping[item.key],
        );
      }
    get(".room-toolbar h1").textContent = "VIKING 1 / MARS ARCHIVE";
    get(".crt-left .terminal-lines").innerHTML =
      "ARCHIVE PLAYBACK / VIKING 1<br>20 AUG 1975 / LAUNCH<br>19 JUN 1976 / MARS ORBIT<br>20 JUL 1976 / SURFACE LANDING";
    get(".crt-center .crt-heading").innerHTML =
      "VIKING 1<small class=mission-date>20 JUL 1976</small>";
    get("#eagle-preview-hint").textContent =
      "NASA 3D MODEL · TAP TO EXPLORE ↗";
    get(".crt-right .crt-heading").textContent = "SCIENCE DATA";
    get(".crt-right .crt-hint").textContent = "MEASURED ARCHIVE · SOLS 1–30 ↗";
    get(".console-plaque text").textContent = "MISSION ARCHIVE — 1976";
    get(".console-plaque svg").setAttribute(
      "aria-label",
      "Mission Archive — 1976",
    );
    get(".folder .prop-label").textContent = "MISSION FILE";
    get(".event-paper").replaceChildren();
    const label = document.createElement("span");
    label.textContent = "WEATHER RECORD";
    get(".event-paper").append(label, pressureChart(pressure));
    const photoSpecs = [
      [
        ".print-eagle",
        "viking-first.jpg",
        "Viking 1 first surface photograph",
        "FIRST VIEW · PIA00381",
      ],
      [
        ".print-instruments",
        "viking.jpg",
        "Viking 1 first color surface image",
        "MARS IN COLOR · PIA00563",
      ],
      [
        ".print-footprint",
        "viking-panorama.jpg",
        "Viking 1 surface panorama",
        "THE LANDING SITE · PIA00383",
      ],
    ];
    for (const [selector, file, alt, caption] of photoSpecs) {
      get(selector + " img").src = asset("assets/archive/" + file);
      get(selector + " img").alt = alt;
      get(selector + " span").textContent = caption;
    }
    get(".telephone .desk-tip").textContent = "Pictures that called home";
  }
  return { apply };
}
