// CORAL VISTA — vehicles: sleek low sports cars, cruisers, SWAT van, Air One heli, wrecks.
import * as THREE from 'three';

function lam(color, emissive = 0, intensity = 0) {
  return new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: intensity });
}

export function makeCarMesh(model, colorHex, opts = {}) {
  const g = new THREE.Group();
  const paint = lam(colorHex);
  const glass = new THREE.MeshLambertMaterial({ color: 0x101828, emissive: 0x224466, emissiveIntensity: 0.5 });
  const dark = lam(0x16161f);
  // sleek low body: long nose, tapered tail
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 4.6), paint);
  body.position.y = 0.42; body.castShadow = true; g.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.3, 1.1), paint);
  nose.position.set(0, 0.36, 2.4); nose.castShadow = true; g.add(nose);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 2.0), glass);
  cabin.position.set(0, 0.8, -0.3); cabin.castShadow = true; g.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.7), paint);
  roof.position.set(0, 1.02, -0.35); g.add(roof);
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.35), dark);
  spoiler.position.set(0, 0.72, -2.25); g.add(spoiler);
  // headlights + taillights
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff6c9 });
  for (const sx of [-0.62, 0.62]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.06), hl);
    h.position.set(sx, 0.45, 2.96); g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xff2a3d }));
    t.position.set(sx, 0.48, -2.32); g.add(t);
  }
  // wheels: dark rims with bright hub
  const wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 12);
  const hubGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.3, 8);
  for (const [wx, wz] of [[-0.85, 1.55], [0.85, 1.55], [-0.85, -1.55], [0.85, -1.55]]) {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, dark); tire.rotation.z = Math.PI / 2; w.add(tire);
    const hub = new THREE.Mesh(hubGeo, new THREE.MeshLambertMaterial({ color: 0xdfe6ff }));
    hub.rotation.z = Math.PI / 2; w.add(hub);
    w.position.set(wx, 0.36, wz); g.add(w); wheels.push(w);
  }
  if (opts.police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.4), lam(0x111111));
    bar.position.set(0, 1.1, -0.3); g.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.42),
      new THREE.MeshBasicMaterial({ color: 0xff2233 }));
    red.position.set(-0.28, 1.1, -0.3); g.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.42),
      new THREE.MeshBasicMaterial({ color: 0x2266ff }));
    blue.position.set(0.28, 1.1, -0.3); g.add(blue);
    g.userData.lightBar = { red, blue };
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.2, 4.62),
      new THREE.MeshBasicMaterial({ color: 0x2266ff }));
    stripe.position.y = 0.44; g.add(stripe);
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    badge.position.set(0, 0.66, 2.31); badge.rotation.x = 0; g.add(badge);
  }
  g.userData.wheels = wheels;
  return g;
}

export function makeSwatVan() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.2, 5.2), lam(0x1c2733));
  body.position.y = 1.4; body.castShadow = true; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.2), lam(0x1c2733));
  cab.position.set(0, 1.0, 3.0); g.add(cab);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.4, 5.22),
    new THREE.MeshBasicMaterial({ color: 0xff2233 }));
  stripe.position.y = 1.1; g.add(stripe);
  const word = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.8),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  word.position.set(0, 2.0, 2.62); g.add(word);
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
  for (const [wx, wz] of [[-1.0, 1.8], [1.0, 1.8], [-1.0, -1.8], [1.0, -1.8]]) {
    const w = new THREE.Mesh(wheelGeo, lam(0x111111));
    w.rotation.z = Math.PI / 2; w.position.set(wx, 0.42, wz); g.add(w);
  }
  return g;
}

export function makeHeli() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), lam(0x2b3a55));
  body.scale.set(1, 0.85, 1.7); body.position.y = 0; body.castShadow = true; g.add(body);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0x9ff5ff, emissive: 0x226677, emissiveIntensity: 0.7 }));
  glass.position.set(0, -0.1, 1.3); glass.scale.set(0.9, 0.7, 0.9); g.add(glass);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 4.2), lam(0x2b3a55));
  tail.position.set(0, 0.2, -3.2); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.9), lam(0xff2233));
  fin.position.set(0, 0.8, -5.0); g.add(fin);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6), lam(0x111111));
  mast.position.y = 1.5; g.add(mast);
  const rotor = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.06, 0.4), lam(0x111111));
    blade.rotation.y = (i * Math.PI) / 2; rotor.add(blade);
  }
  rotor.position.y = 1.9; g.add(rotor);
  g.userData.rotor = rotor;
  // spotlight cone: big white translucent cone + ground pool
  const coneGeo = new THREE.ConeGeometry(5, 26, 20, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfff8d0, transparent: true, opacity: 0.32,
    side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.y = -13; cone.rotation.x = Math.PI; // apex up at heli
  g.add(cone);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(9, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff8d0, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = -25.4; g.add(pool);
  g.userData.spotCone = cone; g.userData.spotPool = pool;
  // searchlight bulb
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  bulb.position.set(0, -1.2, 1.0); g.add(bulb);
  return g;
}

// Burning wreck: charred car + flame sprites + smoke + flickering light.
export function makeFireTexture(kind) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  const grad = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  if (kind === 'fire') {
    grad.addColorStop(0, 'rgba(255,255,220,1)');
    grad.addColorStop(0.35, 'rgba(255,180,40,0.95)');
    grad.addColorStop(0.7, 'rgba(255,60,10,0.6)');
    grad.addColorStop(1, 'rgba(255,40,0,0)');
  } else {
    grad.addColorStop(0, 'rgba(40,40,46,0.85)');
    grad.addColorStop(0.6, 'rgba(30,30,34,0.45)');
    grad.addColorStop(1, 'rgba(20,20,24,0)');
  }
  x.fillStyle = grad; x.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export function makeWreck(scene, x, z, heading, fireTex, smokeTex) {
  const g = new THREE.Group();
  const car = makeCarMesh('wreck', 0x2a2a30);
  car.rotation.y = 0.4; car.scale.y = 0.75;
  car.traverse((o) => { if (o.isMesh) o.material = lam(0x23232a); });
  g.add(car);
  const flames = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    s.position.set((Math.random() - 0.5) * 2, 1 + Math.random() * 1.2, (Math.random() - 0.5) * 3);
    s.scale.set(2.5 + Math.random() * 2, 3.5 + Math.random() * 2, 1);
    g.add(s); flames.push(s);
  }
  const smokes = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0.7 }));
    s.position.set((Math.random() - 0.5) * 1.5, 3 + i * 1.4, (Math.random() - 0.5) * 1.5);
    s.scale.set(3 + i, 3 + i, 1);
    g.add(s); smokes.push(s);
  }
  const light = new THREE.PointLight(0xff7722, 60, 30, 1.6);
  light.position.y = 2.5; g.add(light);
  g.position.set(x, 0, z); g.rotation.y = heading;
  scene.add(g);
  return { group: g, flames, smokes, light, t: Math.random() * 10 };
}

export function updateWreck(w, dt) {
  w.t += dt;
  for (let i = 0; i < w.flames.length; i++) {
    const f = w.flames[i];
    const s = 1 + Math.sin(w.t * 9 + i * 2.1) * 0.25;
    f.scale.set((2.5 + (i % 3)) * s, (3.5 + (i % 2)) * (1 + Math.sin(w.t * 7 + i) * 0.3), 1);
    f.material.opacity = 0.75 + Math.sin(w.t * 11 + i * 3) * 0.2;
  }
  for (let i = 0; i < w.smokes.length; i++) {
    const s = w.smokes[i];
    s.position.y = 3 + i * 1.4 + ((w.t * 0.9 + i) % 6);
    s.material.opacity = Math.max(0, 0.7 - ((w.t * 0.9 + i) % 6) * 0.1);
  }
  w.light.intensity = 50 + Math.sin(w.t * 13) * 18 + Math.sin(w.t * 29) * 8;
}

// Big explosion fireball used in the cover staging.
export function makeFireball(scene, x, y, z, fireTex) {
  const g = new THREE.Group();
  const core = new THREE.Sprite(new THREE.SpriteMaterial({
    map: fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  core.scale.set(11, 11, 1); g.add(core);
  const outer = new THREE.Sprite(new THREE.SpriteMaterial({
    map: fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6,
  }));
  outer.scale.set(18, 16, 1); g.add(outer);
  const light = new THREE.PointLight(0xff8833, 200, 60, 1.4);
  g.add(light);
  g.position.set(x, y, z); scene.add(g);
  return { group: g, core, outer, light, t: 0 };
}

export function updateFireball(f, dt) {
  f.t += dt;
  const pulse = 1 + Math.sin(f.t * 6) * 0.12;
  f.core.scale.set(11 * pulse, 11 * pulse, 1);
  f.outer.scale.set(18 * (1 + Math.sin(f.t * 4) * 0.08), 16, 1);
  f.light.intensity = 180 + Math.sin(f.t * 9) * 40;
}
