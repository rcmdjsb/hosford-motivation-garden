/**
 * Hosford Motivation Garden — Three.js 0.187.0 3D Sanctuary Engine
 * Optimized for smooth 60fps performance on school Chromebooks.
 */

import * as THREE from 'three';
import { PALETTE, STATIONS, FOUNTAIN, SKY_INSPIRATIONS } from './stations.js';

const GARDEN_WALK_RADIUS = 28.2;
const EYE_HEIGHT = 1.75;
const WALK_SPEED = 7.0;
const MIN_PITCH = -0.62;
const MAX_PITCH = 1.28;

/**
 * Generates a soft circular radial-glow sprite texture for fireflies & sparkles.
 */
function createGlowTexture(innerHex = '#FFFFFF', midHex = '#7CC9E8') {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
  grad.addColorStop(0, innerHex);
  grad.addColorStop(0.32, midHex);
  grad.addColorStop(0.7, 'rgba(31, 122, 153, 0.25)');
  grad.addColorStop(1, 'rgba(6, 26, 34, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Shortest angular delta in radians [-PI, PI].
 */
function shortestAngleDelta(from, to) {
  let diff = (to - from + Math.PI) % (Math.PI * 2);
  if (diff < 0) diff += Math.PI * 2;
  return diff - Math.PI;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t) {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Compute camera yaw and pitch looking from `fromPos` to `targetPos`.
 */
function computeLookAngles(fromPos, targetPos) {
  const dx = targetPos.x - fromPos.x;
  const dy = targetPos.y - fromPos.y;
  const dz = targetPos.z - fromPos.z;
  const horiz = Math.hypot(dx, dz) || 0.0001;
  const yaw = Math.atan2(-dx, -dz);
  const pitch = THREE.MathUtils.clamp(Math.atan2(dy, horiz), MIN_PITCH, MAX_PITCH);
  return { yaw, pitch };
}

export function initGarden({
  canvas,
  initialState,
  onInteract,
  onProximityChange,
  onPointerLockChange,
  onMarkersUpdate,
  onSkyMarkersUpdate,
  onGuideMarkersUpdate,
}) {
  // --- Scene, Camera, Renderer ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.navyMidnight);
  scene.fog = new THREE.FogExp2(PALETTE.navyMidnight, 0.02);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    180
  );
  camera.rotation.order = 'YXZ';

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // --- Shared Materials (Hosford Husky Palette) ---
  const matStoneDark = new THREE.MeshStandardMaterial({
    color: PALETTE.slateTeal,
    roughness: 0.88,
    metalness: 0.08,
    flatShading: true,
  });
  const matStoneTrim = new THREE.MeshStandardMaterial({
    color: 0x133e4f,
    roughness: 0.72,
    metalness: 0.14,
    flatShading: true,
  });
  const matTealAccent = new THREE.MeshStandardMaterial({
    color: PALETTE.primaryTeal,
    roughness: 0.5,
    metalness: 0.22,
    flatShading: true,
  });
  const matWater = new THREE.MeshStandardMaterial({
    color: PALETTE.primaryTeal,
    emissive: 0x0e4c63,
    emissiveIntensity: 0.55,
    roughness: 0.18,
    metalness: 0.35,
    transparent: true,
    opacity: 0.88,
  });
  const matWhiteHighlight = new THREE.MeshStandardMaterial({
    color: PALETTE.whiteCrisp,
    emissive: PALETTE.cyanGlow,
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.1,
    flatShading: true,
  });
  const matWoodDark = new THREE.MeshStandardMaterial({
    color: 0x0c242e,
    roughness: 0.92,
    metalness: 0.05,
    flatShading: true,
  });
  const matFoliageDeep = new THREE.MeshStandardMaterial({
    color: 0x104559,
    roughness: 0.82,
    metalness: 0.04,
    flatShading: true,
  });
  const matFoliageMid = new THREE.MeshStandardMaterial({
    color: 0x19627d,
    roughness: 0.78,
    metalness: 0.05,
    flatShading: true,
  });

  // --- Twilight Lighting ---
  const hemiLight = new THREE.HemisphereLight(0x6ec3e3, 0x071d26, 0.95);
  scene.add(hemiLight);

  const moonLight = new THREE.DirectionalLight(0xcbeeff, 0.9);
  moonLight.position.set(18, 34, -28);
  scene.add(moonLight);

  const rimLight = new THREE.DirectionalLight(PALETTE.primaryTeal, 0.38);
  rimLight.position.set(-22, 12, 24);
  scene.add(rimLight);

  // --- Twilight Sky Dome, Stars & Crescent Moon ---
  function buildSky() {
    const skyGeo = new THREE.SphereGeometry(95, 24, 16);
    const posAttr = skyGeo.attributes.position;
    const colors = [];
    const topColor = new THREE.Color(0x041218);
    const midColor = new THREE.Color(PALETTE.navyMidnight);
    const horizonColor = new THREE.Color(0x0f394a);
    const tmp = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      const t = THREE.MathUtils.clamp((y + 12) / 90, 0, 1);
      if (t < 0.35) {
        tmp.copy(horizonColor).lerp(midColor, t / 0.35);
      } else {
        tmp.copy(midColor).lerp(topColor, (t - 0.35) / 0.65);
      }
      colors.push(tmp.r, tmp.g, tmp.b);
    }
    skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const skyMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false,
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Crisp twilight starfield
    const starCount = 260;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const cWhite = new THREE.Color(PALETTE.whiteCrisp);
    const cCyan = new THREE.Color(PALETTE.cyanGlow);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(0.18 + Math.random() * 0.82);
      const r = 84 + Math.random() * 6;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const mix = Math.random() > 0.35 ? cWhite : cCyan;
      const brightness = 0.65 + Math.random() * 0.35;
      starColors[i * 3] = mix.r * brightness;
      starColors[i * 3 + 1] = mix.g * brightness;
      starColors[i * 3 + 2] = mix.b * brightness;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.05,
      map: createGlowTexture('#FFFFFF', '#7CC9E8'),
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // Soft Glowing Moon in the North Sky
    const moonGroup = new THREE.Group();
    moonGroup.position.set(16, 36, -68);
    const moonDisc = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 24),
      new THREE.MeshBasicMaterial({ color: PALETTE.whiteCrisp, fog: false })
    );
    moonGroup.add(moonDisc);

    const moonHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createGlowTexture('#FFFFFF', '#7CC9E8'),
        color: PALETTE.cyanGlow,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        fog: false,
      })
    );
    moonHalo.scale.set(22, 22, 1);
    moonGroup.add(moonHalo);
    moonGroup.lookAt(0, 2, 0);
    scene.add(moonGroup);
  }
  buildSky();

  // --- Ground & Twilight Sanctuary Terrain ---
  function buildGroundAndPaths() {
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x071e27,
      roughness: 0.95,
      metalness: 0.04,
      flatShading: true,
    });

    // Strictly flat inner garden floor (y = 0 everywhere inside r <= 31)
    // so stepping paths, shrines, trees, and 3D animal guides sit cleanly above ground!
    const flatFloorGeo = new THREE.CircleGeometry(31, 48);
    flatFloorGeo.rotateX(-Math.PI / 2);
    scene.add(new THREE.Mesh(flatFloorGeo, groundMat));

    // Separate outer twilight ridge ring starting outside the walkable sanctuary
    const ridgeGeo = new THREE.RingGeometry(30.6, 64, 48, 6);
    ridgeGeo.rotateX(-Math.PI / 2);
    const pos = ridgeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.hypot(x, z);
      if (dist > 31.5) {
        const t = (dist - 31.5) / 32.5;
        const ridge = (Math.sin(x * 0.14) * Math.cos(z * 0.14) * 1.3 + t * 5.2) * t;
        pos.setY(i, Math.max(0, ridge));
      } else {
        pos.setY(i, 0);
      }
    }
    ridgeGeo.computeVertexNormals();
    scene.add(new THREE.Mesh(ridgeGeo, groundMat));

    // Central Octagonal Plaza
    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(6.3, 6.7, 0.2, 8),
      matStoneDark
    );
    plaza.position.y = 0.02;
    scene.add(plaza);

    const plazaRing = new THREE.Mesh(
      new THREE.RingGeometry(5.5, 5.85, 32),
      new THREE.MeshBasicMaterial({
        color: PALETTE.primaryTeal,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      })
    );
    plazaRing.rotation.x = -Math.PI / 2;
    plazaRing.position.y = 0.13;
    scene.add(plazaRing);

    // Instanced Stone Stepping Paths (radial to each shrine + outer ring + entrance walk)
    const stoneTransforms = [];
    const dummy = new THREE.Object3D();

    function addSteppingLine(ax, az, bx, bz, stepSpacing = 1.55, wobble = 0.24) {
      const dist = Math.hypot(bx - ax, bz - az);
      const steps = Math.max(2, Math.floor(dist / stepSpacing));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = THREE.MathUtils.lerp(ax, bx, t);
        const pz = THREE.MathUtils.lerp(az, bz, t);
        const perpX = -(bz - az) / (dist || 1);
        const perpZ = (bx - ax) / (dist || 1);
        const offset = (i % 2 === 0 ? 1 : -1) * wobble * (0.5 + (i % 3) * 0.2);
        const sx = 0.72 + ((i * 19) % 5) * 0.07;
        const sz = 0.58 + ((i * 13) % 5) * 0.06;
        stoneTransforms.push({
          x: px + perpX * offset,
          y: 0.04,
          z: pz + perpZ * offset,
          rotY: Math.atan2(bx - ax, bz - az) + ((i % 3) - 1) * 0.16,
          sx,
          sy: 0.11,
          sz,
        });
      }
    }

    // Spawn walkway from South to Central Plaza
    addSteppingLine(0, 12.2, 0, 6.4, 1.45, 0.18);

    // Four radial paths from Central Plaza to the 4 Shrines
    for (const station of STATIONS) {
      const dir = new THREE.Vector2(station.position.x, station.position.z).normalize();
      addSteppingLine(
        dir.x * 6.5,
        dir.y * 6.5,
        station.position.x - dir.x * 3.8,
        station.position.z - dir.y * 3.8,
        1.5,
        0.26
      );
    }

    // Outer circular stone path connecting the 4 quadrants
    const ringRadius = 18.6;
    const ringCount = 56;
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const rx = Math.cos(angle) * ringRadius;
      const rz = Math.sin(angle) * ringRadius;
      // Leave breathing room right on top of shrine daises
      let nearShrine = false;
      for (const s of STATIONS) {
        if (Math.hypot(rx - s.position.x, rz - s.position.z) < 4.6) {
          nearShrine = true;
          break;
        }
      }
      if (!nearShrine) {
        stoneTransforms.push({
          x: rx,
          y: 0.035,
          z: rz,
          rotY: -angle,
          sx: 0.78,
          sy: 0.1,
          sz: 0.62,
        });
      }
    }

    const stoneGeo = new THREE.CylinderGeometry(1, 1.08, 1, 7);
    const stoneMesh = new THREE.InstancedMesh(stoneGeo, matStoneDark, stoneTransforms.length);
    stoneTransforms.forEach((tr, idx) => {
      dummy.position.set(tr.x, tr.y, tr.z);
      dummy.rotation.set(0, tr.rotY, 0);
      dummy.scale.set(tr.sx, tr.sy, tr.sz);
      dummy.updateMatrix();
      stoneMesh.setMatrixAt(idx, dummy.matrix);
    });
    stoneMesh.instanceMatrix.needsUpdate = true;
    scene.add(stoneMesh);

    // Subtle glowing garden boundary stones & low path lanterns
    const markerGeo = new THREE.DodecahedronGeometry(0.45, 0);
    const markerCount = 32;
    const markerMesh = new THREE.InstancedMesh(markerGeo, matStoneTrim, markerCount);
    for (let i = 0; i < markerCount; i++) {
      const a = (i / markerCount) * Math.PI * 2;
      const r = 29.2 + (i % 2) * 0.7;
      dummy.position.set(Math.cos(a) * r, 0.25, Math.sin(a) * r);
      dummy.rotation.set(i * 0.4, a, i * 0.2);
      const sc = 0.8 + (i % 3) * 0.45;
      dummy.scale.set(sc * 1.3, sc * 0.8, sc);
      dummy.updateMatrix();
      markerMesh.setMatrixAt(i, dummy.matrix);
    }
    markerMesh.instanceMatrix.needsUpdate = true;
    scene.add(markerMesh);

    // Small glowing path-side garden orbs (soft ambiance)
    const orbGeo = new THREE.OctahedronGeometry(0.14, 0);
    const orbMat = new THREE.MeshBasicMaterial({ color: PALETTE.cyanGlow });
    const postGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.55, 6);
    const lanternSpots = [
      [-4.2, -4.2],
      [4.2, -4.2],
      [4.2, 4.2],
      [-4.2, 4.2],
      [-1.8, 8.6],
      [1.8, 8.6],
      [0, -18.5],
      [18.5, 0],
      [0, 18.5],
      [-18.5, 0],
    ];
    for (const [lx, lz] of lanternSpots) {
      const post = new THREE.Mesh(postGeo, matStoneDark);
      post.position.set(lx, 0.28, lz);
      scene.add(post);
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(lx, 0.64, lz);
      scene.add(orb);
    }
  }
  buildGroundAndPaths();

  // --- Perimeter Low-Poly Trees (InstancedMesh for 60fps on Chromebooks) ---
  function buildPerimeterForest() {
    const treePlacements = [];
    // Deterministic pseudo-random generator for consistent, balanced layout
    let seed = 4219;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Inner perimeter ring + outer dense woodland ring
    const totalTrees = 84;
    for (let i = 0; i < totalTrees; i++) {
      const layer = i < 34 ? 0 : 1;
      const angle =
        (i / (layer === 0 ? 34 : 50)) * Math.PI * 2 + (rand() - 0.5) * 0.16;
      const radius = layer === 0 ? 31.0 + rand() * 3.5 : 35.5 + rand() * 11.0;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = (layer === 0 ? 0.95 : 1.15) + rand() * 0.65;
      treePlacements.push({ x, z, scale, rotY: rand() * Math.PI * 2 });
    }

    // Accent ornamental trees nestled between shrine quadrants
    const accentAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    for (const baseA of accentAngles) {
      for (const offset of [-0.22, 0.22]) {
        const a = baseA + offset;
        const r = 24.5 + (offset > 0 ? 1.5 : 0);
        treePlacements.push({
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          scale: 0.85 + Math.abs(offset),
          rotY: a,
        });
      }
    }

    const count = treePlacements.length;
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 1.8, 6);
    const cone1Geo = new THREE.ConeGeometry(1.7, 3.0, 6);
    const cone2Geo = new THREE.ConeGeometry(1.3, 2.5, 6);
    const cone3Geo = new THREE.ConeGeometry(0.85, 2.0, 6);

    const trunks = new THREE.InstancedMesh(trunkGeo, matWoodDark, count);
    const cones1 = new THREE.InstancedMesh(cone1Geo, matFoliageDeep, count);
    const cones2 = new THREE.InstancedMesh(cone2Geo, matFoliageMid, count);
    const cones3 = new THREE.InstancedMesh(cone3Geo, matFoliageDeep, count);

    const dummy = new THREE.Object3D();
    treePlacements.forEach((t, i) => {
      const s = t.scale;
      dummy.rotation.set(0, t.rotY, 0);
      dummy.scale.set(s, s, s);

      dummy.position.set(t.x, 0.9 * s, t.z);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);

      dummy.position.set(t.x, 2.5 * s, t.z);
      dummy.updateMatrix();
      cones1.setMatrixAt(i, dummy.matrix);

      dummy.position.set(t.x, 4.1 * s, t.z);
      dummy.updateMatrix();
      cones2.setMatrixAt(i, dummy.matrix);

      dummy.position.set(t.x, 5.4 * s, t.z);
      dummy.updateMatrix();
      cones3.setMatrixAt(i, dummy.matrix);
    });

    [trunks, cones1, cones2, cones3].forEach((m) => {
      m.instanceMatrix.needsUpdate = true;
      scene.add(m);
    });
  }
  buildPerimeterForest();

  // --- Interactive Raycast Targets & Obstacle Circles ---
  const interactiveMeshes = [];
  const obstacles = [
    { x: FOUNTAIN.position.x, z: FOUNTAIN.position.z, r: FOUNTAIN.collisionRadius },
  ];

  // --- Central Fountain (Blueprint Sanctuary) ---
  const fountainState = {
    group: new THREE.Group(),
    crystal: null,
    ring: null,
    light: null,
    waterRipple: null,
    runeOrbs: {},
    droplets: null,
    dropletVelocities: [],
    completedCount: 0,
  };

  function buildCentralFountain() {
    const g = fountainState.group;
    g.position.set(FOUNTAIN.position.x, 0, FOUNTAIN.position.z);

    // Outer octagonal basin rim
    const baseRim = new THREE.Mesh(
      new THREE.CylinderGeometry(3.45, 3.75, 0.72, 8),
      matStoneDark
    );
    baseRim.position.y = 0.42;
    g.add(baseRim);

    const lipRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.38, 0.16, 6, 8),
      matStoneTrim
    );
    lipRing.rotation.x = Math.PI / 2;
    lipRing.rotation.z = Math.PI / 8;
    lipRing.position.y = 0.78;
    g.add(lipRing);

    // Shimmering Primary Teal Water surface
    const waterDisc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.08, 8), matWater);
    waterDisc.position.y = 0.68;
    g.add(waterDisc);

    // Animated expanding water ripple ring
    const rippleMat = new THREE.MeshBasicMaterial({
      color: PALETTE.cyanGlow,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const ripple = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 24), rippleMat);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.y = 0.74;
    g.add(ripple);
    fountainState.waterRipple = ripple;

    // Tiered center stone column & upper bowl
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 1.05, 1.55, 8),
      matStoneTrim
    );
    pillar.position.y = 1.2;
    g.add(pillar);

    const upperBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 0.72, 0.48, 8),
      matStoneDark
    );
    upperBowl.position.y = 1.92;
    g.add(upperBowl);

    const upperWater = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.06, 8), matWater);
    upperWater.position.y = 2.14;
    g.add(upperWater);

    // Crowning Sanctuary Crystal (brightens as shrines are lit)
    const crystalMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cyanGlow,
      emissive: PALETTE.primaryTeal,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.2,
      flatShading: true,
    });
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), crystalMat);
    crystal.scale.set(0.8, 1.45, 0.8);
    crystal.position.y = 3.2;
    g.add(crystal);
    fountainState.crystal = crystal;

    const haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.035, 8, 24),
      new THREE.MeshBasicMaterial({
        color: PALETTE.cyanGlow,
        transparent: true,
        opacity: 0.65,
      })
    );
    haloRing.position.y = 3.2;
    g.add(haloRing);
    fountainState.ring = haloRing;

    // 4 Compass Rune Orbs around fountain rim — each mirrors a shrine's completion!
    for (const station of STATIONS) {
      const dir = new THREE.Vector2(station.position.x, station.position.z).normalize();
      const runeMat = new THREE.MeshStandardMaterial({
        color: PALETTE.slateMid,
        emissive: PALETTE.slateTeal,
        emissiveIntensity: 0.25,
        roughness: 0.35,
        flatShading: true,
      });
      const rune = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), runeMat);
      rune.position.set(dir.x * 3.35, 1.12, dir.y * 3.35);
      g.add(rune);
      fountainState.runeOrbs[station.id] = rune;
    }

    // Rising fountain water-mist droplets
    const dropCount = 46;
    const dropPositions = new Float32Array(dropCount * 3);
    for (let i = 0; i < dropCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.45 + Math.random() * 0.55;
      fountainState.dropletVelocities.push({
        angle,
        phase: Math.random(),
        speed,
        radius: 0.25 + Math.random() * 1.4,
      });
      dropPositions[i * 3] = Math.cos(angle) * 0.5;
      dropPositions[i * 3 + 1] = 1.2;
      dropPositions[i * 3 + 2] = Math.sin(angle) * 0.5;
    }
    const dropGeo = new THREE.BufferGeometry();
    dropGeo.setAttribute('position', new THREE.BufferAttribute(dropPositions, 3));
    const dropMat = new THREE.PointsMaterial({
      size: 0.24,
      map: createGlowTexture('#FFFFFF', '#7CC9E8'),
      color: PALETTE.cyanGlow,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const droplets = new THREE.Points(dropGeo, dropMat);
    g.add(droplets);
    fountainState.droplets = droplets;

    // PointLight for fountain sanctuary
    const light = new THREE.PointLight(PALETTE.cyanGlow, 1.4, 18, 1.6);
    light.position.y = 3.4;
    g.add(light);
    fountainState.light = light;

    // Generous invisible clickable hit volume
    const hitMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.6, 4.4, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitMesh.position.y = 2.2;
    hitMesh.userData.interactiveId = FOUNTAIN.id;
    g.add(hitMesh);
    interactiveMeshes.push(hitMesh);

    scene.add(g);
  }
  buildCentralFountain();

  // --- Stylized Reward: Glowing Crystal Tree Builder ---
  function createRewardCrystalTree() {
    const treeGroup = new THREE.Group();

    // Tapered sculptural silver-teal trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.34, 2.3, 6),
      new THREE.MeshStandardMaterial({
        color: 0x164c61,
        emissive: 0x0b2e3d,
        emissiveIntensity: 0.35,
        roughness: 0.65,
        flatShading: true,
      })
    );
    trunk.position.y = 1.15;
    treeGroup.add(trunk);

    // Subtle branches
    const branchGeo = new THREE.CylinderGeometry(0.06, 0.12, 1.1, 5);
    const branchAngles = [
      { y: 1.75, rx: 0.55, rz: 0.4, ry: 0.2 },
      { y: 1.9, rx: -0.45, rz: 0.5, ry: 2.3 },
      { y: 1.8, rx: 0.35, rz: -0.55, ry: 4.1 },
    ];
    for (const b of branchAngles) {
      const br = new THREE.Mesh(branchGeo, trunk.material);
      br.position.y = b.y;
      br.rotation.set(b.rx, b.ry, b.rz);
      treeGroup.add(br);
    }

    // Faceted glowing cyan crystal-blossom canopy clusters
    const foliageGlowMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cyanGlow,
      emissive: PALETTE.primaryTeal,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.12,
      flatShading: true,
    });
    const coreGlowMat = new THREE.MeshStandardMaterial({
      color: PALETTE.whiteCrisp,
      emissive: PALETTE.cyanGlow,
      emissiveIntensity: 0.95,
      roughness: 0.18,
      flatShading: true,
    });

    const clusters = [
      { pos: [0, 3.05, 0], r: 0.95, mat: foliageGlowMat },
      { pos: [0.75, 2.55, 0.35], r: 0.62, mat: foliageGlowMat },
      { pos: [-0.72, 2.6, 0.4], r: 0.58, mat: foliageGlowMat },
      { pos: [0.15, 2.55, -0.78], r: 0.6, mat: foliageGlowMat },
      { pos: [0, 3.65, 0], r: 0.48, mat: coreGlowMat },
    ];
    for (const c of clusters) {
      const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 0), c.mat);
      leaf.position.set(...c.pos);
      leaf.rotation.set(c.pos[0], c.pos[1], c.pos[2]);
      treeGroup.add(leaf);
    }

    // Base crystal shards sprouting around the roots
    const shardGeo = new THREE.ConeGeometry(0.24, 1.15, 5);
    const shardSpecs = [
      { pos: [0.48, 0.45, 0.32], rot: [0.22, 0.4, -0.25], sc: 1.0 },
      { pos: [-0.52, 0.38, 0.25], rot: [0.18, 1.2, 0.32], sc: 0.85 },
      { pos: [0.1, 0.42, -0.52], rot: [-0.28, 2.1, 0.1], sc: 0.9 },
      { pos: [-0.25, 0.28, -0.35], rot: [-0.2, 0.5, 0.28], sc: 0.65 },
    ];
    for (const sh of shardSpecs) {
      const shard = new THREE.Mesh(shardGeo, coreGlowMat);
      shard.position.set(...sh.pos);
      shard.rotation.set(...sh.rot);
      shard.scale.setScalar(sh.sc);
      treeGroup.add(shard);
    }

    treeGroup.visible = false;
    treeGroup.scale.setScalar(0.001);
    return treeGroup;
  }

  // --- Low-Poly 3D Animal Guide Builder (1 Luminous Companion per Shrine) ---
  const matAnimalWhite = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x3b6f85,
    emissiveIntensity: 0.45,
    roughness: 0.55,
    metalness: 0.05,
    flatShading: true,
  });
  const matAnimalSlate = new THREE.MeshStandardMaterial({
    color: 0x5fb4d4,
    emissive: 0x1a5b75,
    emissiveIntensity: 0.42,
    roughness: 0.58,
    metalness: 0.08,
    flatShading: true,
  });
  const matAnimalNavy = new THREE.MeshStandardMaterial({
    color: 0x2a6987,
    emissive: 0x123e54,
    emissiveIntensity: 0.38,
    roughness: 0.65,
    metalness: 0.08,
    flatShading: true,
  });
  const matAnimalFox = new THREE.MeshStandardMaterial({
    color: 0xff9447,
    emissive: 0x6e2e0a,
    emissiveIntensity: 0.48,
    roughness: 0.58,
    metalness: 0.04,
    flatShading: true,
  });
  const matAnimalGold = new THREE.MeshStandardMaterial({
    color: 0xffe29e,
    emissive: 0xb87c24,
    emissiveIntensity: 0.65,
    roughness: 0.35,
    flatShading: true,
  });
  const matAnimalEye = new THREE.MeshBasicMaterial({
    color: 0xb8f3ff,
  });
  const matAnimalPupil = new THREE.MeshBasicMaterial({
    color: 0x041218,
  });
  const matAnimalAntler = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: PALETTE.cyanGlow,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    flatShading: true,
  });
  const guideAuraTex = createGlowTexture('#FFF6E0', '#F4C675');

  function createAnimalGuide(species) {
    const root = new THREE.Group();
    const actor = new THREE.Group();
    root.add(actor);

    // Raised two-tier carved stone sanctuary pedestal (keeps every animal cleanly above ground & dais)
    const basePlinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.88, 1.02, 0.24, 8),
      matStoneDark
    );
    basePlinth.position.y = 0.12;
    root.add(basePlinth);

    const pedestalColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.84, 0.48, 8),
      matStoneTrim
    );
    pedestalColumn.position.y = 0.48;
    root.add(pedestalColumn);

    const topCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 0.04, 16),
      new THREE.MeshStandardMaterial({
        color: 0x1a4f66,
        emissive: 0x14485c,
        emissiveIntensity: 0.45,
        roughness: 0.5,
      })
    );
    topCap.position.y = 0.73;
    root.add(topCap);

    const groundRingMat = new THREE.MeshBasicMaterial({
      color: 0xffe29e,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const topGlowRing = new THREE.Mesh(new THREE.RingGeometry(0.68, 0.84, 24), groundRingMat);
    topGlowRing.rotation.x = -Math.PI / 2;
    topGlowRing.position.y = 0.755;
    root.add(topGlowRing);

    const auraSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: guideAuraTex,
        color: 0xffe29e,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    auraSprite.position.set(0, 1.65, 0);
    auraSprite.scale.set(3.2, 3.2, 1);
    root.add(auraSprite);

    const headGroup = new THREE.Group();
    let tailMesh = null;
    let wingL = null;
    let wingR = null;
    let indicatorY = 2.4;

    if (species === 'owl') {
      // Nova the Twilight Owl perched high above the stone pedestal
      const perch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.3, 0.24, 6),
        matStoneDark
      );
      perch.position.y = 0.86;
      root.add(perch);
      actor.position.y = 0.98;

      const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), matAnimalSlate);
      body.scale.set(0.95, 1.25, 0.9);
      body.position.y = 0.42;
      actor.add(body);

      const belly = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), matAnimalWhite);
      belly.scale.set(0.85, 1.05, 0.55);
      belly.position.set(0, 0.38, 0.22);
      actor.add(belly);

      // Folded wings
      const wingGeo = new THREE.ConeGeometry(0.18, 0.62, 5);
      wingL = new THREE.Mesh(wingGeo, matAnimalNavy);
      wingL.position.set(-0.34, 0.44, -0.02);
      wingL.rotation.set(0.12, 0, -0.28);
      actor.add(wingL);

      wingR = new THREE.Mesh(wingGeo, matAnimalNavy);
      wingR.position.set(0.34, 0.44, -0.02);
      wingR.rotation.set(0.12, 0, 0.28);
      actor.add(wingR);

      // Owl Head
      headGroup.position.set(0, 0.92, 0.04);
      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.31, 0), matAnimalSlate);
      head.scale.set(1.06, 0.92, 0.95);
      headGroup.add(head);

      const faceDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 8), matAnimalWhite);
      faceDisc.rotation.x = Math.PI / 2;
      faceDisc.position.set(0, -0.02, 0.23);
      headGroup.add(faceDisc);

      // Glowing Cyan Eyes
      for (const sx of [-0.11, 0.11]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.068, 8, 8), matAnimalEye);
        eye.position.set(sx, 0.03, 0.28);
        headGroup.add(eye);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), matAnimalPupil);
        pupil.position.set(sx, 0.03, 0.33);
        headGroup.add(pupil);

        // Ear tufts
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.24, 4), matAnimalNavy);
        tuft.position.set(sx * 1.9, 0.28, 0.02);
        tuft.rotation.z = sx < 0 ? 0.38 : -0.38;
        headGroup.add(tuft);
      }

      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.16, 4), matAnimalGold);
      beak.rotation.x = Math.PI / 2 + 0.25;
      beak.position.set(0, -0.06, 0.32);
      headGroup.add(beak);

      actor.add(headGroup);
      indicatorY = 2.65;
    } else if (species === 'husky') {
      // Koda the Hosford Husky — seated high atop the pedestal
      actor.position.y = 0.76;

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.52, 0.72), matAnimalNavy);
      torso.position.set(0, 0.46, -0.04);
      torso.rotation.x = -0.22;
      actor.add(torso);

      const chest = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), matAnimalWhite);
      chest.scale.set(0.95, 1.1, 0.8);
      chest.position.set(0, 0.48, 0.24);
      actor.add(chest);

      // Front legs & paws
      const legGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.56, 6);
      for (const sx of [-0.18, 0.18]) {
        const leg = new THREE.Mesh(legGeo, matAnimalWhite);
        leg.position.set(sx, 0.28, 0.26);
        actor.add(leg);
        const haunch = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), matAnimalSlate);
        haunch.position.set(sx * 1.15, 0.24, -0.24);
        actor.add(haunch);
      }

      // Glowing cyan Hosford collar + tag
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.045, 6, 12),
        matTealAccent
      );
      collar.rotation.x = Math.PI / 2 + 0.18;
      collar.position.set(0, 0.72, 0.18);
      actor.add(collar);

      const tag = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), matAnimalGold);
      tag.position.set(0, 0.65, 0.42);
      actor.add(tag);

      // Fluffy curled tail
      const tailPivot = new THREE.Group();
      tailPivot.position.set(0, 0.32, -0.4);
      const tailMeshInner = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.58, 6), matAnimalSlate);
      tailMeshInner.position.set(0, 0.22, -0.14);
      tailMeshInner.rotation.x = -0.58;
      tailPivot.add(tailMeshInner);
      const tailTip = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), matAnimalWhite);
      tailTip.position.set(0, 0.45, -0.28);
      tailPivot.add(tailTip);
      actor.add(tailPivot);
      tailMesh = tailPivot;

      // Husky Head
      headGroup.position.set(0, 0.96, 0.22);
      const skull = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), matAnimalNavy);
      headGroup.add(skull);

      const mask = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), matAnimalWhite);
      mask.scale.set(0.95, 0.85, 0.72);
      mask.position.set(0, -0.04, 0.15);
      headGroup.add(mask);

      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.26), matAnimalWhite);
      snout.position.set(0, -0.07, 0.31);
      headGroup.add(snout);

      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.07), matAnimalPupil);
      nose.position.set(0, -0.03, 0.44);
      headGroup.add(nose);

      for (const sx of [-0.12, 0.12]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 4), matAnimalNavy);
        ear.position.set(sx * 1.45, 0.34, -0.02);
        ear.rotation.z = sx < 0 ? 0.18 : -0.18;
        headGroup.add(ear);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), matAnimalEye);
        eye.position.set(sx, 0.05, 0.27);
        headGroup.add(eye);
      }

      actor.add(headGroup);
      indicatorY = 2.45;
    } else if (species === 'stag') {
      // Atlas the Silver Stag — standing tall atop the pedestal
      actor.position.y = 0.76;

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.46, 1.05), matAnimalSlate);
      body.position.set(0, 0.82, 0);
      actor.add(body);

      const ruff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), matAnimalWhite);
      ruff.position.set(0, 0.82, 0.46);
      actor.add(ruff);

      // Four slender legs
      const legGeo = new THREE.CylinderGeometry(0.058, 0.048, 0.78, 5);
      const legCoords = [
        [-0.17, 0.39, 0.36],
        [0.17, 0.39, 0.36],
        [-0.17, 0.39, -0.38],
        [0.17, 0.39, -0.38],
      ];
      for (const [lx, ly, lz] of legCoords) {
        const leg = new THREE.Mesh(legGeo, matAnimalNavy);
        leg.position.set(lx, ly, lz);
        actor.add(leg);
      }

      // Short white tail
      const stagTail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 5), matAnimalWhite);
      stagTail.position.set(0, 0.9, -0.58);
      stagTail.rotation.x = -0.8;
      actor.add(stagTail);
      tailMesh = stagTail;

      // Graceful neck
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.65, 6), matAnimalSlate);
      neck.position.set(0, 1.18, 0.44);
      neck.rotation.x = 0.25;
      actor.add(neck);

      // Stag Head + Glowing Branching Antlers
      headGroup.position.set(0, 1.52, 0.56);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.46), matAnimalSlate);
      head.position.z = 0.08;
      headGroup.add(head);

      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.22), matAnimalWhite);
      muzzle.position.set(0, -0.04, 0.34);
      headGroup.add(muzzle);

      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.06), matAnimalPupil);
      nose.position.set(0, -0.01, 0.45);
      headGroup.add(nose);

      for (const sx of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.046, 8, 8), matAnimalEye);
        eye.position.set(sx * 0.14, 0.04, 0.18);
        headGroup.add(eye);

        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.24, 4), matAnimalSlate);
        ear.position.set(sx * 0.2, 0.14, -0.05);
        ear.rotation.z = -sx * 0.72;
        headGroup.add(ear);

        // Branching sculptural antlers
        const mainStem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.04, 0.62, 5),
          matAnimalAntler
        );
        mainStem.position.set(sx * 0.18, 0.36, -0.02);
        mainStem.rotation.z = -sx * 0.38;
        mainStem.rotation.x = -0.15;
        headGroup.add(mainStem);

        const tine1 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.028, 0.3, 4),
          matAnimalAntler
        );
        tine1.position.set(sx * 0.28, 0.5, 0.08);
        tine1.rotation.z = -sx * 0.12;
        tine1.rotation.x = 0.55;
        headGroup.add(tine1);

        const tine2 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.016, 0.024, 0.28, 4),
          matAnimalAntler
        );
        tine2.position.set(sx * 0.36, 0.62, -0.08);
        tine2.rotation.z = -sx * 0.55;
        headGroup.add(tine2);
      }

      actor.add(headGroup);
      indicatorY = 3.15;
    } else {
      // Vega the Twilight Fox — seated cleanly atop the pedestal
      actor.position.y = 0.76;

      const torso = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.78, 6), matAnimalFox);
      torso.position.set(0, 0.42, -0.02);
      actor.add(torso);

      const bib = new THREE.Mesh(new THREE.ConeGeometry(0.21, 0.54, 5), matAnimalWhite);
      bib.position.set(0, 0.42, 0.14);
      actor.add(bib);

      for (const sx of [-0.14, 0.14]) {
        const paw = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.38, 5), matAnimalNavy);
        paw.position.set(sx, 0.19, 0.22);
        actor.add(paw);
      }

      // Big bushy fox tail with crisp white tip
      const tailPivot = new THREE.Group();
      tailPivot.position.set(0, 0.3, -0.26);
      const tailBody = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.68, 6), matAnimalFox);
      tailBody.position.set(0.14, 0.14, -0.26);
      tailBody.rotation.set(-1.05, 0, -0.45);
      tailPivot.add(tailBody);
      const tailWhite = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 6), matAnimalWhite);
      tailWhite.position.set(0.29, 0.26, -0.52);
      tailWhite.rotation.set(2.05, 0, 0.45);
      tailPivot.add(tailWhite);
      actor.add(tailPivot);
      tailMesh = tailPivot;

      // Fox Head
      headGroup.position.set(0, 0.86, 0.1);
      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.27, 0), matAnimalFox);
      head.scale.set(1.08, 0.88, 1.0);
      headGroup.add(head);

      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 5), matAnimalWhite);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, -0.05, 0.32);
      headGroup.add(snout);

      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.042, 6, 6), matAnimalPupil);
      nose.position.set(0, -0.04, 0.49);
      headGroup.add(nose);

      for (const sx of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.32, 4), matAnimalFox);
        ear.position.set(sx * 0.19, 0.29, -0.02);
        ear.rotation.z = -sx * 0.22;
        headGroup.add(ear);

        const earTip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.12, 4), matAnimalNavy);
        earTip.position.set(sx * 0.22, 0.42, -0.02);
        earTip.rotation.z = -sx * 0.22;
        headGroup.add(earTip);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), matAnimalEye);
        eye.position.set(sx * 0.12, 0.04, 0.22);
        headGroup.add(eye);
      }

      actor.add(headGroup);
      indicatorY = 2.35;
    }

    // Prominent glowing floating chat-sparkle diamond above guide's head
    const chatOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshBasicMaterial({ color: 0xffe29e })
    );
    chatOrb.position.set(0, indicatorY, 0.15);
    root.add(chatOrb);

    // Scale up so every animal companion is super easy to spot across the garden
    root.scale.setScalar(1.42);

    return {
      root,
      actor,
      headGroup,
      tailMesh,
      wingL,
      wingR,
      chatOrb,
      groundRingMat,
      auraSprite,
      indicatorY,
      species,
      baseActorY: actor.position.y,
      bounce: 0,
      hovered: false,
    };
  }

  // --- Build the 4 Distinct Motivation Shrines ---
  const shrineObjects = {};

  function buildShrine(station) {
    const group = new THREE.Group();
    group.position.set(station.position.x, 0, station.position.z);

    // Orient shrine to face the Central Fountain
    const faceAngle = Math.atan2(-station.position.x, -station.position.z);
    group.rotation.y = faceAngle;

    obstacles.push({
      x: station.position.x,
      z: station.position.z,
      r: station.collisionRadius,
    });

    // Shared Octagonal Stone Dais
    const dais = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.6, 0.36, 8),
      matStoneDark
    );
    dais.position.y = 0.18;
    group.add(dais);

    const daisStep = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.85, 0.22, 8),
      matStoneTrim
    );
    daisStep.position.y = 0.44;
    group.add(daisStep);

    // Dynamic accent material per shrine (brightens when completed)
    const accentMat = new THREE.MeshStandardMaterial({
      color: PALETTE.primaryTeal,
      emissive: 0x0d3c4d,
      emissiveIntensity: 0.4,
      roughness: 0.35,
      metalness: 0.2,
      flatShading: true,
    });

    const animatedParts = [];

    // --- Distinct Landmark Architecture per Zone ---
    if (station.id === 'observatory') {
      // Zone 1: Observatory Overlook — Armillary Sphere & Stargazing Spire
      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 1.05, 1.4, 8),
        matStoneDark
      );
      pedestal.position.y = 1.15;
      group.add(pedestal);

      // Twin curving stone observation pillars
      for (const side of [-1, 1]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.1, 0.32), matStoneTrim);
        col.position.set(side * 1.9, 1.9, -0.5);
        col.rotation.z = side * 0.12;
        group.add(col);
      }
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.13, 6, 16, Math.PI), matStoneTrim);
      arch.position.set(0, 3.3, -0.5);
      group.add(arch);

      // Rotating Armillary Rings
      const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.06, 6, 24), accentMat);
      ringA.position.y = 2.65;
      group.add(ringA);

      const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.05, 6, 20), matWhiteHighlight);
      ringB.position.y = 2.65;
      ringB.rotation.x = Math.PI / 3;
      group.add(ringB);

      // Stylized telescope pointing toward twilight stars
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.75, 8), matTealAccent);
      scope.position.set(0, 2.7, 0.15);
      scope.rotation.x = -0.68;
      group.add(scope);

      animatedParts.push({ mesh: ringA, type: 'spinY', speed: 0.55 });
      animatedParts.push({ mesh: ringB, type: 'spinXY', speed: 0.7 });
    } else if (station.id === 'hearthfire') {
      // Zone 2: Hearthfire Pavilion — Sheltering Pagoda & Glowing Stone Hearth
      const pillarPositions = [
        [-1.65, -1.65],
        [1.65, -1.65],
        [-1.65, 1.65],
        [1.65, 1.65],
      ];
      for (const [px, pz] of pillarPositions) {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.22, 3.25, 6),
          matStoneTrim
        );
        pillar.position.set(px, 2.1, pz);
        group.add(pillar);
      }

      // Layered Pagoda Roof
      const roofLower = new THREE.Mesh(new THREE.ConeGeometry(3.25, 1.1, 4), matStoneDark);
      roofLower.rotation.y = Math.PI / 4;
      roofLower.position.y = 4.1;
      group.add(roofLower);

      const roofTrim = new THREE.Mesh(new THREE.ConeGeometry(2.2, 0.95, 4), matTealAccent);
      roofTrim.rotation.y = Math.PI / 4;
      roofTrim.position.y = 4.88;
      group.add(roofTrim);

      // Central Hearth Brazier + Crystalline Flame
      const brazier = new THREE.Mesh(
        new THREE.CylinderGeometry(0.88, 0.62, 0.85, 8),
        matStoneDark
      );
      brazier.position.y = 0.95;
      group.add(brazier);

      const emberCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), accentMat);
      emberCore.scale.set(0.85, 1.45, 0.85);
      emberCore.position.y = 1.85;
      group.add(emberCore);
      animatedParts.push({ mesh: emberCore, type: 'pulseFlame', baseY: 1.85 });
    } else if (station.id === 'horizon') {
      // Zone 3: Horizon Bridge — Arched Footbridge over Shimmering Pool + Twin Gateway Pillars
      const pond = new THREE.Mesh(new THREE.CylinderGeometry(3.35, 3.45, 0.14, 12), matWater);
      pond.position.y = 0.26;
      group.add(pond);

      // Curved low-poly bridge deck segments
      const segGeo = new THREE.BoxGeometry(1.75, 0.22, 0.95);
      const bridgeSpecs = [
        { z: 1.65, y: 0.52, rx: -0.26 },
        { z: 0.85, y: 0.82, rx: -0.14 },
        { z: 0.0, y: 0.95, rx: 0 },
        { z: -0.85, y: 0.82, rx: 0.14 },
        { z: -1.65, y: 0.52, rx: 0.26 },
      ];
      for (const seg of bridgeSpecs) {
        const plank = new THREE.Mesh(segGeo, matStoneTrim);
        plank.position.set(0, seg.y, seg.z);
        plank.rotation.x = seg.rx;
        group.add(plank);
      }

      // Bridge railings
      for (const side of [-0.95, 0.95]) {
        const rail = new THREE.Mesh(
          new THREE.TorusGeometry(2.15, 0.075, 6, 14, Math.PI * 0.58),
          matTealAccent
        );
        rail.rotation.y = Math.PI / 2;
        rail.rotation.z = Math.PI * 0.21;
        rail.position.set(side, -0.45, 0);
        group.add(rail);
      }

      // Twin Horizon Gateway Pillars (Torii-inspired frame at back of bridge)
      for (const side of [-1.45, 1.45]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 4.1, 6), matStoneDark);
        post.position.set(side, 2.25, -1.75);
        group.add(post);
      }
      const lintelTop = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.24, 0.36), accentMat);
      lintelTop.position.set(0, 4.15, -1.75);
      group.add(lintelTop);
      const lintelMid = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.16, 0.24), matStoneTrim);
      lintelMid.position.set(0, 3.48, -1.75);
      group.add(lintelMid);
    } else if (station.id === 'maverick') {
      // Zone 4: Maverick Grove — Standing-Stone Circle & Independent Compass Monolith
      const stoneCount = 5;
      for (let i = 0; i < stoneCount; i++) {
        const a = (i / stoneCount) * Math.PI * 2 + 0.35;
        const h = 1.9 + (i % 3) * 0.65;
        const monolith = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.42, h, 5),
          matStoneDark
        );
        monolith.position.set(Math.cos(a) * 2.15, 0.45 + h / 2, Math.sin(a) * 2.15);
        monolith.rotation.y = -a;
        monolith.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.09;
        group.add(monolith);

        const runeBand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), accentMat);
        runeBand.position.set(Math.cos(a) * 1.92, 1.35, Math.sin(a) * 1.92);
        group.add(runeBand);
      }

      // Central Compass Obelisk
      const obelisk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.58, 3.2, 4),
        matStoneTrim
      );
      obelisk.position.y = 2.05;
      group.add(obelisk);

      // Floating Compass Diamond Crown
      const compassGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), accentMat);
      compassGem.scale.set(0.7, 1.5, 0.7);
      compassGem.position.y = 4.05;
      group.add(compassGem);
      animatedParts.push({ mesh: compassGem, type: 'spinY', speed: 0.9 });
    }

    // --- Shrine Lantern Post (Animates bright #7CC9E8 when completed) ---
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(-2.35, 0, 1.65);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.35, 6), matStoneDark);
    post.position.y = 1.18;
    lanternGroup.add(post);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.09, 0.09), matStoneTrim);
    arm.position.set(0.24, 2.28, 0);
    lanternGroup.add(arm);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 6), matStoneDark);
    cap.position.set(0.5, 2.18, 0);
    lanternGroup.add(cap);

    const lanternGlassMat = new THREE.MeshStandardMaterial({
      color: 0x164d63,
      emissive: 0x0e3a4d,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.05,
    });
    const lanternGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.16, 0.44, 6),
      lanternGlassMat
    );
    lanternGlass.position.set(0.5, 1.88, 0);
    lanternGroup.add(lanternGlass);

    const lanternLight = new THREE.PointLight(PALETTE.primaryTeal, 0.65, 15, 1.7);
    lanternLight.position.set(0.5, 1.9, 0);
    lanternGroup.add(lanternLight);

    group.add(lanternGroup);

    // --- Floating Clickable Beacon Orb ---
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(0, 4.95, 0);

    const beaconMat = new THREE.MeshStandardMaterial({
      color: PALETTE.primaryTeal,
      emissive: PALETTE.primaryTeal,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.1,
      flatShading: true,
    });
    const beaconOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), beaconMat);
    beaconGroup.add(beaconOrb);

    const beaconHaloMat = new THREE.MeshBasicMaterial({
      color: PALETTE.primaryTeal,
      transparent: true,
      opacity: 0.65,
    });
    const beaconHalo = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.032, 8, 20), beaconHaloMat);
    beaconGroup.add(beaconHalo);

    const beaconGlowSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createGlowTexture('#FFFFFF', '#7CC9E8'),
        color: PALETTE.primaryTeal,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
      })
    );
    beaconGlowSprite.scale.set(2.4, 2.4, 1);
    beaconGroup.add(beaconGlowSprite);

    group.add(beaconGroup);

    // --- 3D Animal Guide Standing Tall on Raised Pedestal Clear of the Shrine Dais ---
    const guideObj = createAnimalGuide(station.guide.species);
    guideObj.root.position.set(2.95, 0, 3.75);
    guideObj.root.rotation.y = -0.45;
    group.add(guideObj.root);

    // Add world-space collision obstacle around the animal pedestal so students don't clip through
    const gWorldX =
      station.position.x +
      guideObj.root.position.x * Math.cos(faceAngle) +
      guideObj.root.position.z * Math.sin(faceAngle);
    const gWorldZ =
      station.position.z -
      guideObj.root.position.x * Math.sin(faceAngle) +
      guideObj.root.position.z * Math.cos(faceAngle);
    obstacles.push({ x: gWorldX, z: gWorldZ, r: 1.75 });

    const guideHit = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 3.2, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    guideHit.position.set(0, 2.0, 0);
    guideHit.userData.interactiveId = `guide:${station.id}`;
    guideObj.root.add(guideHit);
    interactiveMeshes.push(guideHit);

    // Generous invisible clickable hit sphere covering monument + beacon
    const hitSphere = new THREE.Mesh(
      new THREE.CylinderGeometry(3.1, 3.2, 5.6, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitSphere.position.y = 2.8;
    hitSphere.userData.interactiveId = station.id;
    group.add(hitSphere);
    interactiveMeshes.push(hitSphere);

    scene.add(group);

    // --- Visual Reward: Glowing Tree / Crystal placed in world space beside shrine ---
    const rewardTree = createRewardCrystalTree();
    rewardTree.position.set(
      station.position.x + station.treeOffset.x,
      0,
      station.position.z + station.treeOffset.z
    );
    scene.add(rewardTree);

    shrineObjects[station.id] = {
      station,
      group,
      accentMat,
      lanternGlassMat,
      lanternLight,
      beaconGroup,
      beaconOrb,
      beaconMat,
      beaconHalo,
      beaconHaloMat,
      beaconGlowSprite,
      rewardTree,
      guide: guideObj,
      animatedParts,
      lit: false,
      lightAnim: 0, // 0 -> 1 smoothly animated
      treeAnim: 0, // 0 -> 1 smoothly animated
      hovered: false,
    };
  }

  for (const station of STATIONS) {
    buildShrine(station);
  }

  // --- Sky of Stories & Stars: Interactive Overhead Constellations ---
  const skyObjects = {};
  const skyGlowTex = createGlowTexture('#FFFFFF', '#7CC9E8');

  function buildSkyConstellations() {
    const skyRadius = 56;
    const starOctGeo = new THREE.OctahedronGeometry(0.95, 0);
    const subStarGeo = new THREE.OctahedronGeometry(0.42, 0);
    const ringGeo = new THREE.TorusGeometry(1.65, 0.085, 8, 24);
    const hitGeo = new THREE.SphereGeometry(4.4, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    for (let idx = 0; idx < SKY_INSPIRATIONS.length; idx++) {
      const item = SKY_INSPIRATIONS[idx];
      const az = THREE.MathUtils.degToRad(item.azimuthDeg);
      const el = THREE.MathUtils.degToRad(item.elevationDeg);
      const horiz = Math.cos(el) * skyRadius;
      const wx = -Math.sin(az) * horiz;
      const wz = -Math.cos(az) * horiz;
      const wy = 2.0 + Math.sin(el) * skyRadius;

      const group = new THREE.Group();
      group.position.set(wx, wy, wz);
      group.lookAt(0, EYE_HEIGHT, 0);

      const coreMat = new THREE.MeshBasicMaterial({
        color: PALETTE.whiteCrisp,
        fog: false,
      });
      const coreStar = new THREE.Mesh(starOctGeo, coreMat);
      group.add(coreStar);

      let ringMesh = null;
      if (item.type === 'quote') {
        // Crossed 8-point celestial star
        const crossStar = new THREE.Mesh(starOctGeo, coreMat);
        crossStar.rotation.set(Math.PI / 4, Math.PI / 4, 0);
        crossStar.scale.setScalar(0.88);
        group.add(crossStar);
      } else if (item.type === 'video') {
        // Glowing orbital star-ring signifying playable video
        const ringMat = new THREE.MeshBasicMaterial({
          color: PALETTE.cyanGlow,
          transparent: true,
          opacity: 0.9,
          fog: false,
        });
        ringMesh = new THREE.Mesh(ringGeo, ringMat);
        group.add(ringMesh);
      } else if (item.type === 'story') {
        // Miniature 4-star constellation connected by glowing starlight threads
        const offsets = [
          new THREE.Vector3(-2.4, 1.2, 0),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(2.2, 0.85, 0),
          new THREE.Vector3(3.1, -1.35, 0),
        ];
        for (const off of offsets) {
          if (off.lengthSq() > 0.01) {
            const sub = new THREE.Mesh(subStarGeo, coreMat);
            sub.position.copy(off);
            group.add(sub);
          }
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(offsets);
        const lineMat = new THREE.LineBasicMaterial({
          color: PALETTE.cyanGlow,
          transparent: true,
          opacity: 0.72,
          fog: false,
        });
        group.add(new THREE.Line(lineGeo, lineMat));
      }

      const haloSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: skyGlowTex,
          color: item.type === 'video' ? PALETTE.cyanGlow : PALETTE.whiteCrisp,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        })
      );
      haloSprite.scale.set(6.8, 6.8, 1);
      group.add(haloSprite);

      // Generous clickable hit sphere
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData.interactiveId = `sky:${item.id}`;
      group.add(hitMesh);
      interactiveMeshes.push(hitMesh);

      scene.add(group);

      skyObjects[item.id] = {
        item,
        group,
        worldPos: new THREE.Vector3(wx, wy, wz),
        coreStar,
        ringMesh,
        haloSprite,
        explored: false,
        hovered: false,
        phase: idx * 1.17,
      };
    }
  }
  buildSkyConstellations();

  // Occasional serene shooting star across the upper twilight sky
  const shootingStarPositions = new Float32Array(6);
  const shootingStarGeo = new THREE.BufferGeometry();
  shootingStarGeo.setAttribute('position', new THREE.BufferAttribute(shootingStarPositions, 3));
  const shootingStarMat = new THREE.LineBasicMaterial({
    color: PALETTE.whiteCrisp,
    transparent: true,
    opacity: 0,
    fog: false,
  });
  const shootingStarLine = new THREE.Line(shootingStarGeo, shootingStarMat);
  shootingStarLine.frustumCulled = false;
  scene.add(shootingStarLine);

  const shootingStarState = {
    active: false,
    timer: 5.5,
    elapsed: 0,
    duration: 1.15,
    start: new THREE.Vector3(),
    dir: new THREE.Vector3(),
  };

  function updateShootingStar(dt) {
    if (!shootingStarState.active) {
      shootingStarState.timer -= dt;
      if (shootingStarState.timer <= 0) {
        shootingStarState.active = true;
        shootingStarState.elapsed = 0;
        const a = Math.random() * Math.PI * 2;
        shootingStarState.start.set(Math.cos(a) * 58, 38 + Math.random() * 14, Math.sin(a) * 58);
        shootingStarState.dir
          .set(-Math.sin(a) * 32 + (Math.random() - 0.5) * 14, -10 - Math.random() * 6, Math.cos(a) * 32)
          .normalize();
      }
      return;
    }

    shootingStarState.elapsed += dt;
    const t = shootingStarState.elapsed / shootingStarState.duration;
    if (t >= 1) {
      shootingStarState.active = false;
      shootingStarState.timer = 9 + Math.random() * 7;
      shootingStarMat.opacity = 0;
      return;
    }

    const headDist = t * 44;
    const tailDist = Math.max(0, headDist - 6.5);
    const pos = shootingStarGeo.attributes.position;
    pos.setXYZ(
      0,
      shootingStarState.start.x + shootingStarState.dir.x * tailDist,
      shootingStarState.start.y + shootingStarState.dir.y * tailDist,
      shootingStarState.start.z + shootingStarState.dir.z * tailDist
    );
    pos.setXYZ(
      1,
      shootingStarState.start.x + shootingStarState.dir.x * headDist,
      shootingStarState.start.y + shootingStarState.dir.y * headDist,
      shootingStarState.start.z + shootingStarState.dir.z * headDist
    );
    pos.needsUpdate = true;
    shootingStarMat.opacity = Math.sin(t * Math.PI) * 0.85;
  }

  // --- Floating Ambient Fireflies ---
  const fireflyCount = 155;
  const fireflyBase = [];
  const fireflyPositions = new Float32Array(fireflyCount * 3);
  const fireflyColors = new Float32Array(fireflyCount * 3);
  const cFireCyan = new THREE.Color(PALETTE.cyanGlow);
  const cFireWhite = new THREE.Color(PALETTE.whiteCrisp);

  for (let i = 0; i < fireflyCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 4.5 + Math.random() * 27;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = 0.65 + Math.random() * 4.2;
    fireflyBase.push({
      x,
      y,
      z,
      phase: Math.random() * Math.PI * 2,
      speed: 0.45 + Math.random() * 0.75,
      drift: 0.35 + Math.random() * 0.6,
    });
    fireflyPositions[i * 3] = x;
    fireflyPositions[i * 3 + 1] = y;
    fireflyPositions[i * 3 + 2] = z;

    const c = Math.random() > 0.25 ? cFireCyan : cFireWhite;
    fireflyColors[i * 3] = c.r;
    fireflyColors[i * 3 + 1] = c.g;
    fireflyColors[i * 3 + 2] = c.b;
  }

  const fireflyGeo = new THREE.BufferGeometry();
  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
  fireflyGeo.setAttribute('color', new THREE.BufferAttribute(fireflyColors, 3));
  const fireflyMat = new THREE.PointsMaterial({
    size: 0.46,
    map: createGlowTexture('#FFFFFF', '#7CC9E8'),
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
  scene.add(fireflies);

  // --- Burst Celebration Particle Pool (for shrine ignition & 4/4 celebration) ---
  const burstParticles = [];
  const burstGeo = new THREE.BufferGeometry();
  const maxBurst = 120;
  const burstPosArr = new Float32Array(maxBurst * 3);
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPosArr, 3));
  const burstMat = new THREE.PointsMaterial({
    size: 0.58,
    map: createGlowTexture('#FFFFFF', '#7CC9E8'),
    color: PALETTE.cyanGlow,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const burstPoints = new THREE.Points(burstGeo, burstMat);
  burstPoints.frustumCulled = false;
  scene.add(burstPoints);

  function spawnSparkBurst(originX, originY, originZ, count = 40, spread = 2.6) {
    for (let i = 0; i < count; i++) {
      if (burstParticles.length >= maxBurst) {
        burstParticles.shift();
      }
      const a = Math.random() * Math.PI * 2;
      const spd = 0.6 + Math.random() * spread;
      burstParticles.push({
        x: originX + (Math.random() - 0.5) * 0.8,
        y: originY + Math.random() * 0.6,
        z: originZ + (Math.random() - 0.5) * 0.8,
        vx: Math.cos(a) * spd,
        vy: 1.8 + Math.random() * 2.8,
        vz: Math.sin(a) * spd,
        life: 0,
        maxLife: 1.6 + Math.random() * 1.1,
      });
    }
  }

  // --- Player Camera State & Chromebook-Friendly Controls ---
  const playerPos = new THREE.Vector3(0, EYE_HEIGHT, 11.4);
  const startAngles = computeLookAngles(playerPos, { x: 0, y: 1.5, z: 0 });
  let yaw = startAngles.yaw;
  let pitch = startAngles.pitch;
  let walkBobPhase = 0;
  let controlsPaused = false;
  let isPointerLocked = false;

  // Glide / Quick-Travel Animation State
  let activeGlide = null;

  // Keyboard state
  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  function clearKeys() {
    keys.forward = false;
    keys.backward = false;
    keys.left = false;
    keys.right = false;
  }

  function handleKeyDown(e) {
    if (controlsPaused) return;
    // Ignore typing in inputs just in case
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = true;
        activeGlide = null;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = true;
        activeGlide = null;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = true;
        activeGlide = null;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = true;
        activeGlide = null;
        break;
      case 'KeyE':
        if (currentProximityId && onInteract) {
          e.preventDefault();
          onInteract(currentProximityId);
        }
        break;
      default:
        break;
    }
  }

  function handleKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = false;
        break;
      default:
        break;
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', clearKeys);

  // --- Click-and-Drag / Touch Look + Raycast Click ---
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let dragDistance = 0;
  let hoveredInteractiveId = null;

  function performRaycast(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);
    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    if (hits.length > 0) {
      return hits[0].object.userData.interactiveId || null;
    }
    return null;
  }

  function performCenterRaycast() {
    pointerNDC.set(0, 0);
    raycaster.setFromCamera(pointerNDC, camera);
    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    if (hits.length > 0) {
      const id = hits[0].object.userData.interactiveId || null;
      const maxDist = id && id.startsWith('sky:') ? 105 : 26;
      if (hits[0].distance < maxDist) return id;
    }
    return null;
  }

  function setHoveredId(id) {
    if (hoveredInteractiveId === id) return;
    hoveredInteractiveId = id;
    for (const key of Object.keys(shrineObjects)) {
      shrineObjects[key].hovered = key === id;
      if (shrineObjects[key].guide) {
        shrineObjects[key].guide.hovered = `guide:${key}` === id;
      }
    }
    for (const key of Object.keys(skyObjects)) {
      skyObjects[key].hovered = `sky:${key}` === id;
    }
    if (!isPointerLocked) {
      canvas.style.cursor = id ? 'pointer' : isDragging ? 'grabbing' : 'grab';
    }
  }

  canvas.style.cursor = 'grab';

  canvas.addEventListener('pointerdown', (e) => {
    if (controlsPaused) return;
    if (isPointerLocked) {
      const hitId = performCenterRaycast() || currentProximityId;
      if (hitId && onInteract) {
        onInteract(hitId);
      }
      return;
    }
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    dragDistance = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('pointermove', (e) => {
    if (controlsPaused) return;
    if (isPointerLocked) {
      yaw -= e.movementX * 0.0024;
      pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.0022, MIN_PITCH, MAX_PITCH);
      activeGlide = null;
      return;
    }

    if (isDragging) {
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      dragDistance += Math.hypot(dx, dy);

      if (dragDistance > 3) {
        activeGlide = null;
      }
      // Natural drag-to-look sensitivity for Chromebook trackpads & mice
      yaw += dx * 0.0042;
      pitch = THREE.MathUtils.clamp(pitch + dy * 0.0038, MIN_PITCH, MAX_PITCH);
    } else if (e.pointerType === 'mouse') {
      const hitId = performRaycast(e.clientX, e.clientY);
      setHoveredId(hitId);
    }
  });

  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if already released
    }

    const moved = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
    if (moved < 7 && dragDistance < 10 && !controlsPaused) {
      const hitId = performRaycast(e.clientX, e.clientY);
      if (hitId && onInteract) {
        onInteract(hitId);
      }
    }
    canvas.style.cursor = hoveredInteractiveId ? 'pointer' : 'grab';
  }

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // Pointer Lock lifecycle
  document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === canvas;
    if (onPointerLockChange) {
      onPointerLockChange(isPointerLocked);
    }
  });

  // --- Proximity Detection ---
  let currentProximityId = null;

  function updateProximity() {
    let closestId = null;
    let closestDist = Infinity;

    const fDist = Math.hypot(
      playerPos.x - FOUNTAIN.position.x,
      playerPos.z - FOUNTAIN.position.z
    );
    if (fDist <= FOUNTAIN.interactionRadius && fDist < closestDist) {
      closestDist = fDist;
      closestId = FOUNTAIN.id;
    }

    for (const station of STATIONS) {
      const d = Math.hypot(
        playerPos.x - station.position.x,
        playerPos.z - station.position.z
      );
      if (d <= station.interactionRadius && d < closestDist) {
        closestDist = d;
        closestId = station.id;
      }
    }

    if (closestId !== currentProximityId) {
      currentProximityId = closestId;
      if (onProximityChange) {
        onProximityChange(currentProximityId);
      }
    }
  }

  // --- Visual State Sync (Shrines + Fountain) ---
  function applyVisualState(state, { instant = false, newlyLitId = null } = {}) {
    let litCount = 0;

    for (const station of STATIONS) {
      const data = state.stations[station.id];
      const obj = shrineObjects[station.id];
      const isLit = Boolean(data?.completed);
      if (isLit) litCount += 1;

      obj.lit = isLit;
      if (instant) {
        obj.lightAnim = isLit ? 1 : 0;
        obj.treeAnim = isLit ? 1 : 0;
        obj.rewardTree.visible = isLit;
        obj.rewardTree.scale.setScalar(isLit ? 1 : 0.001);
        updateShrineMaterials(obj, obj.lightAnim);
      } else if (newlyLitId === station.id && isLit) {
        obj.rewardTree.visible = true;
        if (obj.guide) obj.guide.bounce = 1.0;
        // Celebrate newly lit shrine with rising cyan sparks around beacon & tree!
        spawnSparkBurst(station.position.x, 3.6, station.position.z, 38, 2.2);
        spawnSparkBurst(
          station.position.x + station.treeOffset.x,
          1.4,
          station.position.z + station.treeOffset.z,
          26,
          1.8
        );
      }

      // Mirror completion status onto Central Fountain's 4 rune orbs
      const rune = fountainState.runeOrbs[station.id];
      if (rune) {
        rune.material.color.setHex(isLit ? PALETTE.whiteCrisp : PALETTE.slateMid);
        rune.material.emissive.setHex(isLit ? PALETTE.cyanGlow : PALETTE.slateTeal);
        rune.material.emissiveIntensity = isLit ? 1.4 : 0.2;
      }
    }

    fountainState.completedCount = litCount;

    // Brighten Central Fountain crystal & light proportionally (0/4 -> 4/4)
    const ratio = litCount / STATIONS.length;
    fountainState.light.intensity = 1.2 + ratio * 2.4;
    fountainState.light.color.setHex(litCount === 4 ? PALETTE.whiteCrisp : PALETTE.cyanGlow);
    fountainState.crystal.material.color.setHex(
      litCount === 4 ? PALETTE.whiteCrisp : PALETTE.cyanGlow
    );
    fountainState.crystal.material.emissive.setHex(
      litCount >= 1 ? PALETTE.cyanGlow : PALETTE.primaryTeal
    );
    fountainState.crystal.material.emissiveIntensity = 0.65 + ratio * 1.35;

    // Sync explored sky constellations
    const exploredSet = new Set(state.exploredSkyIds || []);
    for (const id of Object.keys(skyObjects)) {
      skyObjects[id].explored = exploredSet.has(id);
    }
  }

  const colTeal = new THREE.Color(PALETTE.primaryTeal);
  const colCyan = new THREE.Color(PALETTE.cyanGlow);
  const colWhite = new THREE.Color(PALETTE.whiteCrisp);
  const colLanternDim = new THREE.Color(0x14485c);
  const colAccentDim = new THREE.Color(0x0d3c4d);

  function updateShrineMaterials(obj, t) {
    // Lantern lighting up
    obj.lanternGlassMat.color.copy(colLanternDim).lerp(colWhite, t * 0.85);
    obj.lanternGlassMat.emissive.copy(colTeal).lerp(colCyan, t);
    obj.lanternGlassMat.emissiveIntensity = 0.45 + t * 2.15;
    obj.lanternLight.color.copy(colTeal).lerp(colCyan, t);
    obj.lanternLight.intensity = 0.65 + t * 2.65;

    // Beacon shifting to bright cyan (#7CC9E8) with crisp white glow
    obj.beaconMat.color.copy(colTeal).lerp(colCyan, t);
    obj.beaconMat.emissive.copy(colTeal).lerp(colCyan, t);
    obj.beaconMat.emissiveIntensity = 0.85 + t * 1.55;
    obj.beaconHaloMat.color.copy(colTeal).lerp(colWhite, t * 0.75);
    obj.beaconHaloMat.opacity = 0.5 + t * 0.45;
    obj.beaconGlowSprite.material.color.copy(colTeal).lerp(colCyan, t);
    obj.beaconGlowSprite.material.opacity = 0.4 + t * 0.5;

    // Landmark accent shift
    obj.accentMat.color.copy(colTeal).lerp(colCyan, t * 0.85);
    obj.accentMat.emissive.copy(colAccentDim).lerp(colCyan, t * 0.75);
    obj.accentMat.emissiveIntensity = 0.4 + t * 0.95;
  }

  // Apply saved initial progress immediately
  applyVisualState(initialState, { instant: true });

  // --- Smooth Quick-Travel Glide ---
  function travelTo(targetId) {
    const dest =
      targetId === FOUNTAIN.id
        ? FOUNTAIN
        : STATIONS.find((s) => s.id === targetId);
    if (!dest) return;

    const toPos = new THREE.Vector3(dest.travelPos.x, EYE_HEIGHT, dest.travelPos.z);
    const toAngles = computeLookAngles(toPos, dest.lookAt);

    activeGlide = {
      fromPos: playerPos.clone(),
      toPos,
      fromYaw: yaw,
      deltaYaw: shortestAngleDelta(yaw, toAngles.yaw),
      fromPitch: pitch,
      toPitch: toAngles.pitch,
      elapsed: 0,
      duration: 1.05,
    };
  }

  function celebrateAllComplete() {
    spawnSparkBurst(0, 2.2, 0, 75, 4.2);
  }

  const tmpGuideWorldPos = new THREE.Vector3();

  function pulseGuide(stationId) {
    const obj = shrineObjects[stationId];
    if (!obj || !obj.guide) return;
    obj.guide.bounce = 1.0;
    obj.guide.root.getWorldPosition(tmpGuideWorldPos);
    spawnSparkBurst(tmpGuideWorldPos.x, 1.35, tmpGuideWorldPos.z, 14, 1.15);
  }

  /**
   * Smoothly tilts camera upward to gaze at the twilight sky constellations (or returns to horizon).
   */
  function toggleSkyGaze() {
    const currentlyUp = pitch > 0.42;
    activeGlide = {
      fromPos: playerPos.clone(),
      toPos: playerPos.clone(),
      fromYaw: yaw,
      deltaYaw: 0,
      fromPitch: pitch,
      toPitch: currentlyUp ? -0.04 : 0.78,
      elapsed: 0,
      duration: 0.72,
      noArc: true,
    };
    return !currentlyUp;
  }

  /**
   * Smoothly aims the student's gaze at a specific sky constellation star.
   */
  function focusSkyStar(skyId) {
    const obj = skyObjects[skyId];
    if (!obj) return;
    const toAngles = computeLookAngles(playerPos, obj.worldPos);
    activeGlide = {
      fromPos: playerPos.clone(),
      toPos: playerPos.clone(),
      fromYaw: yaw,
      deltaYaw: shortestAngleDelta(yaw, toAngles.yaw),
      fromPitch: pitch,
      toPitch: toAngles.pitch,
      elapsed: 0,
      duration: 0.75,
      noArc: true,
    };
  }

  // --- 3D-to-2D Floating Landmark & Sky Constellation Markers Projection ---
  const projVec = new THREE.Vector3();
  const markerTargets = [
    {
      id: FOUNTAIN.id,
      worldPos: new THREE.Vector3(0, 4.55, 0),
    },
    ...STATIONS.map((s) => ({
      id: s.id,
      worldPos: new THREE.Vector3(s.position.x, 5.85, s.position.z),
    })),
  ];

  function projectMarkers() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (onMarkersUpdate) {
      const results = [];
      for (const item of markerTargets) {
        projVec.copy(item.worldPos);
        const dist = playerPos.distanceTo(item.worldPos);
        projVec.project(camera);
        const inFront = projVec.z < 1 && projVec.z > -1;
        const sx = (projVec.x * 0.5 + 0.5) * width;
        const sy = (-projVec.y * 0.5 + 0.5) * height;
        const onScreen =
          inFront && sx > 24 && sx < width - 24 && sy > 60 && sy < height - 88;
        results.push({
          id: item.id,
          x: sx,
          y: sy,
          visible: onScreen && !controlsPaused && pitch < 0.75,
          distance: dist,
        });
      }
      onMarkersUpdate(results);
    }

    if (onSkyMarkersUpdate) {
      const skyVisibility = THREE.MathUtils.clamp((pitch - 0.16) / 0.28, 0, 1);
      const isLookingUp = pitch > 0.36;
      const skyResults = [];
      for (const item of SKY_INSPIRATIONS) {
        const obj = skyObjects[item.id];
        projVec.copy(obj.worldPos);
        projVec.project(camera);
        const inFront = projVec.z < 1 && projVec.z > -1;
        const sx = (projVec.x * 0.5 + 0.5) * width;
        const sy = (-projVec.y * 0.5 + 0.5) * height;
        const onScreen =
          inFront && sx > 30 && sx < width - 30 && sy > 72 && sy < height - 90;
        skyResults.push({
          id: item.id,
          x: sx,
          y: sy,
          visible: onScreen && !controlsPaused && skyVisibility > 0.05,
          opacity: skyVisibility,
        });
      }
      onSkyMarkersUpdate(skyResults, isLookingUp);
    }

    if (onGuideMarkersUpdate) {
      const guideResults = [];
      for (const station of STATIONS) {
        const obj = shrineObjects[station.id];
        if (!obj || !obj.guide) continue;
        obj.guide.root.getWorldPosition(projVec);
        projVec.y += obj.guide.indicatorY * 1.42 + 0.45;
        const dist = playerPos.distanceTo(projVec);
        projVec.project(camera);
        const inFront = projVec.z < 1 && projVec.z > -1;
        const sx = (projVec.x * 0.5 + 0.5) * width;
        const sy = (-projVec.y * 0.5 + 0.5) * height;
        const onScreen =
          inFront &&
          dist < 26 &&
          sx > 30 &&
          sx < width - 30 &&
          sy > 64 &&
          sy < height - 88;
        guideResults.push({
          id: station.id,
          x: sx,
          y: sy,
          visible: onScreen && !controlsPaused && pitch < 0.72,
          distance: dist,
        });
      }
      onGuideMarkersUpdate(guideResults);
    }
  }

  // --- Resize Handling ---
  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', handleResize);

  // --- Main 60fps Animation Loop ---
  const clock = new THREE.Clock();
  const forwardVec = new THREE.Vector3();
  const rightVec = new THREE.Vector3();
  const moveVec = new THREE.Vector3();
  const tmpScaleVec = new THREE.Vector3();

  function animate() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    // 1. Player Movement or Quick-Travel Glide
    if (!controlsPaused) {
      if (activeGlide) {
        activeGlide.elapsed += dt;
        const rawT = Math.min(activeGlide.elapsed / activeGlide.duration, 1);
        const eased = easeInOutCubic(rawT);
        playerPos.lerpVectors(activeGlide.fromPos, activeGlide.toPos, eased);
        // Subtle serene hover arc during travel glides (flat when tilting gaze upward)
        playerPos.y = activeGlide.noArc
          ? EYE_HEIGHT
          : EYE_HEIGHT + Math.sin(rawT * Math.PI) * 0.32;
        yaw = activeGlide.fromYaw + activeGlide.deltaYaw * eased;
        pitch = THREE.MathUtils.lerp(activeGlide.fromPitch, activeGlide.toPitch, eased);
        if (rawT >= 1) {
          playerPos.y = EYE_HEIGHT;
          activeGlide = null;
        }
      } else {
        moveVec.set(0, 0, 0);
        forwardVec.set(-Math.sin(yaw), 0, -Math.cos(yaw));
        rightVec.set(Math.cos(yaw), 0, -Math.sin(yaw));

        if (keys.forward) moveVec.add(forwardVec);
        if (keys.backward) moveVec.sub(forwardVec);
        if (keys.right) moveVec.add(rightVec);
        if (keys.left) moveVec.sub(rightVec);

        if (moveVec.lengthSq() > 0) {
          moveVec.normalize().multiplyScalar(WALK_SPEED * dt);
          playerPos.x += moveVec.x;
          playerPos.z += moveVec.z;

          // Garden boundary collision (keeps students inside the sanctuary)
          const radialDist = Math.hypot(playerPos.x, playerPos.z);
          if (radialDist > GARDEN_WALK_RADIUS) {
            const scale = GARDEN_WALK_RADIUS / radialDist;
            playerPos.x *= scale;
            playerPos.z *= scale;
          }

          // Obstacle circle collision (Central Fountain & Shrine Monuments)
          for (const obs of obstacles) {
            const dx = playerPos.x - obs.x;
            const dz = playerPos.z - obs.z;
            const d = Math.hypot(dx, dz);
            if (d < obs.r && d > 0.0001) {
              playerPos.x = obs.x + (dx / d) * obs.r;
              playerPos.z = obs.z + (dz / d) * obs.r;
            }
          }

          walkBobPhase += dt * 9.5;
          playerPos.y = EYE_HEIGHT + Math.sin(walkBobPhase) * 0.055;
        } else {
          playerPos.y = THREE.MathUtils.lerp(playerPos.y, EYE_HEIGHT, dt * 8);
        }
      }
    }

    camera.position.copy(playerPos);
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    updateProximity();

    // 2. Central Fountain Animations
    fountainState.crystal.rotation.y = elapsed * (0.7 + fountainState.completedCount * 0.25);
    fountainState.crystal.position.y = 3.22 + Math.sin(elapsed * 2.1) * 0.14;
    fountainState.ring.rotation.x = Math.PI / 2 + Math.sin(elapsed * 1.1) * 0.28;
    fountainState.ring.rotation.y = elapsed * 0.85;
    fountainState.ring.position.y = fountainState.crystal.position.y;

    const rippleT = (elapsed * 0.45) % 1;
    const rippleScale = 0.55 + rippleT * 2.4;
    fountainState.waterRipple.scale.set(rippleScale, rippleScale, 1);
    fountainState.waterRipple.material.opacity = (1 - rippleT) * 0.52;

    // Fountain mist droplets
    const dPos = fountainState.droplets.geometry.attributes.position;
    const boost = fountainState.completedCount === 4 ? 1.55 : 1.0;
    for (let i = 0; i < fountainState.dropletVelocities.length; i++) {
      const dv = fountainState.dropletVelocities[i];
      const t = (elapsed * dv.speed * 0.55 + dv.phase) % 1;
      const r = dv.radius * (0.35 + t * 0.85);
      const swirl = dv.angle + t * (fountainState.completedCount === 4 ? 2.6 : 0.8);
      dPos.setXYZ(
        i,
        Math.cos(swirl) * r,
        0.85 + t * 2.75 * boost,
        Math.sin(swirl) * r
      );
    }
    dPos.needsUpdate = true;

    // 3. Shrine Beacons, Landmarks, Lantern Lighting & Crystal-Tree Growth
    for (const id of Object.keys(shrineObjects)) {
      const obj = shrineObjects[id];

      // Smoothly animate lantern & beacon glow toward target lit state
      const targetVal = obj.lit ? 1 : 0;
      if (Math.abs(obj.lightAnim - targetVal) > 0.002) {
        obj.lightAnim = THREE.MathUtils.lerp(obj.lightAnim, targetVal, dt * 2.8);
        updateShrineMaterials(obj, obj.lightAnim);
      }

      // Smoothly grow the stylized 3D glowing crystal-tree beside the shrine
      if (obj.lit && obj.treeAnim < 1) {
        obj.rewardTree.visible = true;
        obj.treeAnim = Math.min(1, obj.treeAnim + dt * 0.85);
        const s = Math.max(0.001, easeOutBack(obj.treeAnim));
        obj.rewardTree.scale.set(s, s, s);
      } else if (!obj.lit && obj.treeAnim > 0) {
        obj.treeAnim = Math.max(0, obj.treeAnim - dt * 2.5);
        obj.rewardTree.scale.setScalar(Math.max(0.001, obj.treeAnim));
        if (obj.treeAnim <= 0.01) obj.rewardTree.visible = false;
      }

      if (obj.rewardTree.visible) {
        obj.rewardTree.rotation.y = Math.sin(elapsed * 0.55 + obj.station.zoneNumber) * 0.05;
      }

      // Beacon float & hover pulse
      const bob = Math.sin(elapsed * 2.2 + obj.station.zoneNumber * 1.4) * 0.18;
      obj.beaconGroup.position.y = 4.95 + bob;
      obj.beaconOrb.rotation.y = elapsed * (obj.lit ? 1.4 : 0.75);
      obj.beaconHalo.rotation.x = Math.PI / 2 + Math.sin(elapsed * 1.3 + obj.station.zoneNumber) * 0.45;
      obj.beaconHalo.rotation.y = elapsed * 0.9;

      const targetHoverScale = obj.hovered ? 1.24 : 1.0;
      tmpScaleVec.setScalar(targetHoverScale);
      obj.beaconGroup.scale.lerp(tmpScaleVec, dt * 8);

      // Unique monument animations
      for (const part of obj.animatedParts) {
        if (part.type === 'spinY') {
          part.mesh.rotation.y = elapsed * part.speed;
        } else if (part.type === 'spinXY') {
          part.mesh.rotation.x = Math.PI / 3 + elapsed * part.speed * 0.5;
          part.mesh.rotation.y = -elapsed * part.speed;
        } else if (part.type === 'pulseFlame') {
          const pulse = 1 + Math.sin(elapsed * 4.2) * 0.08;
          part.mesh.scale.set(0.85 * pulse, 1.45 * (1 + Math.cos(elapsed * 3.5) * 0.1), 0.85 * pulse);
          part.mesh.rotation.y = elapsed * 0.9;
        }
      }

      // 3D Animal Guide Idle, Head-Tracking & Talking Bounce Animation
      if (obj.guide) {
        const g = obj.guide;
        if (g.bounce > 0) {
          g.bounce = Math.max(0, g.bounce - dt * 2.1);
        }
        const hop = Math.sin(g.bounce * Math.PI) * 0.28;
        const breathe = Math.sin(elapsed * 2.4 + obj.station.zoneNumber) * 0.028;
        g.actor.position.y = g.baseActorY + breathe + hop;

        // Wagging tails (Husky, Fox, Stag)
        if (g.tailMesh) {
          const wagSpeed = obj.lit || g.bounce > 0 ? 11.5 : 4.2;
          const wagAmp = obj.lit || g.bounce > 0 ? 0.42 : 0.2;
          g.tailMesh.rotation.y = Math.sin(elapsed * wagSpeed + obj.station.zoneNumber) * wagAmp;
        }

        // Fluttering Owl wings when talking or lit
        if (g.wingL && g.wingR) {
          const flap = g.bounce > 0 ? Math.sin(g.bounce * Math.PI * 3) * 0.34 : Math.sin(elapsed * 2.2) * 0.04;
          g.wingL.rotation.z = -0.28 - Math.abs(flap);
          g.wingR.rotation.z = 0.28 + Math.abs(flap);
        }

        // Smooth head-turn toward the student when nearby
        g.root.getWorldPosition(tmpGuideWorldPos);
        const distToStudent = playerPos.distanceTo(tmpGuideWorldPos);
        let targetHeadYaw = Math.sin(elapsed * 0.9 + obj.station.zoneNumber) * 0.14;
        if (distToStudent < 13) {
          const angleWorld = Math.atan2(
            playerPos.x - tmpGuideWorldPos.x,
            playerPos.z - tmpGuideWorldPos.z
          );
          const guideWorldYaw = obj.group.rotation.y + g.root.rotation.y;
          targetHeadYaw = THREE.MathUtils.clamp(
            shortestAngleDelta(guideWorldYaw, angleWorld),
            -0.85,
            0.85
          );
        }
        g.headGroup.rotation.y = THREE.MathUtils.lerp(g.headGroup.rotation.y, targetHeadYaw, dt * 5);

        // Floating golden/cyan chat-sparkle above guide's head
        g.chatOrb.position.y = g.indicatorY + Math.sin(elapsed * 3.1 + obj.station.zoneNumber) * 0.09 + hop * 0.6;
        g.chatOrb.rotation.y = elapsed * 2.0;
        const orbScale = g.hovered ? 1.45 : distToStudent < 10 ? 1.2 : 0.95;
        tmpScaleVec.setScalar(orbScale);
        g.chatOrb.scale.lerp(tmpScaleVec, dt * 8);
        const guideGlowHex = obj.lit ? PALETTE.cyanGlow : 0xffe29e;
        g.chatOrb.material.color.setHex(guideGlowHex);
        g.groundRingMat.color.setHex(guideGlowHex);
        g.auraSprite.material.color.setHex(guideGlowHex);
        g.auraSprite.material.opacity = (g.hovered ? 0.62 : 0.4) + Math.sin(elapsed * 2.5 + obj.station.zoneNumber) * 0.08;
      }
    }

    // 4. Floating Fireflies
    const ffAttr = fireflies.geometry.attributes.position;
    for (let i = 0; i < fireflyCount; i++) {
      const b = fireflyBase[i];
      const t = elapsed * b.speed + b.phase;
      ffAttr.setXYZ(
        i,
        b.x + Math.sin(t) * b.drift,
        b.y + Math.sin(t * 1.35) * 0.42,
        b.z + Math.cos(t * 0.9) * b.drift
      );
    }
    ffAttr.needsUpdate = true;

    // 4b. Sky Constellations Twinkle & Shooting Star
    for (const id of Object.keys(skyObjects)) {
      const s = skyObjects[id];
      const twinkle = 0.88 + Math.sin(elapsed * 2.1 + s.phase) * 0.14;
      const targetScale = (s.hovered ? 1.35 : 1.0) * twinkle;
      tmpScaleVec.setScalar(targetScale);
      s.group.scale.lerp(tmpScaleVec, dt * 7);
      s.coreStar.rotation.z = elapsed * 0.45 + s.phase;
      if (s.ringMesh) {
        s.ringMesh.rotation.x = Math.sin(elapsed * 0.9 + s.phase) * 0.55;
        s.ringMesh.rotation.y = elapsed * 0.65;
      }
      s.haloSprite.material.opacity = (s.explored ? 0.92 : 0.68) * twinkle;
    }
    updateShootingStar(dt);

    // 5. Celebration Spark Bursts
    if (burstParticles.length > 0) {
      const bpAttr = burstPoints.geometry.attributes.position;
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const p = burstParticles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          burstParticles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy *= 0.985;
      }
      for (let i = 0; i < maxBurst; i++) {
        if (i < burstParticles.length) {
          const p = burstParticles[i];
          bpAttr.setXYZ(i, p.x, p.y, p.z);
        } else {
          bpAttr.setXYZ(i, 0, -999, 0);
        }
      }
      bpAttr.needsUpdate = true;
    }

    renderer.render(scene, camera);
    projectMarkers();
  }

  renderer.setAnimationLoop(animate);

  return {
    travelTo,
    toggleSkyGaze,
    focusSkyStar,
    pulseGuide,
    syncState(state, options = {}) {
      applyVisualState(state, options);
    },
    celebrateAllComplete,
    setControlsPaused(paused) {
      controlsPaused = paused;
      if (paused) {
        clearKeys();
        isDragging = false;
        if (document.pointerLockElement === canvas) {
          document.exitPointerLock();
        }
      }
    },
    togglePointerLock() {
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      } else if (canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    },
  };
}
