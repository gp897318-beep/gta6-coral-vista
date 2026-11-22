// CORAL VISTA — story missions, side activities, packages, races.
import { MISSIONS, PACKAGE_SPOTS, STUNT_JUMPS } from './config.js';
import { makeCarMesh } from './vehicles.js';
import { addBeacon, removeBeacon } from './effects.js';
import { igniteCar } from './police.js';

export function createMissions() {
  return {
    index: 0, active: null, stageIdx: 0, stageT: 0, beacon: null,
    wreckTarget: null, race: null, taxi: null, courier: null,
    packages: 0, packagesFound: new Set(), completed: 0,
  };
}

export function startMission(G, idx) {
  const m = MISSIONS[idx];
  if (!m) return;
  const M = G.missions;
  M.active = m; M.index = idx; M.stageIdx = 0; M.stageT = 0;
  G.hud.showDialogue(m.fixer, m.role, m.brief);
  G.hud.flash('MISSION ' + m.id + '/10 — ' + m.title);
  G.audio.missionStart();
  setStage(G);
}

function setStage(G) {
  const M = G.missions;
  const stage = M.active.stages[M.stageIdx];
  if (!stage) { completeMission(G); return; }
  if (M.beacon) removeBeacon(G, M.beacon);
  M.beacon = null;
  M.stageT = 0;
  if (stage.kind === 'goto') M.beacon = addBeacon(G, stage.x, stage.z, 0xffd23d);
  if (stage.kind === 'wreck') spawnWreckTarget(G, stage);
  if (stage.kind === 'race') startRace(G, stage);
}

function spawnWreckTarget(G, stage) {
  const p = G.player;
  const color = stage.target === 'limo' ? 0x1a1a22 : 0xff4f3d;
  const mesh = makeCarMesh(stage.target, color);
  const x = p.x + 30, z = p.z + 10;
  mesh.position.set(x, 0, z);
  G.scene.add(mesh);
  const car = { mesh, x, z, heading: 0, speed: 0, hp: stage.hp, modelIdx: 1, burning: false, dead: false, target: true };
  G.cars.push(car);
  G.missions.wreckTarget = car;
  G.missions.beacon = addBeacon(G, x, z, 0xff2233);
  // target flees along the boulevard
  car.flee = true;
}

export function onWreckDone(G) {
  const M = G.missions;
  if (M.wreckTarget) {
    igniteCar(G, M.wreckTarget);
    M.wreckTarget = null;
  }
  advanceStage(G);
}

function startRace(G, stage) {
  const pts = [
    { x: -120, z: 120 }, { x: 0, z: 120 }, { x: 120, z: 120 }, { x: 168, z: 60 },
    { x: 168, z: -60 }, { x: 120, z: -120 }, { x: 0, z: -120 }, { x: -120, z: -120 },
  ];
  G.missions.race = { pts, idx: 0, t: 0, rivals: [] };
  G.missions.beacon = addBeacon(G, pts[0].x, pts[0].z, 0x2aff7a);
  G.hud.flash('RACE — follow the green beacons!');
}

function advanceStage(G) {
  const M = G.missions;
  M.stageIdx++;
  if (M.stageIdx >= M.active.stages.length) completeMission(G);
  else setStage(G);
}

function completeMission(G) {
  const M = G.missions;
  const m = M.active;
  G.money += m.pay;
  G.respect += 120;
  M.completed++;
  G.hud.showDialogue(m.fixer, m.role, 'Clean work. $' + m.pay.toLocaleString() + ' is yours. Next job is waiting.');
  G.hud.flash('MISSION COMPLETE  +$' + m.pay.toLocaleString());
  G.audio.missionDone();
  G.save();
  if (M.beacon) { removeBeacon(G, M.beacon); M.beacon = null; }
  M.active = null; M.wreckTarget = null; M.race = null;
  if (M.index + 1 < MISSIONS.length) startMission(G, M.index + 1);
  else G.hud.flash('ALL 10 MISSIONS COMPLETE — CORAL VISTA IS YOURS!');
}

export function updateMissions(G, dt) {
  const M = G.missions;
  const p = G.player;
  if (!M.active) return;
  const stage = M.active.stages[M.stageIdx];
  if (!stage) return;
  M.stageT += dt;
  if (stage.kind === 'goto') {
    const d = Math.hypot(p.x - stage.x, p.z - stage.z);
    if (d < stage.r) advanceStage(G);
  } else if (stage.kind === 'lose') {
    if (G.police.wanted === 0) {
      M.stageT += dt * 2;
      if (M.stageT > stage.secs) advanceStage(G);
    } else M.stageT = Math.max(0, M.stageT - dt);
  } else if (stage.kind === 'wanted') {
    if (G.police.wanted >= stage.stars) advanceStage(G);
  } else if (stage.kind === 'survive') {
    if (M.stageT > stage.secs) advanceStage(G);
  } else if (stage.kind === 'wreck') {
    const t = M.wreckTarget;
    if (t) {
      // flee along boulevard
      t.z -= 14 * dt;
      if (t.z < -220) t.z = 220;
      t.x = 150 + Math.sin(t.z / 40) * 8;
      t.mesh.position.set(t.x, 0, t.z);
      t.mesh.rotation.y = Math.PI;
      if (M.beacon) { removeBeacon(G, M.beacon); M.beacon = addBeacon(G, t.x, t.z, 0xff2233); }
      // ram damage from player car
      if (p.inCar && p.car) {
        const d = Math.hypot(t.x - p.x, t.z - p.z);
        if (d < 3.6 && Math.abs(p.car.speed) > 6) {
          t.hp -= 22; G.audio.crash();
          if (t.hp <= 0) onWreckDone(G);
        }
      }
    }
  } else if (stage.kind === 'race') {
    const r = M.race;
    if (!r) return;
    r.t += dt;
    const pt = r.pts[r.idx];
    const d = Math.hypot(p.x - pt.x, p.z - pt.z);
    if (d < 12) {
      r.idx++;
      if (r.idx >= r.pts.length) {
        G.hud.flash('RACE WON!  +$1,500');
        G.money += 1500; G.respect += 150;
        advanceStage(G);
        return;
      }
      if (M.beacon) removeBeacon(G, M.beacon);
      M.beacon = addBeacon(G, r.pts[r.idx].x, r.pts[r.idx].z, 0x2aff7a);
    }
  }
}

// --- side activities ---
export function startTaxi(G) {
  if (G.missions.taxi) return;
  const spots = [[-60, -60], [60, 60], [120, 0], [-120, 0], [168, 120]];
  const dest = spots[Math.floor(Math.random() * spots.length)];
  G.missions.taxi = { x: dest[0], z: dest[1], t: 60 };
  G.missions.beacon = addBeacon(G, dest[0], dest[1], 0x19d3c5);
  G.hud.flash('TAXI FARE — drop the passenger off (60s)');
}

export function updateSide(G, dt) {
  const M = G.missions;
  const p = G.player;
  // taxi
  if (M.taxi) {
    M.taxi.t -= dt;
    if (Math.hypot(p.x - M.taxi.x, p.z - M.taxi.z) < 9) {
      G.money += 180; G.respect += 10;
      G.hud.flash('FARE COMPLETE  +$180');
      if (M.beacon && !M.active) { removeBeacon(G, M.beacon); M.beacon = null; }
      M.taxi = null;
    } else if (M.taxi.t <= 0) {
      G.hud.flash('TAXI FARE LOST');
      if (M.beacon && !M.active) { removeBeacon(G, M.beacon); M.beacon = null; }
      M.taxi = null;
    }
  }
  // hidden packages
  for (let i = 0; i < PACKAGE_SPOTS.length; i++) {
    if (M.packagesFound.has(i)) continue;
    const [x, z] = PACKAGE_SPOTS[i];
    if (Math.hypot(p.x - x, p.z - z) < 3) {
      M.packagesFound.add(i); M.packages++;
      G.money += 300; G.respect += 20;
      G.hud.flash('HIDDEN PACKAGE ' + M.packages + '/12  +$300');
      G.audio.pickup();
      G.save();
    }
  }
}

export function packageMarkers(G) {
  return PACKAGE_SPOTS.map(([x, z], i) => ({ x, z, found: G.missions.packagesFound.has(i) }));
}

export function stuntList() { return STUNT_JUMPS; }
