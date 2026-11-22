// CORAL VISTA — effects: tracers, sparks, wrecks, fireballs, beacons.
import * as THREE from 'three';
import { makeFireTexture, makeWreck, makeFireball, updateWreck, updateFireball } from './vehicles.js';

export function createEffects(scene) {
  const fireTex = makeFireTexture('fire');
  const smokeTex = makeFireTexture('smoke');
  return { scene, fireTex, smokeTex, wrecks: [], fireballs: [], tracers: [], sparks: [], beacons: [] };
}

export function shootTracer(G, from, to) {
  const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe9a3, transparent: true, opacity: 0.95 }));
  G.scene.add(line);
  G.effects.tracers.push({ line, t: 0 });
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: G.effects.fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  flash.position.copy(from); flash.scale.set(1.6, 1.6, 1);
  G.scene.add(flash);
  G.effects.tracers.push({ line: flash, t: 0, sprite: true });
}

export function sparks(G, x, y, z) {
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: G.effects.fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    s.position.set(x + (Math.random() - 0.5) * 1.5, y + Math.random(), z + (Math.random() - 0.5) * 1.5);
    s.scale.set(0.7, 0.7, 1);
    G.scene.add(s);
    G.effects.sparks.push({ sprite: s, t: 0, vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 4 });
  }
}

export function addBeacon(G, x, z, color = 0xffd23d) {
  const geo = new THREE.CylinderGeometry(1.6, 1.6, 30, 12, 1, true);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const cyl = new THREE.Mesh(geo, mat);
  cyl.position.set(x, 15, z);
  G.scene.add(cyl);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.5, 3.6, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.15, z);
  G.scene.add(ring);
  const b = { cyl, ring, x, z, t: 0 };
  G.effects.beacons.push(b);
  return b;
}

export function removeBeacon(G, b) {
  if (!b) return;
  G.scene.remove(b.cyl); G.scene.remove(b.ring);
  G.effects.beacons = G.effects.beacons.filter((x) => x !== b);
}

export function updateEffects(G, dt) {
  const fx = G.effects;
  for (const w of fx.wrecks) updateWreck(w, dt);
  for (const f of fx.fireballs) updateFireball(f, dt);
  for (const t of [...fx.tracers]) {
    t.t += dt;
    if (t.sprite) t.line.material.opacity = Math.max(0, 0.9 - t.t * 6);
    else t.line.material.opacity = Math.max(0, 0.95 - t.t * 8);
    if (t.t > 0.14) { G.scene.remove(t.line); fx.tracers = fx.tracers.filter((x) => x !== t); }
  }
  for (const s of [...fx.sparks]) {
    s.t += dt;
    s.sprite.position.x += s.vx * dt;
    s.sprite.position.y += s.vy * dt;
    s.sprite.position.z += s.vz * dt;
    s.sprite.material.opacity = Math.max(0, 0.9 - s.t * 3);
    if (s.t > 0.35) { G.scene.remove(s.sprite); fx.sparks = fx.sparks.filter((x) => x !== s); }
  }
  for (const b of fx.beacons) {
    b.t += dt;
    const s = 1 + Math.sin(b.t * 4) * 0.15;
    b.ring.scale.set(s, s, 1);
    b.cyl.material.opacity = 0.3 + Math.sin(b.t * 4) * 0.1;
  }
}
