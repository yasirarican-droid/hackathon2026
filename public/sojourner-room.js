export const sojournerItems = [
  "mission",
  "rover",
  "duration",
  "photos",
  "barnacle",
  "yogi",
  "landing",
  "timeline",
  "message",
  "legacy",
  "cassette",
  "solar",
  "relay",
].map((id) => "sojourner-" + id);

export function durationChart(data, compact = false) {
  const root = document.createElement("div");
  root.className = "duration-chart" + (compact ? " duration-compact" : "");
  root.setAttribute("role", "img");
  root.setAttribute(
    "aria-label",
    `Planned rover mission: ${data.planned} days; NASA-reported operation: ${data.reported} days. Mission summary, not telemetry.`,
  );
  for (const [label, value] of [
    ["Planned rover mission", data.planned],
    ["Reported operation", data.reported],
  ]) {
    const row = document.createElement("div");
    row.className = "duration-row";
    const text = document.createElement("span");
    text.className = "duration-label";
    text.textContent = label;
    const track = document.createElement("span");
    track.className = "duration-track";
    const fill = document.createElement("span");
    fill.className = "duration-fill";
    fill.style.setProperty("--bar-width", `${(value / data.reported) * 100}%`);
    const number = document.createElement("b");
    number.textContent = String(value);
    track.append(fill, number);
    row.append(text, track);
    root.append(row);
  }
  const note = document.createElement("small");
  note.textContent = "DAYS · NASA MISSION SUMMARY";
  root.append(note);
  return root;
}

export function createSojournerRoom({ asset }) {
  const get = (selector) => document.querySelector(selector);
  const stage = get("#room-stage");
  const preview = document.createElement("span");
  preview.id = "sojourner-preview";
  preview.className = "sojourner-model-preview";
  preview.hidden = true;
  const image = document.createElement("img");
  image.src = asset("assets/archive/sojourner.jpg");
  image.alt =
    "Original NASA/JPL photograph of Sojourner near Barnacle Bill; fallback when the educational model is unavailable.";
  preview.append(image);
  get(".crt-center").insertBefore(preview, get("#eagle-preview-hint"));
  const cassette = document.createElement("button");
  cassette.className = "desk-object sojourner-cassette";
  cassette.type = "button";
  cassette.dataset.open = "sojourner-cassette";
  cassette.setAttribute(
    "aria-label",
    "Listen to four NASA audio chapters and read their transcripts",
  );
  const tape = document.createElement("img");
  tape.src = asset("assets/art/sojourner-cassette-v2.webp");
  tape.alt = "Decorative 1990s audio cassette";
  cassette.append(tape);
  get(".desk-plane").append(cassette);
  const leds = document.createElement("div");
  leds.className = "sojourner-annunciators";
  leds.setAttribute("aria-hidden", "true");
  const keys = [
    [214, 211, 14, 8, "#72d8d2"],
    [241.5, 211, 14, 8, "#72d8d2"],
    [268, 211, 14, 8, "#72d8d2"],
    [296.5, 211, 14, 8, "#72d8d2"],
    [644, 213, 15, 8, "#72d8d2"],
    [674.5, 213, 15, 8, "#72d8d2"],
    [704.5, 213, 15, 8, "#72d8d2"],
    [735, 213, 15, 8, "#72d8d2"],
    [1156, 212, 13, 8, "#72d8d2"],
    [1182.5, 212, 13, 8, "#72d8d2"],
    [1208, 212, 13, 8, "#72d8d2"],
    [1234.5, 212, 13, 8, "#f7d46a"],
  ];
  for (const [i, [x, y, width, height, color]] of keys.entries()) {
    const light = document.createElement("i");
    light.style.left = `${(x / 1672) * 100}%`;
    light.style.top = `${(y / 941) * 100}%`;
    light.style.width = `${(width / 1672) * 100}%`;
    light.style.height = `${(height / 941) * 100}%`;
    light.style.setProperty("--lamp-color", color);
    light.style.animationDelay = `${-(i * 0.61)}s`;
    leds.append(light);
  }
  stage.append(leds);
  function apply(data) {
    preview.hidden = false;
    stage.style.setProperty(
      "--room-art",
      `url("${asset("assets/art/sojourner-room-v1.webp")}")`,
    );
    stage.style.setProperty(
      "--sojourner-lamp",
      `url("${asset("assets/art/sojourner-lava-lamp-v2.webp")}")`,
    );
    stage.style.setProperty(
      "--sojourner-phone",
      `url("${asset("assets/art/sojourner-desk-phone-v3.webp")}")`,
    );
    get("#room-page").setAttribute(
      "aria-label",
      "Sojourner illustrated 1997 Mars archive",
    );
    get(".room-backdrop").setAttribute(
      "aria-label",
      "Fictional hand-drawn 1997 archive: three ivory CRT screens, amber room and wooden desk",
    );
    get(".room-toolbar h1").textContent = "SOJOURNER / MARS ARCHIVE";
    const mapping = {
      mission: "mission",
      eagle: "rover",
      science: "duration",
      photos: "photos",
      seismometer: "barnacle",
      footprint: "yogi",
      samples: "landing",
      timeline: "timeline",
      "apollo-story": "message",
      legacy: "legacy",
      radio: "relay",
    };
    stage.querySelectorAll("[data-open]").forEach((item) => {
      if (mapping[item.dataset.open]) {
        item.dataset.open = "sojourner-" + mapping[item.dataset.open];
        item.setAttribute(
          "aria-label",
          "Explore Sojourner " + item.dataset.open.replace("sojourner-", ""),
        );
      }
    });
    for (const id of ["briefing-replay", "arrival-replay", "crt-intro-restart"])
      get("#" + id).hidden = id === "arrival-replay";
    get(".crt-center .crt-heading").innerHTML =
      'SOJOURNER<small class="mission-date">04 JUL 1997</small>';
    get("#eagle-preview-hint").textContent =
      preview.dataset.modelReady === "true"
        ? "EDUCATIONAL 3D MODEL · TAP TO EXPLORE ↗"
        : "NASA PHOTOGRAPH · TAP TO EXPLORE ↗";
    get(".crt-right .crt-heading").textContent = "BEYOND THE PLAN";
    get(".folder .prop-label").textContent = "LANDING FILE";
    get(".telephone .desk-tip").textContent = "A little rover calls home";
    get(".telephone").setAttribute(
      "aria-label",
      "Read the Sojourner telephone story",
    );
    get(".event-paper").replaceChildren();
    const title = document.createElement("span");
    title.textContent = "7 PLANNED / 83 REPORTED";
    get(".event-paper").append(title, durationChart(data, true));
    get(".event-paper").dataset.open = "sojourner-duration";
    for (const [selector, file, caption, alt] of [
      [
        ".print-eagle",
        "sojourner-airbags.jpg",
        "FIRST STEPS · PIA00611",
        "Pathfinder lander image: Sojourner still on lander, white deflated airbags nearby",
      ],
      [
        ".print-instruments",
        "sojourner.jpg",
        "ROCK DETECTIVE · PIA00638",
        "NASA lander camera view of Sojourner near Barnacle Bill",
      ],
      [
        ".print-footprint",
        "sojourner-yogi.jpg",
        "ROVER CAMERA · PIA00672",
        "Sojourner rear camera close-up of rock Yogi",
      ],
    ]) {
      get(selector + " img").src = asset("assets/archive/" + file);
      get(selector + " img").alt = alt;
      get(selector + " span").textContent = caption;
    }
  }
  return { apply, preview };
}
