import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export async function createEagleExplorer({
  modelURL,
  decoderJS,
  decoderWasm,
  preview,
  mission = "apollo",
  additionalModels = [],
  modelLabels = [],
  authored = false,
}) {
  const decoder = new DRACOLoader()
    .setDecoderPath({ js: decoderJS, wasm: decoderWasm })
    .setWorkerLimit(2);
  const loader = new GLTFLoader().setDRACOLoader(decoder);
  const loaded = await Promise.all(
    [modelURL, ...additionalModels].map((url) => loader.loadAsync(url)),
  );
  decoder.dispose();
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(480, 320, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = mission === "viking" ? 0.82 : 0.95;
  renderer.domElement.className = "eagle-canvas";
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute(
    "aria-label",
    authored
      ? modelLabels[0]
      : mission === "viking"
        ? "NASA Viking Lander 3D model"
        : "NASA Apollo Lunar Module 3D model",
  );
  renderer.domElement.tabIndex = -1;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  scene.environment = pmrem.fromScene(environment, 0.04).texture;
  scene.environmentIntensity = 0.65;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xeaf5ff, 0x67503a, 1.2));
  const key = new THREE.DirectionalLight(0xfff0d8, 2);
  key.position.set(5, 9, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbddcff, 0.8);
  fill.position.set(-5, 3, -4);
  scene.add(fill);
  const records = loaded.map((gltf, index) => {
    const mesh = gltf.scene;
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    mesh.position.sub(box.getCenter(new THREE.Vector3()));
    const size = box.getSize(new THREE.Vector3());
    scene.add(mesh);
    mesh.visible = index === 0;
    return { model: mesh, size, radius: size.length() / 2 };
  });
  let { model, size, radius } = records[0];
  const originals = new Map();
  records.forEach((record) =>
    record.model.traverse((object) => {
      if (!object.isMesh) return;
      object.material = object.material.clone();
      const material = object.material;
      originals.set(material, {
        color: material.color.clone(),
        metalness: material.metalness,
        roughness: material.roughness,
        opacity: material.opacity,
        transparent: material.transparent,
      });
    }),
  );
  function colors(original = false) {
    for (const [material, saved] of originals) {
      material.color.copy(saved.color);
      material.metalness = saved.metalness;
      material.roughness = saved.roughness;
      material.opacity = saved.opacity;
      material.transparent = saved.transparent;
      if (!original && mission === "viking") {
        const palette = {
          blinn4SG: ["#8caaa4", 0.25, 0.65],
          blinn6SG: ["#242c30", 0.45, 0.48],
          blinn2SG: ["#aa792f", 0.65, 0.42],
          blinn8SG: ["#a2abb0", 0.72, 0.38],
          blinn11SG: ["#d8c797", 0.2, 0.68],
          initialShadingGr: ["#89949d", 0.62, 0.42],
          blinn9SG: ["#30383a", 0.32, 0.54],
          blinn10SG: ["#b28332", 0.6, 0.48],
          blinn12SG: ["#aa4f2e", 0.3, 0.62],
        };
        const appearance = palette[material.name];
        if (appearance) {
          material.color.set(appearance[0]);
          material.metalness = appearance[1];
          material.roughness = appearance[2];
        }
        material.opacity = 1;
        material.transparent = false;
      } else if (!original && !authored && !material.map) {
        if (/^blinn1SG|^blinn9SG/.test(material.name)) {
          material.color.set("#ae7a2f");
          material.metalness = 0.55;
          material.roughness = 0.48;
        } else if (
          /^blinn4SG|^blinn3SG|^initialShading|^blinn7SG/.test(material.name)
        ) {
          material.color.set("#8c9298");
          material.metalness = 0.65;
          material.roughness = 0.48;
        } else if (/^blinn2SG|^blinn6SG/.test(material.name)) {
          material.roughness = 0.78;
          material.metalness = 0.08;
        }
      }
      material.needsUpdate = true;
    }
    render();
  }
  const camera = new THREE.PerspectiveCamera(
    34,
    1.5,
    radius / 100,
    radius * 30,
  );
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minDistance = radius * 1.05;
  controls.maxDistance = radius * 6;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI - 0.1;
  controls.target.set(0, -size.y * 0.02, 0);
  let host = preview;
  let interactive = false;
  let frame;
  let lastTime;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  let currentModelIndex = 0;
  let partHandler = null;
  let partBox = null;
  let pointerStart = null;
  function clearPart() {
    if (partBox) {
      scene.remove(partBox);
      partBox.geometry.dispose();
      partBox.material.dispose();
      partBox = null;
    }
    delete renderer.domElement.dataset.selectedPart;
  }
  function partId(object) {
    if (!authored) return null;
    for (let item = object; item && item !== scene; item = item.parent) {
      const name = item.name.toLowerCase().replace(/[_ -]/g, "");
      if (currentModelIndex === 0) {
        if (name.includes("wheel")) return "wheels";
        if (name.includes("solararray") || name.includes("solarcell"))
          return "solar";
        if (name.includes("apxs")) return "apxs";
      } else {
        if (name.includes("petal") || name.includes("solar")) return "power";
        if (name.includes("camera") || name.includes("mast")) return "camera";
        if (name.includes("antenna") || name.includes("gain")) return "relay";
      }
    }
    return null;
  }
  function focusPart(id) {
    clearPart();
    if (!authored) {
      const fraction = ["upper", "radio"].includes(id) ? 0.18 : -0.24;
      controls.target.set(0, size.y * fraction, 0);
      controls.update();
      render();
      return;
    }
    const candidates = [];
    model.traverse((object) => {
      if (object.isMesh && partId(object) === id) candidates.push(object);
    });
    const object =
      candidates.find((object) =>
        object.name
          .toLowerCase()
          .includes(
            id === "wheels"
              ? "hub"
              : id === "apxs"
                ? "head"
                : id === "solar"
                  ? "substrate"
                  : id === "camera"
                    ? "camera"
                    : id === "relay"
                      ? "antenna"
                      : "petal",
          ),
      ) || candidates[0];
    if (!object) return;
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    partBox = new THREE.BoxHelper(object, 0xffd36b);
    scene.add(partBox);
    const direction = center.clone();
    direction.y = Math.max(size.y * 0.32, direction.y);
    if (direction.length() < 0.001) direction.set(1, 0.7, -1);
    controls.target.copy(center);
    camera.position
      .copy(center)
      .add(direction.normalize().multiplyScalar(radius * 2));
    renderer.domElement.dataset.selectedPart = id;
    controls.update();
    render();
  }
  renderer.domElement.addEventListener("pointerdown", (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  renderer.domElement.addEventListener("pointercancel", () => {
    pointerStart = null;
  });
  renderer.domElement.addEventListener("pointerup", (event) => {
    if (!interactive || !authored || !partHandler || !pointerStart) return;
    const moved = Math.hypot(
      event.clientX - pointerStart.x,
      event.clientY - pointerStart.y,
    );
    pointerStart = null;
    if (moved > 7) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = ray
      .intersectObject(model, true)
      .find((hit) => hit.object.isMesh);
    const id = hit && partId(hit.object);
    if (id) {
      renderer.domElement.dataset.partPicks = String(
        Number(renderer.domElement.dataset.partPicks || 0) + 1,
      );
      partHandler(id);
    }
  });
  function render() {
    if (partBox) partBox.update();
    renderer.render(scene, camera);
  }
  function fit() {
    const bounds = host.getBoundingClientRect();
    if (bounds.width < 2 || bounds.height < 2) return;
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    render();
  }
  function reset() {
    const distance =
      radius *
      (mission === "viking"
        ? interactive
          ? 1.9
          : 1.65
        : interactive
          ? 2.1
          : 2.4);
    if (authored) {
      const fitDistance =
        (radius * 0.98) /
        Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) /
        Math.min(1, camera.aspect);
      camera.position.set(1, 0.6, -1.4).normalize().multiplyScalar(fitDistance);
    } else camera.position.set(distance * 0.7, distance * 0.4, distance * 0.9);
    controls.target.set(0, -size.y * 0.02, 0);
    controls.update();
    render();
  }
  function canRotate() {
    return (
      !interactive &&
      !document.hidden &&
      !reduce.matches &&
      !document.body.matches(
        ".motion-paused,.exhibit-open,.orientation-blocked,.crt-intro-active",
      ) &&
      host.getBoundingClientRect().width > 0 &&
      !document.querySelector("#room-page").hidden &&
      location.hash === "#" + mission
    );
  }
  function tick(time) {
    if (!canRotate()) {
      frame = null;
      return;
    }
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    model.rotation.y += delta * 0.1;
    render();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    lastTime = null;
    fit();
    if (canRotate()) frame = requestAnimationFrame(tick);
  }
  function mount(target, allowControls = false) {
    host = target;
    interactive = allowControls;
    controls.enabled = interactive;
    host.append(renderer.domElement);
    model.rotation.y = 0;
    reset();
    fit();
    sync();
  }
  controls.addEventListener("change", render);
  const observer = new ResizeObserver(fit);
  observer.observe(preview);
  window.addEventListener("resize", fit);
  reduce.addEventListener("change", sync);
  function rotate(horizontal, vertical = 0) {
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta += horizontal;
    spherical.phi = THREE.MathUtils.clamp(
      spherical.phi + vertical,
      0.1,
      Math.PI - 0.1,
    );
    camera.position
      .copy(controls.target)
      .add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
  }
  function zoom(factor) {
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(
      THREE.MathUtils.clamp(
        offset.length() * factor,
        controls.minDistance,
        controls.maxDistance,
      ),
    );
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }
  renderer.domElement.addEventListener("keydown", (event) => {
    if (!interactive) return;
    const keys = {
      ArrowLeft: () => rotate(-0.2),
      ArrowRight: () => rotate(0.2),
      ArrowUp: () => rotate(0, -0.15),
      ArrowDown: () => rotate(0, 0.15),
      "+": () => zoom(0.85),
      "-": () => zoom(1.15),
      Home: reset,
    };
    if (keys[event.key]) {
      event.preventDefault();
      keys[event.key]();
    }
  });
  function selectModel(index) {
    if (!records[index]) return;
    clearPart();
    currentModelIndex = index;
    records.forEach((record, i) => {
      record.model.visible = i === index;
    });
    ({ model, size, radius } = records[index]);
    camera.near = radius / 100;
    camera.far = radius * 30;
    camera.updateProjectionMatrix();
    controls.minDistance = radius * 1.05;
    controls.maxDistance = radius * 8;
    renderer.domElement.dataset.modelIndex = String(index);
    if (modelLabels[index])
      renderer.domElement.setAttribute("aria-label", modelLabels[index]);
    reset();
    fit();
    sync();
  }
  reset();
  colors(false);
  mount(preview);
  preview.dataset.modelReady = "true";
  return {
    mount: (target) => {
      mount(target, true);
      renderer.domElement.tabIndex = 0;
    },
    preview: () => {
      partHandler = null;
      clearPart();
      mount(preview, false);
      renderer.domElement.tabIndex = -1;
    },
    reset,
    zoom,
    rotate,
    colors,
    wireframe(value) {
      records.forEach((record) =>
        record.model.traverse((object) => {
          if (object.isMesh) object.material.wireframe = value;
        }),
      );
      render();
    },
    selectModel,
    focusPart,
    onPartSelect(handler) {
      partHandler = handler;
    },
    sync,
  };
}
