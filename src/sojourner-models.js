import * as THREE from "three";

const metal = (color, metalness = 0.5, roughness = 0.5) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
const palette = {
  silver: metal("#c3c5c0", 0.75, 0.36),
  dark: metal("#313735", 0.35, 0.64),
  gold: metal("#be9449", 0.55, 0.64),
  foil: metal("#d5ad5d", 0.62, 0.5),
  blue: metal("#172839", 0.45, 0.37),
  cell: metal("#263d51", 0.4, 0.4),
  glass: metal("#183d48", 0.65, 0.2),
  cream: metal("#dfdbca", 0.18, 0.7),
};
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
function box(parent, name, x, y, z, w, h, d, material) {
  const mesh = new THREE.Mesh(boxGeometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  parent.add(mesh);
  return mesh;
}
function cylinder(
  parent,
  name,
  x,
  y,
  z,
  radius,
  length,
  material,
  axis = "y",
  segments = 24,
) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, segments);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  if (axis === "x") mesh.rotation.z = Math.PI / 2;
  if (axis === "z") mesh.rotation.x = Math.PI / 2;
  parent.add(mesh);
  return mesh;
}
function beam(parent, name, a, b, width, material) {
  const start = new THREE.Vector3(...a),
    end = new THREE.Vector3(...b);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(width, width, start.distanceTo(end), 10),
    material,
  );
  mesh.name = name;
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    end.sub(start).normalize(),
  );
  parent.add(mesh);
  return mesh;
}
function cable(parent, name, points, radius = 0.003, material = palette.dark) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 18, radius, 6, false),
    material,
  );
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}
function bolts(parent, positions, radius = 0.004) {
  positions.forEach((p, i) =>
    cylinder(parent, "Fastener " + i, ...p, radius, 0.003, palette.silver),
  );
}

export function buildSojourner() {
  const root = new THREE.Group();
  root.name = "Sojourner - educational reconstruction";
  root.userData = {
    origin:
      "AI-assisted authored geometry based on NASA references; not a NASA-issued model",
    referenceDimensionsMeters: [0.65, 0.48, 0.3],
    antenna:
      "Whip length and small surface details approximate; quoted 30 cm height is not enforced as antenna tip height.",
  };
  box(
    root,
    "Warm electronics box",
    0,
    0.205,
    0,
    0.325,
    0.13,
    0.41,
    palette.foil,
  );
  box(
    root,
    "Lower insulated electronics housing",
    0,
    0.14,
    0,
    0.3,
    0.025,
    0.36,
    palette.gold,
  );
  box(
    root,
    "Solar array substrate",
    0,
    0.286,
    0,
    0.432,
    0.012,
    0.604,
    palette.silver,
  );
  box(root, "Dark solar array", 0, 0.293, 0, 0.422, 0.004, 0.59, palette.blue);
  for (let row = 0; row < 12; row++)
    for (let col = 0; col < 8; col++) {
      const cell = box(
        root,
        "Illustrative solar cell pattern",
        -0.183 + col * 0.0523,
        0.296,
        -0.268 + row * 0.0487,
        0.049,
        0.0015,
        0.045,
        col % 3 === 0 ? palette.cell : palette.blue,
      );
    }
  for (const x of [-0.207, 0.207])
    box(
      root,
      "Solar panel silver edge",
      x,
      0.296,
      0,
      0.006,
      0.004,
      0.592,
      palette.silver,
    );
  for (const z of [-0.295, 0.295])
    box(
      root,
      "Solar panel end edge",
      0,
      0.296,
      z,
      0.422,
      0.004,
      0.006,
      palette.silver,
    );
  const wheelZ = [-0.26, 0, 0.26];
  for (const side of [-1, 1]) {
    for (const [index, z] of wheelZ.entries()) {
      const group = new THREE.Group();
      group.name = `Wheel ${side < 0 ? "left" : "right"} ${index + 1}`;
      group.position.set(side * 0.1965, 0.065, z);
      root.add(group);
      cylinder(
        group,
        "Aluminum wheel tread",
        0,
        0,
        0,
        0.065,
        0.061,
        palette.dark,
        "x",
        32,
      );
      cylinder(
        group,
        "Outer aluminum wheel face",
        side * 0.032,
        0,
        0,
        0.058,
        0.003,
        palette.silver,
        "x",
        32,
      );
      cylinder(
        group,
        "Recessed wheel center",
        side * 0.034,
        0,
        0,
        0.027,
        0.004,
        palette.dark,
        "x",
        24,
      );
      cylinder(
        group,
        "Wheel hub",
        side * 0.037,
        0,
        0,
        0.016,
        0.008,
        palette.silver,
        "x",
        20,
      );
      for (let cleat = 0; cleat < 28; cleat++) {
        const angle = (cleat / 28) * Math.PI * 2;
        const tread = box(
          group,
          "Steel cleat",
          0,
          Math.cos(angle) * 0.064,
          Math.sin(angle) * 0.064,
          0.061,
          0.003,
          0.005,
          palette.silver,
        );
        tread.rotation.x = angle;
      }
      for (let bolt = 0; bolt < 3; bolt++) {
        const a = (bolt * Math.PI * 2) / 3;
        cylinder(
          group,
          "Hub fastener",
          side * 0.042,
          Math.cos(a) * 0.012,
          Math.sin(a) * 0.012,
          0.003,
          0.003,
          palette.dark,
          "x",
          8,
        );
      }
      cylinder(
        root,
        "Axle connection",
        side * 0.175,
        0.065,
        z,
        0.012,
        0.04,
        palette.silver,
        "x",
      );
    }
    const x = side * 0.17;
    beam(
      root,
      "Front rocker arm",
      [x, 0.065, -0.26],
      [x, 0.195, -0.06],
      0.011,
      palette.silver,
    );
    beam(
      root,
      "Main rocker arm",
      [x, 0.195, -0.06],
      [x, 0.12, 0.12],
      0.012,
      palette.silver,
    );
    beam(
      root,
      "Bogie link to middle wheel",
      [x, 0.12, 0.12],
      [x, 0.065, 0],
      0.009,
      palette.silver,
    );
    beam(
      root,
      "Bogie link to rear wheel",
      [x, 0.12, 0.12],
      [x, 0.065, 0.26],
      0.009,
      palette.silver,
    );
    cylinder(
      root,
      "Rocker pivot",
      x,
      0.195,
      -0.06,
      0.022,
      0.019,
      palette.dark,
      "x",
    );
    for (let i = 0; i < 7; i++) {
      const t = (i + 1) / 8;
      cylinder(
        root,
        "Rocker visual relief hole",
        x + side * 0.012,
        0.065 + (0.195 - 0.065) * t,
        -0.26 + 0.2 * t,
        0.0045,
        0.002,
        palette.dark,
        "x",
        12,
      );
    }
    cable(
      root,
      "Wheel control harness",
      [
        [x, 0.18, -0.18],
        [x + side * 0.012, 0.13, -0.02],
        [x, 0.105, 0.18],
      ],
      0.003,
      palette.gold,
    );
  }
  const front = -0.218;
  box(
    root,
    "Front camera and laser support",
    0,
    0.232,
    front,
    0.275,
    0.05,
    0.026,
    palette.silver,
  );
  for (const x of [-0.105, 0.105]) {
    cylinder(
      root,
      "Stereo camera housing",
      x,
      0.238,
      front - 0.022,
      0.019,
      0.029,
      palette.dark,
      "z",
    );
    cylinder(
      root,
      "Stereo camera lens",
      x,
      0.238,
      front - 0.038,
      0.011,
      0.003,
      palette.glass,
      "z",
    );
    cylinder(
      root,
      "Camera lens rim",
      x,
      0.238,
      front - 0.039,
      0.014,
      0.002,
      palette.silver,
      "z",
    );
    cylinder(
      root,
      "Camera optical aperture",
      x,
      0.238,
      front - 0.041,
      0.009,
      0.002,
      palette.glass,
      "z",
    );
  }
  for (const x of [-0.065, 0, 0.065])
    cylinder(
      root,
      "Front laser aperture",
      x,
      0.214,
      front - 0.016,
      0.004,
      0.008,
      palette.dark,
      "z",
      12,
    );
  box(
    root,
    "Rear instrument attachment",
    0,
    0.177,
    0.22,
    0.12,
    0.065,
    0.028,
    palette.dark,
  );
  cylinder(
    root,
    "APXS simplified instrument head",
    0,
    0.175,
    0.265,
    0.043,
    0.055,
    palette.silver,
    "z",
  );
  cylinder(
    root,
    "APXS contact face",
    0,
    0.175,
    0.296,
    0.035,
    0.007,
    palette.dark,
    "z",
  );
  box(
    root,
    "Rear color camera support",
    -0.085,
    0.238,
    0.218,
    0.045,
    0.032,
    0.022,
    palette.silver,
  );
  cylinder(
    root,
    "Rear camera lens",
    -0.085,
    0.238,
    0.235,
    0.01,
    0.012,
    palette.glass,
    "z",
  );
  beam(
    root,
    "Whip antenna mounting",
    [0.178, 0.25, 0.2],
    [0.178, 0.32, 0.2],
    0.006,
    palette.silver,
  );
  beam(
    root,
    "Whip antenna",
    [0.178, 0.32, 0.2],
    [0.17, 0.57, 0.19],
    0.0018,
    palette.silver,
  );
  box(
    root,
    "Material adherence experiment simplified",
    -0.17,
    0.301,
    0.245,
    0.052,
    0.008,
    0.025,
    palette.cream,
  );
  for (const z of [-0.18, 0.18])
    bolts(root, [
      [-0.15, 0.271, z],
      [0.15, 0.271, z],
    ]);
  cable(
    root,
    "Rear instrument harness",
    [
      [0.12, 0.22, 0.19],
      [0.14, 0.14, 0.24],
      [0.035, 0.16, 0.26],
    ],
    0.004,
    palette.dark,
  );
  return root;
}

function plate(parent, name, points, y, thickness, material) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], -points[0][1]);
  for (const [x, z] of points.slice(1)) shape.lineTo(x, -z);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.y = y;
  parent.add(mesh);
  return mesh;
}
export function buildPathfinder() {
  const root = new THREE.Group();
  root.name = "Mars Pathfinder - deployed educational reconstruction";
  root.userData = {
    origin:
      "AI-assisted authored geometry based on NASA references; not a NASA-issued model",
    state:
      "Open petals after rover deployment. Airbags, interior mechanisms and detached arrival hardware omitted.",
    referenceDeployedSpanMeters: 2.75,
    referenceCameraHeightMeters: 1.5,
  };
  const base = [
    [-0.42, 0.26],
    [0.42, 0.26],
    [0, -0.47],
  ];
  plate(root, "Triangular base platform", base, 0.08, 0.045, palette.silver);
  const petalShape = [
    [-0.48, 0],
    [0.48, 0],
    [0.11, 0.95],
    [-0.11, 0.95],
  ];
  for (let index = 0; index < 3; index++) {
    const petal = new THREE.Group();
    petal.name = "Solar petal " + (index + 1);
    petal.rotation.y = (index * Math.PI * 2) / 3;
    root.add(petal);
    plate(
      petal,
      "Hinged petal structure",
      petalShape,
      0.075,
      0.028,
      palette.silver,
    ).position.z = 0.255;
    const inset = [
      [-0.445, 0.035],
      [0.445, 0.035],
      [0.085, 0.91],
      [-0.085, 0.91],
    ];
    plate(
      petal,
      "Solar cell field",
      inset,
      0.105,
      0.005,
      palette.blue,
    ).position.z = 0.255;
    for (let row = 0; row < 13; row++) {
      const z = 0.31 + row * 0.067;
      const half = 0.44 - (z - 0.29) * (0.36 / 0.91);
      box(
        petal,
        "Solar panel row separator",
        0,
        0.112,
        z,
        half * 2,
        0.0015,
        0.003,
        palette.silver,
      );
    }
    for (const x of [-0.13, 0, 0.13])
      box(
        petal,
        "Solar panel bus line",
        x,
        0.113,
        x === 0 ? 0.74 : 0.65,
        0.002,
        0.001,
        x === 0 ? 0.84 : 0.66,
        palette.silver,
      );
    for (const x of [-0.31, 0.31])
      cylinder(
        petal,
        "Petal hinge",
        x,
        0.09,
        0.255,
        0.023,
        0.12,
        palette.gold,
        "x",
      );
    beam(
      petal,
      "Petal left frame",
      [-0.48, 0.099, 0.255],
      [-0.11, 0.099, 1.205],
      0.012,
      palette.silver,
    );
    beam(
      petal,
      "Petal right frame",
      [0.48, 0.099, 0.255],
      [0.11, 0.099, 1.205],
      0.012,
      palette.silver,
    );
    beam(
      petal,
      "Petal outer frame",
      [-0.11, 0.099, 1.205],
      [0.11, 0.099, 1.205],
      0.011,
      palette.silver,
    );
  }
  plate(
    root,
    "Central insulated electronics compartment",
    [
      [-0.31, 0.2],
      [0.31, 0.2],
      [0, -0.36],
    ],
    0.125,
    0.29,
    palette.foil,
  );
  plate(
    root,
    "Electronics lid",
    [
      [-0.27, 0.17],
      [0.27, 0.17],
      [0, -0.31],
    ],
    0.415,
    0.035,
    palette.cream,
  );
  for (let side = 0; side < 3; side++) {
    const a = base[side],
      b = base[(side + 1) % 3];
    beam(
      root,
      "Base structural rail",
      [...[a[0], 0.135, a[1]]],
      [b[0], 0.135, b[1]],
      0.012,
      palette.silver,
    );
  }
  const tower = new THREE.Group();
  tower.name = "IMP camera deployable mast";
  tower.position.set(0, 0.45, -0.04);
  root.add(tower);
  for (const x of [-0.052, 0.052])
    for (const z of [-0.052, 0.052])
      beam(
        tower,
        "Camera mast upright",
        [x, 0, z],
        [x, 0.9, z],
        0.008,
        palette.silver,
      );
  for (let level = 0; level < 6; level++) {
    const y = level * 0.15;
    for (const z of [-0.052, 0.052]) {
      beam(
        tower,
        "Camera mast diagonal",
        [-0.052, y, z],
        [0.052, y + 0.15, z],
        0.005,
        palette.silver,
      );
      beam(
        tower,
        "Camera mast cross brace",
        [0.052, y, z],
        [-0.052, y + 0.15, z],
        0.004,
        palette.dark,
      );
    }
  }
  box(
    root,
    "IMP stereo camera housing",
    0,
    1.4,
    -0.04,
    0.24,
    0.12,
    0.14,
    palette.cream,
  );
  for (const x of [-0.074, 0.074]) {
    cylinder(
      root,
      "IMP camera lens barrel",
      x,
      1.41,
      -0.13,
      0.032,
      0.07,
      palette.dark,
      "z",
    );
    cylinder(
      root,
      "IMP camera lens",
      x,
      1.41,
      -0.169,
      0.024,
      0.003,
      palette.glass,
      "z",
    );
  }
  box(
    root,
    "Camera sunshade",
    0,
    1.468,
    -0.08,
    0.28,
    0.012,
    0.23,
    palette.silver,
  );
  cylinder(
    root,
    "High-gain antenna support",
    -0.24,
    0.48,
    0.11,
    0.025,
    0.18,
    palette.silver,
  );
  const hga = new THREE.Group();
  hga.name = "High-gain antenna flat panel";
  hga.position.set(-0.24, 0.59, 0.11);
  hga.rotation.z = -0.25;
  root.add(hga);
  cylinder(
    hga,
    "High-gain antenna panel",
    0,
    0,
    0,
    0.18,
    0.025,
    palette.cream,
    "y",
    48,
  );
  cylinder(
    hga,
    "High-gain antenna center",
    0,
    0.015,
    0,
    0.03,
    0.008,
    palette.silver,
  );
  beam(
    root,
    "Low-gain antenna",
    [0.14, 0.45, 0.08],
    [0.14, 1.02, 0.08],
    0.006,
    palette.silver,
  );
  cylinder(
    root,
    "Low-gain antenna base",
    0.14,
    0.47,
    0.08,
    0.03,
    0.06,
    palette.gold,
  );
  const met = [0.08, 0.1, 0.58];
  beam(
    root,
    "Meteorology mast",
    [met[0], 0.11, met[2]],
    [met[0], 1.45, met[2]],
    0.007,
    palette.silver,
  );
  for (const height of [0.57, 0.93, 1.32]) {
    beam(
      root,
      "Wind sock support",
      [met[0], height, met[2]],
      [met[0] + 0.08, height, met[2]],
      0.003,
      palette.silver,
    );
    const sock = new THREE.Mesh(
      new THREE.ConeGeometry(0.016, 0.065, 12),
      palette.gold,
    );
    sock.name = "Simplified wind sock";
    sock.rotation.z = -Math.PI / 2;
    sock.position.set(met[0] + 0.105, height, met[2]);
    root.add(sock);
  }
  cable(
    root,
    "Lander wiring harness",
    [
      [0.2, 0.18, 0.1],
      [0.31, 0.13, 0.23],
      [0.25, 0.14, 0.45],
    ],
    0.009,
    palette.dark,
  );
  for (const x of [-0.22, 0.22]) {
    box(
      root,
      "Rover deployment ramp rail",
      x,
      0.06,
      0.98,
      0.035,
      0.028,
      0.48,
      palette.silver,
    );
    for (let i = 0; i < 8; i++)
      box(
        root,
        "Ramp traction strip",
        x,
        0.078,
        0.8 + i * 0.05,
        0.035,
        0.006,
        0.009,
        palette.dark,
      );
  }
  const bounds = new THREE.Box3().setFromObject(root);
  const span = Math.max(
    bounds.max.x - bounds.min.x,
    bounds.max.z - bounds.min.z,
  );
  const factor = 2.75 / span;
  root.scale.set(factor, 1, factor);
  return root;
}
