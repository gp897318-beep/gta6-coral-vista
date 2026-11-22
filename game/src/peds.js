// CORAL VISTA — pedestrians and traffic: a living beachfront city.
import * as THREE from 'three';
import { mulberry32 } from './config.js';

const SHIRTS = [0xff4f6d, 0x19d3c5, 0xffd23d, 0x4d8dff, 0xff4fd8, 0x2aff7a, 0xff9e3d, 0xffffff, 0xb44dff];
const PANTS = [0x2b2b38, 0x3d5a80, 0x6b4423, 0xdddddd, 0x1c2733];

export function makePedMesh(rng) {
  const g = new THREE.Group();
  const shirt = SHIRTS[Math.floor(rng() * SHIRTS.length)];
  const pants = PANTS[Math.floor(rng() * PANTS.length)];
  const skin = [0xf2c9a0, 0xc98a5a, 0x8a5a2b, 0xf7d7b0][Math.floor(rng() * 4)];
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.32),
    new THREE.MeshLambertMaterial({ color: shirt }));
  body.position.y = 1.05; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8),
    new THREE.MeshLambertMaterial({ color: skin }));
  head.position.y = 1.72; head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 6, 0, Math.PI * 2, 0, 1.4),
    new THREE.MeshLambertMaterial({ color: [0x1a1a1a, 0x6b4423, 0xffd23d, 0xdddddd][Math.floor(rng() * 4)] }));
  hair.position.y = 1.78; g.add(hair);
  const legs = [];
  for (const sx of [-0.14, 0.14]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22),
      new THREE.MeshLambertMaterial({ color: pants }));
    leg.position.set(sx, 0.35, 0); g.add(leg); legs.push(leg);
  }
  const arms = [];
  for (const sx of [-0.36, 0.36]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.18),
      new THREE.MeshLambertMaterial({ color: skin }));
    arm.position.set(sx, 1.05, 0); g.add(arm); arms.push(arm);
  }
  g.userData.legs = legs; g.userData.arms = arms;
  return g;
}

export function spawnPeds(scene, count, seed) {
  const rng = mulberry32(seed);
  const peds = [];
  for (let i = 0; i < count; i++) {
    const mesh = makePedMesh(rng);
    let x, z;
    if (i < count * 0.45) {
      // beach crowd
      x = 160 + rng() * 38; z = (rng() - 0.5) * 420;
    } else {
      // sidewalks: beside a street
      const sx = [-120, -60, 0, 60, 120, 168][Math.floor(rng() * 6)];
      x = sx + (rng() < 0.5 ? -8.5 : 8.5) + (rng() - 0.5) * 2;
      z = (rng() - 0.5) * 420;
    }
    mesh.position.set(x, 0, z);
    mesh.rotation.y = rng() * Math.PI * 2;
    scene.add(mesh);
    peds.push({
      mesh, x, z, heading: rng() * Math.PI * 2,
      speed: 0.9 + rng() * 0.9, walkPhase: rng() * 10,
      fleeing: false, fleeT: 0, targetX: x, targetZ: z,
      beach: x > 158,
    });
  }
  return peds;
}

export function updatePeds(peds, dt, playerPos, gunfireAt) {
  for (const p of peds) {
    const dx = p.x - playerPos.x, dz = p.z - playerPos.z;
    const d2 = dx * dx + dz * dz;
    if (gunfireAt && d2 < 90 * 90) { p.fleeing = true; p.fleeT = 4; }
    if (d2 < 6 * 6) { p.fleeing = true; p.fleeT = 2.5; }
    let speed = p.speed;
    if (p.fleeing) {
      speed = 4.2; p.fleeT -= dt;
      if (p.fleeT <= 0) p.fleeing = false;
      const len = Math.sqrt(d2) || 1;
      p.heading = Math.atan2(dx / len, dz / len);
    } else if (Math.hypot(p.targetX - p.x, p.targetZ - p.z) < 2) {
      if (p.beach) { p.targetX = 160 + Math.random() * 38; p.targetZ = (Math.random() - 0.5) * 420; }
      else {
        const sx = [-120, -60, 0, 60, 120, 168][Math.floor(Math.random() * 6)];
        p.targetX = sx + (Math.random() < 0.5 ? -8.5 : 8.5);
        p.targetZ = (Math.random() - 0.5) * 420;
      }
      p.heading = Math.atan2(p.targetX - p.x, p.targetZ - p.z);
    } else {
      p.heading = Math.atan2(p.targetX - p.x, p.targetZ - p.z);
    }
    p.x += Math.sin(p.heading) * speed * dt;
    p.z += Math.cos(p.heading) * speed * dt;
    p.x = Math.max(-235, Math.min(200, p.x));
    p.z = Math.max(-235, Math.min(235, p.z));
    p.mesh.position.set(p.x, 0, p.z);
    p.mesh.rotation.y = p.heading;
    p.walkPhase += dt * speed * 5;
    const swing = Math.sin(p.walkPhase) * 0.55;
    p.mesh.userData.legs[0].rotation.x = swing;
    p.mesh.userData.legs[1].rotation.x = -swing;
    p.mesh.userData.arms[0].rotation.x = -swing * 0.8;
    p.mesh.userData.arms[1].rotation.x = swing * 0.8;
  }
}

// --- traffic: cars looping the street grid ---
export function spawnTraffic(scene, count, seed, makeCar) {
  const rng = mulberry32(seed);
  const traffic = [];
  const lanes = [];
  for (const x of [-120, -60, 0, 60, 120, 168]) { lanes.push({ axis: 'z', fixed: x, dir: 1 }); lanes.push({ axis: 'z', fixed: x, dir: -1 }); }
  for (const z of [-120, -60, 0, 60, 120]) { lanes.push({ axis: 'x', fixed: z, dir: 1 }); lanes.push({ axis: 'x', fixed: z, dir: -1 }); }
  const colors = [0xff4f3d, 0x19d3c5, 0xffd23d, 0xf2f2f2, 0x4d8dff, 0xff9e3d, 0x2aff7a, 0xb44dff];
  for (let i = 0; i < count; i++) {
    const lane = lanes[Math.floor(rng() * lanes.length)];
    const mesh = makeCar('traffic', colors[Math.floor(rng() * colors.length)]);
    scene.add(mesh);
    const off = (rng() - 0.5) * 2;
    const along = (rng() - 0.5) * 460;
    traffic.push({
      mesh, lane, off, along,
      speed: 7 + rng() * 6,
      x: lane.axis === 'z' ? lane.fixed + (lane.dir > 0 ? 2.8 : -2.8) + off * 0.3 : along,
      z: lane.axis === 'x' ? lane.fixed + (lane.dir > 0 ? 2.8 : -2.8) + off * 0.3 : along,
    });
  }
  return traffic;
}

export function updateTraffic(traffic, dt) {
  for (const t of traffic) {
    if (t.dead) continue;
    t.along += t.lane.dir * t.speed * dt;
    if (t.along > 235) t.along = -235;
    if (t.along < -235) t.along = 235;
    if (t.lane.axis === 'z') {
      t.x = t.lane.fixed + (t.lane.dir > 0 ? 2.8 : -2.8);
      t.z = t.along;
      t.mesh.rotation.y = t.lane.dir > 0 ? 0 : Math.PI;
    } else {
      t.z = t.lane.fixed + (t.lane.dir > 0 ? 2.8 : -2.8);
      t.x = t.along;
      t.mesh.rotation.y = t.lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    t.mesh.position.set(t.x, 0, t.z);
    const spin = t.speed * dt * 2.4;
    for (const w of t.mesh.userData.wheels) w.rotation.x += spin;
  }
}
