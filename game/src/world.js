// CORAL VISTA — world builder: sun-soaked coastal city, beach, sea, palms, neon.
import * as THREE from 'three';
import { CITY, DISTRICTS, mulberry32 } from './config.js';

const PALETTE = [0xff6f91, 0x19d3c5, 0xff9e3d, 0xffd23d, 0x4d8dff, 0xff4fd8, 0x2aff7a, 0xff8a5c];
const ROOF = [0xff4f6d, 0x19b8a6, 0xffb03d, 0x7a5cff];

function box(w, h, d, color, x, y, z, opts = {}) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color, emissive: opts.emissive || 0x000000, emissiveIntensity: opts.glow || 0 }),
  );
  m.position.set(x, y, z);
  if (opts.ry) m.rotation.y = opts.ry;
  m.castShadow = !!opts.shadow;
  m.receiveShadow = true;
  return m;
}

function makePalm(scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14 * scale, 0.22 * scale, 4.6 * scale, 6),
    new THREE.MeshLambertMaterial({ color: 0x8a5a2b }),
  );
  trunk.position.y = 2.3 * scale; trunk.castShadow = true;
  g.add(trunk);
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x1fae4e, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.55 * scale, 2.6 * scale, 4), leafMat);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.9 * scale, 4.7 * scale, Math.sin(a) * 0.9 * scale);
    leaf.rotation.z = Math.cos(a) * 1.15;
    leaf.rotation.x = -Math.sin(a) * 1.15;
    g.add(leaf);
  }
  const nut = new THREE.Mesh(new THREE.SphereGeometry(0.3 * scale, 6, 5),
    new THREE.MeshLambertMaterial({ color: 0x6b4423 }));
  nut.position.y = 4.5 * scale; g.add(nut);
  return g;
}

function makeUmbrella(color) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6),
    new THREE.MeshLambertMaterial({ color: 0xffffff }));
  pole.position.y = 1.1; g.add(pole);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 8),
    new THREE.MeshLambertMaterial({ color }));
  top.position.y = 2.4; g.add(top);
  const towel = box(1.1, 0.08, 1.8, 0xff4fd8, 0.9, 0.06, 0.4);
  g.add(towel);
  return g;
}

export function buildWorld(scene, rng) {
  const colliders = [];
  const addCollider = (x, z, hx, hz) => colliders.push({ x, z, hx, hz });

  // --- sky: vivid gradient dome (pink-purple top, orange horizon) ---
  const skyGeo = new THREE.SphereGeometry(900, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, fog: false, depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x7a4fd0) },
      mid: { value: new THREE.Color(0xff6f9e) },
      bot: { value: new THREE.Color(0xffb03d) },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot;
      void main(){ float h=normalize(vP).y; vec3 c = h>0.25 ? mix(mid,top,smoothstep(0.25,0.9,h)) : mix(bot,mid,smoothstep(-0.05,0.25,h));
      gl_FragColor=vec4(c,1.0); }`,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // --- sun disc + clouds ---
  const sun = new THREE.Mesh(new THREE.CircleGeometry(34, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, fog: false }));
  sun.position.set(-420, 190, -620); sun.lookAt(0, 60, 0); scene.add(sun);
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffd9ec, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(6 + rng() * 7, 8, 6), cloudMat);
      s.position.set(j * 8 - 8, rng() * 2, rng() * 4); s.scale.y = 0.45; c.add(s);
    }
    c.position.set((rng() - 0.5) * 700, 120 + rng() * 70, (rng() - 0.5) * 700);
    scene.add(c);
  }

  // --- ground: city slab, sand beach, teal sea ---
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(560, 560),
    new THREE.MeshLambertMaterial({ color: 0x6a6780 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(70, 560),
    new THREE.MeshLambertMaterial({ color: 0xffd98a }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(CITY.sandX0 + 20, 0.06, 0); sand.receiveShadow = true; scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(320, 560),
    new THREE.MeshLambertMaterial({ color: 0x00b8c9, emissive: 0x006a7a, emissiveIntensity: 0.35 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(CITY.seaX + 155, 0.02, 0); scene.add(sea);
  // sea sparkle strips
  for (let i = 0; i < 26; i++) {
    const s = box(6 + rng() * 14, 0.05, 0.7, 0x9ff5ff, CITY.seaX + 20 + rng() * 220, 0.08, (rng() - 0.5) * 500);
    s.material = new THREE.MeshBasicMaterial({ color: 0x9ff5ff, transparent: true, opacity: 0.55 });
    scene.add(s);
  }
  // boardwalk
  const walk = box(10, 0.3, 560, 0xc98a4b, CITY.sandX0 - 3, 0.15, 0);
  scene.add(walk);

  // --- roads: grid + beach boulevard, with yellow centre lines ---
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x454552 });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffd23d });
  const roads = [];
  for (const x of [-120, -60, 0, 60, 120]) roads.push({ x, z: 0, w: 12, len: 480, along: 'z' });
  for (const z of [-120, -60, 0, 60, 120]) roads.push({ x: 0, z, w: 12, len: 480, along: 'x' });
  roads.push({ x: CITY.boulevardX, z: 0, w: 16, len: 480, along: 'z' });
  for (const r of roads) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r.along === 'z' ? r.w : r.len, r.along === 'z' ? r.len : r.w), roadMat);
    m.rotation.x = -Math.PI / 2; m.position.set(r.x, 0.1, r.z); m.receiveShadow = true; scene.add(m);
    for (let d = -220; d <= 220; d += 16) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 4), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(r.along === 'z' ? r.x : d, 0.14, r.along === 'z' ? d : r.z);
      scene.add(dash);
    }
  }
  // crosswalks on the boulevard
  for (const z of [-100, -40, 20, 80, 140]) {
    for (let i = -3; i <= 3; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.4),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
      s.rotation.x = -Math.PI / 2; s.position.set(CITY.boulevardX + i * 2.3, 0.13, z);
      scene.add(s);
    }
  }

  // --- buildings: vivid pastel blocks with neon signs + lit windows ---
  const streets = [-120, -60, 0, 60, 120];
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffe9a3 });
  const winMat2 = new THREE.MeshBasicMaterial({ color: 0x9ff5ff });
  let bi = 0;
  for (const bx of [-150, -90, -30, 30, 90]) {
    for (const bz of [-150, -90, -30, 30, 90]) {
      if (Math.abs(bx - 120) < 5 && Math.abs(bz) < 130) continue;
      const h = 8 + rng() * 26;
      const color = PALETTE[bi % PALETTE.length]; bi++;
      const b = box(26, h, 26, color, bx, h / 2, bz, { shadow: true });
      scene.add(b); addCollider(bx, bz, 14, 14);
      const roof = box(27, 1.2, 27, ROOF[bi % ROOF.length], bx, h + 0.6, bz);
      scene.add(roof);
      // windows
      const floors = Math.floor(h / 4);
      for (let f = 0; f < floors; f++) {
        for (let w = -1; w <= 1; w++) {
          if (rng() < 0.35) continue;
          const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), rng() < 0.5 ? winMat : winMat2);
          win.position.set(bx + w * 7, 3 + f * 4, bz + 13.1); scene.add(win);
          const win2 = win.clone(); win2.position.z = bz - 13.1; win2.rotation.y = Math.PI; scene.add(win2);
          const win3 = win.clone(); win3.position.set(bx + 13.1, 3 + f * 4, bz + w * 7); win3.rotation.y = Math.PI / 2; scene.add(win3);
          const win4 = win.clone(); win4.position.set(bx - 13.1, 3 + f * 4, bz + w * 7); win4.rotation.y = -Math.PI / 2; scene.add(win4);
        }
      }
      // neon sign on some buildings
      if (rng() < 0.55) {
        const signColors = [0xff4fd8, 0x19d3c5, 0xffd23d, 0xff6f3d];
        const sign = box(10 + rng() * 6, 1.6, 0.5, 0x111111, bx, h * 0.72, bz + 13.4,
          { emissive: signColors[bi % 4], glow: 1 });
        sign.material = new THREE.MeshBasicMaterial({ color: signColors[bi % 4] });
        scene.add(sign);
      }
      // rooftop AC / antenna
      if (rng() < 0.5) scene.add(box(3, 1.6, 3, 0xdddddd, bx + 6, h + 2, bz - 5));
    }
  }
  // marina towers (tall, glassy) near the bay
  for (let i = 0; i < 3; i++) {
    const h = 42 + i * 9;
    const t = box(20, h, 20, i === 1 ? 0x4d8dff : 0x19d3c5, 120, h / 2, -150 + i * 30, { shadow: true });
    scene.add(t); addCollider(120, -150 + i * 30, 11, 11);
    scene.add(box(21, 1.4, 21, 0xffd23d, 120, h + 0.7, -150 + i * 30));
  }

  // --- palms along boulevard + sidewalks ---
  const palms = [];
  for (let z = -230; z <= 230; z += 18) {
    for (const x of [CITY.boulevardX - 12, CITY.boulevardX + 12]) {
      if (rng() < 0.15) continue;
      const p = makePalm(0.9 + rng() * 0.5); p.position.set(x + (rng() - 0.5) * 3, 0, z + (rng() - 0.5) * 4);
      scene.add(p); palms.push(p);
    }
  }
  for (const sx of streets) for (let z = -210; z <= 210; z += 42) {
    if (rng() < 0.5) continue;
    const p = makePalm(0.8 + rng() * 0.4); p.position.set(sx + 9, 0, z); scene.add(p);
  }
  // beach palms + umbrellas + towels + beachgoers spots
  const beachProps = [];
  for (let z = -210; z <= 210; z += 26) {
    if (rng() < 0.3) continue;
    const u = makeUmbrella(PALETTE[Math.floor(rng() * PALETTE.length)]);
    u.position.set(CITY.sandX0 + 8 + rng() * 26, 0, z + (rng() - 0.5) * 8);
    scene.add(u); beachProps.push(u);
  }

  // --- pier into the sea ---
  const pier = box(8, 1, 90, 0x8a5a2b, 235, 0.6, -60);
  scene.add(pier);
  for (let z = -100; z <= -20; z += 12) scene.add(box(0.4, 3, 0.4, 0xdddddd, 231, 2.2, z));
  const ferris = new THREE.Group();
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(11, 0.7, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xff4fd8 }));
  ferris.add(wheel);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const cab = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6),
      new THREE.MeshLambertMaterial({ color: PALETTE[i % PALETTE.length] }));
    cab.position.set(Math.cos(a) * 11, Math.sin(a) * 11, 0); ferris.add(cab);
  }
  ferris.position.set(238, 16, -60); scene.add(ferris);

  // --- garage (Strand) + district markers ---
  const garage = new THREE.Group();
  garage.add(box(22, 9, 16, 0xff9e3d, 0, 4.5, 0));
  garage.add(box(23, 1, 17, 0x2b2b38, 0, 9.4, 0));
  const door = box(14, 6.5, 0.4, 0x3d3a4d, 0, 3.4, 8.1, { emissive: 0x19d3c5, glow: 0.6 });
  garage.add(door);
  const gsign = box(16, 2, 0.5, 0x111111, 0, 8, 8.2, { emissive: 0xffd23d, glow: 1 });
  gsign.material = new THREE.MeshBasicMaterial({ color: 0xffd23d });
  garage.add(gsign);
  garage.position.set(150, 0, 40);
  scene.add(garage); addCollider(150, 40, 12, 9);

  // street lamps along boulevard
  for (let z = -220; z <= 220; z += 30) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7, 6),
      new THREE.MeshLambertMaterial({ color: 0x222233 }));
    pole.position.set(CITY.boulevardX - 9, 3.5, z); scene.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe9a3 }));
    lamp.position.set(CITY.boulevardX - 9, 7.1, z); scene.add(lamp);
  }

  // --- lighting: golden-hour sun + warm hemisphere ---
  const sunLight = new THREE.DirectionalLight(0xffb36b, 2.4);
  sunLight.position.set(-180, 120, -260);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -260; sunLight.shadow.camera.right = 260;
  sunLight.shadow.camera.top = 260; sunLight.shadow.camera.bottom = -260;
  sunLight.shadow.camera.far = 900;
  scene.add(sunLight);
  scene.add(new THREE.HemisphereLight(0xff9ec7, 0x2a4a5a, 1.45));
  scene.fog = new THREE.Fog(0xff9e7a, 260, 720);

  return { colliders, garagePos: { x: 150, z: 40 }, pierPos: { x: 235, z: -60 }, ferris, palms, beachProps };
}

export function collideCircle(colliders, x, z, r) {
  for (const c of colliders) {
    const dx = Math.max(Math.abs(x - c.x) - c.hx, 0);
    const dz = Math.max(Math.abs(z - c.z) - c.hz, 0);
    if (dx * dx + dz * dz < r * r) return c;
  }
  return null;
}
