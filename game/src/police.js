// CORAL VISTA — police: wanted stars, named dispatch, cruisers, Air One heli, SWAT, roadblocks.
import * as THREE from 'three';
import { DISPATCH_CALLSIGNS, DISPATCH_ROLES } from './config.js';
import { makeCarMesh, makeSwatVan, makeHeli, makeWreck } from './vehicles.js';

export function createPolice(scene) {
  return {
    wanted: 0, heat: 0, units: [], heli: null, heliActive: false,
    swat: null, roadblock: null, roadblockAt: null,
    loseTimer: 0, eyesOutUntil: 0, lastSpawn: 0,
  };
}

export function addHeat(G, amount) {
  const pol = G.police;
  pol.heat = Math.min(5, pol.heat + amount);
  const stars = Math.ceil(pol.heat - 0.001);
  if (stars !== pol.wanted) {
    pol.wanted = stars;
    G.hud.flash(stars >= 5 ? 'FIVE STARS — FULL RESPONSE!' : stars + ' STAR WANTED LEVEL');
    G.audio.siren(stars > 0);
  }
  pol.loseTimer = 0;
}

export function spawnUnit(G, kind) {
  const pol = G.police;
  const p = G.player;
  const angle = Math.random() * Math.PI * 2;
  const dist = 45 + Math.random() * 30;
  const x = Math.max(-225, Math.min(225, p.x + Math.sin(angle) * dist));
  const z = Math.max(-225, Math.min(225, p.z + Math.cos(angle) * dist));
  const callsign = DISPATCH_CALLSIGNS[pol.units.length % DISPATCH_CALLSIGNS.length];
  if (kind === 'heli') {
    const heli = makeHeli();
    heli.position.set(p.x + 14, 26, p.z - 22);
    G.scene.add(heli);
    pol.heli = { mesh: heli, x: p.x + 14, z: p.z - 22, y: 26, callsign: 'AIR ONE', role: 'SPOTLIGHT' };
    pol.heliActive = true;
    return pol.heli;
  }
  if (kind === 'swat') {
    const mesh = makeSwatVan();
    G.scene.add(mesh);
    const u = { mesh, kind: 'swat', x, z, heading: 0, speed: 0, hp: 220, callsign: 'SWAT-1', role: 'RAMMING', burning: false, dead: false };
    pol.units.push(u);
    return u;
  }
  const mesh = makeCarMesh('cruiser', 0xf2f2f2, { police: true });
  G.scene.add(mesh);
  const u = {
    mesh, kind: 'cruiser', x, z, heading: 0, speed: 0, hp: 90,
    callsign, role: DISPATCH_ROLES[Math.floor(Math.random() * DISPATCH_ROLES.length)],
    burning: false, dead: false, ramCd: 0,
  };
  pol.units.push(u);
  return u;
}

export function igniteCar(G, car) {
  car.burning = true; car.hp = 0;
  const wreck = makeWreck(G.scene, car.x, car.z, car.heading || 0, G.effects.fireTex, G.effects.smokeTex);
  G.effects.wrecks.push(wreck);
  if (car.mesh) { car.mesh.visible = false; car.dead = true; }
  G.audio.explosion();
  addHeat(G, 0.4);
}

export function updatePolice(G, dt) {
  const pol = G.police;
  const p = G.player;
  // wanted decay when quiet
  if (pol.wanted > 0) {
    const decay = performance.now() < pol.eyesOutUntil ? 2.2 : 1;
    if (!p.inCar || Math.abs(p.car ? p.car.speed : 0) < 2) pol.loseTimer += dt * decay;
    else pol.loseTimer = Math.max(0, pol.loseTimer - dt * 0.5);
    if (pol.loseTimer > 14) {
      pol.wanted = Math.max(0, pol.wanted - 1);
      pol.heat = pol.wanted;
      pol.loseTimer = 0;
      if (pol.wanted === 0) { G.audio.siren(false); G.hud.flash('HEAT LOST — YOU VANISHED'); }
    }
  }
  // target unit count by wanted level
  const wantUnits = pol.wanted === 0 ? 0 : pol.wanted === 1 ? 1 : pol.wanted === 2 ? 2 : pol.wanted === 3 ? 3 : pol.wanted === 4 ? 4 : 5;
  if (pol.units.length < wantUnits && performance.now() - pol.lastSpawn > 1200) {
    spawnUnit(G, 'cruiser');
    pol.lastSpawn = performance.now();
  }
  // heli at 3+
  if (pol.wanted >= 3 && !pol.heliActive) spawnUnit(G, 'heli');
  if (pol.wanted < 3 && pol.heliActive && pol.heli) {
    G.scene.remove(pol.heli.mesh); pol.heli = null; pol.heliActive = false;
  }
  // SWAT at 5
  if (pol.wanted >= 5 && !pol.swat) pol.swat = spawnUnit(G, 'swat');
  if (pol.wanted < 5 && pol.swat) {
    const i = pol.units.indexOf(pol.swat);
    if (i >= 0) pol.units.splice(i, 1);
    G.scene.remove(pol.swat.mesh); pol.swat = null;
  }
  // roadblock ahead at 3+
  if (pol.wanted >= 3 && !pol.roadblock && p.inCar) {
    const ahead = 55;
    const bx = p.x + Math.sin(p.heading) * ahead;
    const bz = p.z + Math.cos(p.heading) * ahead;
    const group = new THREE.Group();
    for (let i = -1; i <= 1; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 0.5),
        new THREE.MeshLambertMaterial({ color: i === 0 ? 0xff2233 : 0xffffff }));
      bar.position.set(i * 2.6, 0.55, 0);
      bar.rotation.y = p.heading + Math.PI / 2;
      group.add(bar);
    }
    const cruiser = makeCarMesh('cruiser', 0xf2f2f2, { police: true });
    cruiser.position.set(6, 0, 2); cruiser.rotation.y = p.heading + Math.PI;
    group.add(cruiser);
    group.position.set(bx, 0, bz);
    G.scene.add(group);
    pol.roadblock = { group, x: bx, z: bz, cruiser };
    pol.roadblockAt = { x: bx, z: bz };
  }
  if (pol.roadblock) {
    const d = Math.hypot(p.x - pol.roadblock.x, p.z - pol.roadblock.z);
    if (d > 160 || pol.wanted < 3) {
      G.scene.remove(pol.roadblock.group);
      pol.roadblock = null; pol.roadblockAt = null;
    }
  }
  // chase units
  for (const u of [...pol.units]) {
    if (u.dead) continue;
    const dx = p.x - u.x, dz = p.z - u.z;
    const dist = Math.hypot(dx, dz) || 1;
    const targetHeading = Math.atan2(dx, dz);
    let dh = targetHeading - u.heading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    u.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, dh));
    const top = u.kind === 'swat' ? 20 : 24 + pol.wanted * 1.5;
    u.speed = Math.min(top, u.speed + 14 * dt);
    if (dist < 4) {
      u.speed *= 0.9;
      u.ramCd -= dt;
      if (u.ramCd <= 0 && p.inCar && p.car) {
        p.car.condition = Math.max(0, p.car.condition - 6);
        u.hp -= 6; u.ramCd = 1.2;
        G.audio.crash();
        G.hud.flash(u.callsign + ' RAMMING!');
      }
    }
    u.x += Math.sin(u.heading) * u.speed * dt;
    u.z += Math.cos(u.heading) * u.speed * dt;
    u.mesh.position.set(u.x, 0, u.z);
    u.mesh.rotation.y = u.heading;
    const spin = u.speed * dt * 2.4;
    if (u.mesh.userData.wheels) for (const w of u.mesh.userData.wheels) w.rotation.x += spin;
    // light bar flash
    if (u.mesh.userData.lightBar) {
      const on = Math.floor(performance.now() / 180) % 2 === 0;
      u.mesh.userData.lightBar.red.material.color.setHex(on ? 0xff2233 : 0x550000);
      u.mesh.userData.lightBar.blue.material.color.setHex(on ? 0x001155 : 0x2266ff);
    }
    if (u.hp <= 0 && !u.burning) igniteCar(G, u);
    if (dist > 190) { // too far: respawn closer
      u.x = p.x + Math.sin(Math.random() * 6.28) * 55;
      u.z = p.z + Math.cos(Math.random() * 6.28) * 55;
    }
    u.dist = dist;
  }
  // heli follows + spotlight tracks player
  if (pol.heliActive && pol.heli) {
    const h = pol.heli;
    const tx = p.x + 14, tz = p.z - 22;
    h.x += (tx - h.x) * dt * 0.8;
    h.z += (tz - h.z) * dt * 0.8;
    const hy = (h.y || 26) + Math.sin(performance.now() / 700) * 1.0;
    h.mesh.position.set(h.x, hy, h.z);
    h.mesh.rotation.y += dt * 0.4;
    h.mesh.userData.rotor.rotation.y += dt * 22;
    // aim cone at player; scale cone/pool to the hover height
    const dx = p.x - h.x, dz = p.z - h.z;
    h.mesh.userData.spotCone.rotation.z = Math.atan2(dx, hy) * 0.5;
    h.mesh.userData.spotCone.rotation.x = Math.PI - Math.atan2(dz, hy) * 0.5;
    h.mesh.userData.spotCone.scale.y = hy / 26;
    h.mesh.userData.spotPool.position.y = -hy + 0.7;
    h.dist = Math.hypot(dx, dz);
  }
  // prune dead units (their wreck stays on the street)
  pol.units = pol.units.filter((u) => !u.dead);
}

export function dispatchList(G) {
  const pol = G.police;
  const list = [];
  for (const u of pol.units.slice(0, 6)) {
    list.push({ name: u.callsign, dist: Math.round(u.dist || 40), status: u.role });
  }
  if (pol.heliActive && pol.heli) list.push({ name: 'AIR ONE', dist: Math.round(pol.heli.dist || 36), status: 'SPOTLIGHT' });
  if (pol.roadblockAt) list.push({ name: 'BULWARK-2', dist: Math.round(Math.hypot(G.player.x - pol.roadblockAt.x, G.player.z - pol.roadblockAt.z)), status: 'ROADBLOCK' });
  return list;
}
