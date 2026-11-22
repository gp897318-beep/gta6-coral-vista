// CORAL VISTA — player: on-foot movement, driving, carjacking, combat.
import * as THREE from 'three';
import { WEAPONS, CARS } from './config.js';
import { makeCarMesh } from './vehicles.js';
import { collideCircle } from './world.js';
import { addHeat, igniteCar } from './police.js';
import { onWreckDone } from './missions.js';
import { shootTracer, sparks } from './effects.js';

export function createPlayer(scene) {
  const g = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ color: 0xf2c9a0 });
  const jacket = new THREE.MeshLambertMaterial({ color: 0xff4f6d });
  const pants = new THREE.MeshLambertMaterial({ color: 0x2b2b38 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.34), jacket);
  body.position.y = 1.05; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), skin);
  head.position.y = 1.74; head.castShadow = true; g.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.29, 0.12, 10),
    new THREE.MeshLambertMaterial({ color: 0x19d3c5 }));
  cap.position.y = 1.92; g.add(cap);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.3),
    new THREE.MeshLambertMaterial({ color: 0x19d3c5 }));
  brim.position.set(0, 1.88, 0.3); g.add(brim);
  const legs = [];
  for (const sx of [-0.15, 0.15]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.24), pants);
    leg.position.set(sx, 0.36, 0); g.add(leg); legs.push(leg);
  }
  const arms = [];
  for (const sx of [-0.38, 0.38]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.66, 0.19), jacket);
    arm.position.set(sx, 1.05, 0); g.add(arm); arms.push(arm);
  }
  // held weapon (visible pistol)
  const gun = new THREE.Group();
  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.42),
    new THREE.MeshLambertMaterial({ color: 0x16161f }));
  gun.add(gunBody);
  gun.position.set(0.38, 1.0, 0.3); g.add(gun);
  scene.add(g);
  return {
    mesh: g, legs, arms, gun,
    x: 0, z: 20, heading: 0, speed: 0,
    inCar: false, car: null, carModel: 0,
    walkPhase: 0, health: 100, armor: 55,
    weaponIdx: 1, ammo: WEAPONS.map((w) => w.ammo), mag: WEAPONS.map((w) => w.mag),
    lastShot: 0, shooting: false,
  };
}

export function enterCar(G, carObj) {
  const p = G.player;
  p.inCar = true; p.car = carObj; p.carModel = carObj.modelIdx || 0;
  p.mesh.visible = false;
  carObj.driver = p;
  G.audio.engine(true);
}

export function exitCar(G) {
  const p = G.player;
  if (!p.car) return;
  p.inCar = false;
  p.x = p.car.x + Math.sin(p.car.heading + Math.PI / 2) * 2.5;
  p.z = p.car.z + Math.cos(p.car.heading + Math.PI / 2) * 2.5;
  p.heading = p.car.heading;
  p.mesh.visible = true;
  p.car.driver = null;
  p.car = null;
  G.audio.engine(false);
}

export function nearestCar(G, maxDist) {
  let best = null; let bd = maxDist;
  for (const c of G.cars) {
    if (c.dead) continue;
    const d = Math.hypot(c.x - G.player.x, c.z - G.player.z);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

export function updatePlayer(G, dt, input) {
  const p = G.player;
  if (p.inCar && p.car) {
    updateDriving(G, dt, input);
    return;
  }
  // on foot
  const camYaw = G.cameraYaw;
  let fx = 0, fz = 0;
  if (input.keys['KeyW'] || input.keys['ArrowUp']) { fx += Math.sin(camYaw); fz += Math.cos(camYaw); }
  if (input.keys['KeyS'] || input.keys['ArrowDown']) { fx -= Math.sin(camYaw); fz -= Math.cos(camYaw); }
  if (input.keys['KeyA'] || input.keys['ArrowLeft']) { fx += Math.sin(camYaw - Math.PI / 2); fz += Math.cos(camYaw - Math.PI / 2); }
  if (input.keys['KeyD'] || input.keys['ArrowRight']) { fx += Math.sin(camYaw + Math.PI / 2); fz += Math.cos(camYaw + Math.PI / 2); }
  const len = Math.hypot(fx, fz);
  const run = input.keys['ShiftLeft'] || input.keys['ShiftRight'];
  const speed = run ? 7.5 : 4.6;
  if (len > 0) {
    fx /= len; fz /= len;
    const nx = p.x + fx * speed * dt, nz = p.z + fz * speed * dt;
    if (!collideCircle(G.world.colliders, nx, p.z, 0.7)) p.x = nx;
    if (!collideCircle(G.world.colliders, p.x, nz, 0.7)) p.z = nz;
    p.heading = Math.atan2(fx, fz);
    p.walkPhase += dt * speed * 2.2;
    p.speed = speed;
  } else p.speed = 0;
  p.x = Math.max(-235, Math.min(235, p.x));
  p.z = Math.max(-235, Math.min(235, p.z));
  p.mesh.position.set(p.x, 0, p.z);
  p.mesh.rotation.y = p.heading;
  const swing = Math.sin(p.walkPhase) * (p.speed > 0 ? 0.6 : 0);
  p.legs[0].rotation.x = swing; p.legs[1].rotation.x = -swing;
  p.arms[0].rotation.x = -swing * 0.7; p.arms[1].rotation.x = swing * 0.7;
  // weapon visibility
  p.gun.visible = p.weaponIdx > 0;
  // enter car
  if (input.pressed('KeyE')) {
    const car = nearestCar(G, 4.5);
    if (car) {
      if (car.driver && car.driver !== p) { /* jacked: driver flees */ }
      enterCar(G, car);
      G.hud.flash('STOLE THE ' + CARS[car.modelIdx].name);
      G.audio.carjack();
    }
  }
  // shooting on foot (queued click fires even on a slow frame)
  if ((input.mouseDown || input.shootQueued) && performance.now() - p.lastShot > (p.weaponIdx === 2 || p.weaponIdx === 4 ? 110 : 320)) {
    input.shootQueued = false;
    fireWeapon(G);
  } else if (!input.mouseDown) input.shootQueued = false;
}

function updateDriving(G, dt, input) {
  const p = G.player; const car = p.car;
  const model = CARS[car.modelIdx];
  const upg = G.upgrades;
  const top = model.top * (upg.engine ? 1.18 : 1) * 0.62; // m/s
  const accel = model.accel * (upg.engine ? 1.15 : 1);
  let throttle = 0;
  if (input.keys['KeyW'] || input.keys['ArrowUp']) throttle = 1;
  if (input.keys['KeyS'] || input.keys['ArrowDown']) throttle = -1;
  if (throttle > 0) car.speed += accel * dt;
  else if (throttle < 0) car.speed -= (car.speed > 0.5 ? 30 : 12) * dt;
  else car.speed -= Math.sign(car.speed) * 8 * dt;
  if (Math.abs(car.speed) < 0.2 && throttle === 0) car.speed = 0;
  car.speed = Math.max(-12, Math.min(top, car.speed));
  const steer = (input.keys['KeyA'] || input.keys['ArrowLeft'] ? 1 : 0) - (input.keys['KeyD'] || input.keys['ArrowRight'] ? 1 : 0);
  const grip = model.grip * (upg.tires ? 1.15 : 1);
  if (Math.abs(car.speed) > 0.5) {
    car.heading += steer * 1.9 * grip * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 8);
  }
  const nx = car.x + Math.sin(car.heading) * car.speed * dt;
  const nz = car.z + Math.cos(car.heading) * car.speed * dt;
  const hit = collideCircle(G.world.colliders, nx, nz, 1.6);
  if (hit) {
    car.speed *= -0.25;
    car.condition = Math.max(0, car.condition - 4);
    if (car.condition < 30 && Math.random() < 0.3) G.audio.crash();
    else G.audio.crash();
  } else {
    car.x = nx; car.z = nz;
  }
  car.x = Math.max(-238, Math.min(238, car.x));
  car.z = Math.max(-238, Math.min(238, car.z));
  // car-car bumps
  for (const other of G.cars) {
    if (other === car || other.dead) continue;
    const d = Math.hypot(other.x - car.x, other.z - car.z);
    if (d < 3.4 && d > 0.01) {
      const push = (3.4 - d) * 0.5;
      const ax = (other.x - car.x) / d, az = (other.z - car.z) / d;
      other.x += ax * push; other.z += az * push;
      if (Math.abs(car.speed) > 8) {
        other.hp -= 12; car.condition = Math.max(0, car.condition - 2);
        if (other.hp <= 0 && !other.burning) igniteCar(G, other);
        G.audio.crash();
      }
    }
  }
  // stunt jumps
  for (const j of G.stunts) {
    if (!j.done && Math.hypot(car.x - j.x, car.z - j.z) < 4 && Math.abs(car.speed) > 18) {
      j.done = true;
      G.money += 250; G.respect += 15;
      G.hud.flash('STUNT JUMP: ' + j.name + '  +$250');
      G.audio.stunt();
    }
  }
  car.mesh.position.set(car.x, 0, car.z);
  car.mesh.rotation.y = car.heading;
  const spin = car.speed * dt * 2.4;
  for (const w of car.mesh.userData.wheels) w.rotation.x += spin;
  // body lean
  car.mesh.rotation.z = -steer * Math.min(0.06, Math.abs(car.speed) * 0.002);
  p.x = car.x; p.z = car.z; p.heading = car.heading;
  G.audio.setEngine(car.speed / top);
  if (input.pressed('KeyE')) exitCar(G);
  if (input.pressed('Space')) { car.speed *= (1 - 3.5 * dt); }
  if ((input.mouseDown || input.shootQueued) && performance.now() - p.lastShot > (p.weaponIdx === 2 || p.weaponIdx === 4 ? 110 : 320)) {
    input.shootQueued = false;
    fireWeapon(G);
  } else if (!input.mouseDown) input.shootQueued = false;
}

export function fireWeapon(G) {
  const p = G.player;
  const w = WEAPONS[p.weaponIdx];
  if (p.weaponIdx > 0) {
    if (p.mag[p.weaponIdx] <= 0) { G.audio.click(); p.lastShot = performance.now(); return; }
    p.mag[p.weaponIdx]--;
    if (p.mag[p.weaponIdx] === 0 && p.ammo[p.weaponIdx] > 0) {
      const take = Math.min(w.mag, p.ammo[p.weaponIdx]);
      p.ammo[p.weaponIdx] -= take; p.mag[p.weaponIdx] = take;
    }
  }
  p.lastShot = performance.now();
  G.audio.shoot(p.weaponIdx);
  addHeat(G, p.weaponIdx === 0 ? 0.2 : 0.7);
  G.lastGunfire = { x: p.x, z: p.z, t: performance.now() };
  // tracer + muzzle flash (cheap line + sprite)
  const from = new THREE.Vector3(p.x, 1.4, p.z);
  const dir = new THREE.Vector3(Math.sin(p.heading), 0, Math.cos(p.heading));
  const to = from.clone().add(dir.multiplyScalar(26));
  shootTracer(G, from, to);
  // hit nearest police / traffic car in front
  let best = null; let bd = 30;
  for (const c of G.cars) {
    if (c === p.car) continue;
    const dx = c.x - p.x, dz = c.z - p.z;
    const d = Math.hypot(dx, dz);
    const dot = (dx * Math.sin(p.heading) + dz * Math.cos(p.heading)) / (d || 1);
    if (d < bd && dot > 0.85) { bd = d; best = c; }
  }
  if (best) {
    best.hp -= w.dmg;
    sparks(G, best.x, 1, best.z);
    if (best.hp <= 0 && !best.burning) {
      igniteCar(G, best);
      G.money += 100;
      G.hud.flash('TARGET WRECKED  +$100');
    }
  }
  // mission wreck targets
  if (G.missions.wreckTarget && !G.missions.wreckTarget.dead) {
    const t = G.missions.wreckTarget;
    const d = Math.hypot(t.x - p.x, t.z - p.z);
    if (d < 30) {
      t.hp -= w.dmg;
      if (t.hp <= 0) onWreckDone(G);
    }
  }
}
