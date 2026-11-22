// CORAL VISTA — bootstrap, game loop, camera, input, save, weather, crew, garage.
import * as THREE from 'three';
import { CITY, CARS, WEAPONS, RADIO, MISSIONS, mulberry32 } from './config.js';
import { buildWorld } from './world.js';
import { makeCarMesh } from './vehicles.js';
import { spawnPeds, updatePeds, spawnTraffic, updateTraffic } from './peds.js';
import { createPlayer, updatePlayer, enterCar, nearestCar } from './player.js';
import { createPolice, updatePolice, addHeat } from './police.js';
import { createMissions, startMission, updateMissions, updateSide, startTaxi } from './missions.js';
import { createEffects, updateEffects } from './effects.js';
import { createHud, buildGarageList } from './hud.js';
import { createAudio } from './audio.js';
import { applyShot } from './shots.js';

const SAVE_KEY = 'coral-vista-save-v1';

function makeInput() {
  const input = { keys: {}, mouseDown: false, shootQueued: false, _pressed: new Set() };
  input.pressed = (code) => {
    if (input._pressed.has(code)) { input._pressed.delete(code); return true; }
    return false;
  };
  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (!input.keys[e.code]) input._pressed.add(e.code);
    input.keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => { input.keys[e.code] = false; });
  window.addEventListener('mousedown', (e) => {
    if (e.target === document.getElementById('game-canvas')) { input.mouseDown = true; input.shootQueued = true; }
  });
  window.addEventListener('mouseup', () => { input.mouseDown = false; });
  return input;
}

function createRain(scene) {
  const count = 900;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 160;
    pos[i * 3 + 1] = Math.random() * 40;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 160;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0x9fd8ff, size: 0.35, transparent: true, opacity: 0.6 });
  const pts = new THREE.Points(geo, mat);
  pts.visible = false;
  pts.position.set(0, 0, 0);
  scene.add(pts);
  return pts;
}

export function boot() {
  const canvas = document.getElementById('game-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 8, -14);

  const G = {
    scene, camera, renderer,
    clockHour: CITY.sunsetHour, money: 6420, respect: 390, respectLevel: 2,
    upgrades: {}, crewCd: {}, started: false, paused: false,
    rain: false, timeScale: 1, lastGunfire: null,
    cameraYaw: Math.PI, cameraPitch: 0.32, camDist: 10.5,
    stunts: [
      { x: 60, z: 0, name: 'Neon Ramp', done: false },
      { x: 120, z: 60, name: 'Marina Leap', done: false },
      { x: 168, z: 90, name: 'Strand Flyer', done: false },
    ],
  };
  G.audio = createAudio();
  G.world = buildWorld(scene, mulberry32(20261122));
  G.player = createPlayer(scene);
  G.police = createPolice(scene);
  G.missions = createMissions();
  G.effects = createEffects(scene);
  G.hud = createHud(G);
  G.rainPts = createRain(scene);
  G.input = makeInput();
  G.cars = [];
  // player car + nearby parked cars
  const parked = [
    { model: 0, x: 168, z: 30, h: Math.PI }, { model: 1, x: 150, z: 60, h: 0.4 },
    { model: 4, x: -114, z: 100, h: 0.8 }, { model: 2, x: 60, z: -52, h: 1.6 },
    { model: 5, x: -60, z: 52, h: 2.2 }, { model: 7, x: 120, z: -110, h: 0 },
    { model: 3, x: 30, z: 60, h: 2.6 }, { model: 6, x: -30, z: -60, h: 1.1 },
  ];
  for (const pk of parked) {
    const mesh = makeCarMesh(CARS[pk.model].id, CARS[pk.model].color);
    mesh.position.set(pk.x, 0, pk.z); mesh.rotation.y = pk.h;
    scene.add(mesh);
    G.cars.push({ mesh, x: pk.x, z: pk.z, heading: pk.h, speed: 0, hp: 100, condition: 100, modelIdx: pk.model, burning: false, dead: false, driver: null });
  }
  G.peds = spawnPeds(scene, 48, 777);
  G.traffic = spawnTraffic(scene, 16, 4242, (id, color) => makeCarMesh(id, color));
  G.traffic.forEach((t) => { t.hp = 100; t.burning = false; t.dead = false; G.cars.push(t); });

  // --- save / load ---
  G.save = function () {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        money: G.money, respect: G.respect, completed: G.missions.completed,
        packages: [...G.missions.packagesFound], upgrades: G.upgrades,
        x: G.player.x, z: G.player.z, clockHour: G.clockHour, radioIdx: G.audio.radioIdx,
      }));
      const el = document.getElementById('save-msg');
      if (el) { el.textContent = '✓ SAVED'; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 1600); }
    } catch (e) { /* storage unavailable */ }
  };
  G.load = function () {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      G.money = s.money; G.respect = s.respect; G.missions.completed = s.completed;
      G.missions.packagesFound = new Set(s.packages || []);
      G.missions.packages = G.missions.packagesFound.size;
      G.upgrades = s.upgrades || {};
      G.player.x = s.x || 0; G.player.z = s.z || 20;
      G.clockHour = s.clockHour || CITY.sunsetHour;
      G.audio.radioIdx = s.radioIdx || 0;
      return true;
    } catch (e) { return false; }
  };

  // --- UI wiring ---
  const $ = (id) => document.getElementById(id);
  $('start-btn').addEventListener('click', () => {
    G.audio.ensure();
    G.started = true;
    $('start-screen').classList.remove('show');
    G.audio.radio(G.audio.radioIdx, true);
    G.hud.setRadio(G.audio.radioIdx);
    if (G.missions.completed === 0 && !G.missions.active) startMission(G, 0);
    G.hud.flash('WELCOME TO CORAL VISTA — MISSION 1: FIRST FARE');
  });
  $('load-btn').addEventListener('click', () => {
    if (G.load()) {
      G.started = true;
      $('start-screen').classList.remove('show');
      G.hud.flash('SAVE LOADED — WELCOME BACK');
      if (!G.missions.active && G.missions.completed < MISSIONS.length) startMission(G, G.missions.completed);
    } else $('load-btn').textContent = 'NO SAVE FOUND';
  });
  $('resume-btn').addEventListener('click', () => { G.paused = false; $('pause-menu').classList.remove('show'); });
  $('save-btn').addEventListener('click', () => { G.save(); });
  $('quit-btn').addEventListener('click', () => {
    G.paused = false; $('pause-menu').classList.remove('show');
    G.started = false; $('start-screen').classList.add('show');
  });
  $('close-garage-btn').addEventListener('click', () => { $('garage-menu').classList.remove('show'); });
  // mouse look: drag to orbit camera
  let dragging = false; let lx = 0; let ly = 0;
  canvas.addEventListener('mousedown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    G.cameraYaw -= (e.clientX - lx) * 0.004;
    G.cameraPitch = Math.max(0.08, Math.min(0.9, G.cameraPitch + (e.clientY - ly) * 0.003));
    lx = e.clientX; ly = e.clientY;
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  canvas.addEventListener('wheel', (e) => { G.camDist = Math.max(6, Math.min(18, G.camDist + e.deltaY * 0.01)); }, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // keyboard shortcuts handled per-frame
  function handleKeys() {
    const inp = G.input;
    const p = G.player;
    // weapon select
    for (let i = 0; i < WEAPONS.length; i++) {
      if (inp.pressed('Digit' + (i + 1))) {
        if (i >= 5 && G.respectLevel < 3) { G.hud.flash('LOCKED — REACH RESPECT LV 3'); }
        else { p.weaponIdx = i; G.audio.click(); }
      }
    }
    if (inp.pressed('KeyQ')) { const idx = G.audio.cycleRadio(); G.hud.setRadio(idx); G.hud.flash('RADIO: ' + RADIO[idx].name + ' — ' + RADIO[idx].tag); }
    if (inp.pressed('KeyR')) { /* reload handled in fire */ }
    if (inp.pressed('KeyM')) {
      if ($('pause-menu').classList.contains('show')) { G.paused = false; $('pause-menu').classList.remove('show'); }
      else { G.paused = true; $('pause-menu').classList.add('show'); }
    }
    if (inp.pressed('Escape')) {
      if ($('garage-menu').classList.contains('show')) $('garage-menu').classList.remove('show');
      else if (G.started) { G.paused = !G.paused; $('pause-menu').classList.toggle('show', G.paused); }
    }
    if (inp.pressed('KeyG')) {
      const d = Math.hypot(p.x - G.world.garagePos.x, p.z - G.world.garagePos.z);
      if (d < 16) { buildGarageList(G); $('garage-menu').classList.add('show'); }
      else G.hud.flash('GARAGE IS AT THE STRAND — FOLLOW THE GREEN $ ON THE MAP');
    }
    if (inp.pressed('KeyT')) startTaxi(G);
    if (inp.pressed('KeyH')) {
      G.rain = !G.rain;
      G.rainPts.visible = G.rain;
      G.hud.flash(G.rain ? 'RAIN ROLLING IN OFF THE SEA' : 'RAIN CLEARED — GOLDEN HOUR AGAIN');
    }
    if (inp.pressed('KeyN')) { G.clockHour = (G.clockHour + 4) % 24; G.hud.flash('TIME ' + Math.floor(G.clockHour) + ':00'); }
    if (inp.pressed('KeyF')) { /* horn */ G.audio.tone(370, 0.25, 'square', 0.12); G.audio.tone(466, 0.25, 'square', 0.12); }
    // crew abilities
    for (const c of [{ key: 'KeyZ', id: 'plates' }, { key: 'KeyX', id: 'fix' }, { key: 'KeyC', id: 'eyes' }]) {
      if (inp.pressed(c.key)) useCrew(G, c.id);
    }
    if (inp.pressed('KeyP')) { G.save(); G.hud.flash('GAME SAVED'); }
  }

  function useCrew(G, id) {
    if ((G.crewCd[id] || 0) > 0) { G.hud.flash('CREW NOT READY — ' + Math.ceil(G.crewCd[id]) + 's'); return; }
    if (id === 'plates') {
      G.police.wanted = Math.max(0, G.police.wanted - 1);
      G.police.heat = G.police.wanted;
      G.hud.flash('SWAP PLATES — MIRA SWAPPED YOUR PLATES (-1 ★)');
    } else if (id === 'fix') {
      if (G.player.car) G.player.car.condition = 100;
      G.player.armor = Math.min(100, G.player.armor + 25);
      G.hud.flash('QUICK FIX — LIO PATCHED YOU UP');
    } else if (id === 'eyes') {
      G.police.eyesOutUntil = performance.now() + 20000;
      G.hud.flash('EYES OUT — KIKI IS WATCHING THE SCANNERS (20s)');
    }
    G.crewCd[id] = id === 'plates' ? 45 : id === 'fix' ? 30 : 60;
    G.audio.pickup();
  }

  // day/night lighting
  const sunLight = scene.children.find((o) => o.isDirectionalLight);
  function updateSky(dt) {
    G.clockHour = (G.clockHour + dt * 0.02) % 24;
    const h = G.clockHour;
    const day = h >= 6 && h < 19;
    const dusk = (h >= 16.5 && h < 19.5) || (h >= 5.5 && h < 7);
    if (sunLight) {
      sunLight.intensity = day ? (dusk ? 2.4 : 2.0) : 0.5;
      sunLight.color.setHex(dusk ? 0xffb36b : day ? 0xfff2d0 : 0x8a9fd0);
    }
    renderer.toneMappingExposure = dusk ? 1.15 : day ? 1.0 : 0.75;
  }

  function updateCamera(dt) {
    const p = G.player;
    const target = new THREE.Vector3(p.x, 1.6, p.z);
    if (p.inCar && p.car) {
      // chase cam follows car heading
      const desired = p.heading;
      let dy = desired - G.cameraYaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      G.cameraYaw += dy * Math.min(1, dt * 2.2);
    }
    const dist = p.inCar ? G.camDist : 8.5;
    const cx = p.x - Math.sin(G.cameraYaw) * dist * Math.cos(G.cameraPitch);
    const cz = p.z - Math.cos(G.cameraYaw) * dist * Math.cos(G.cameraPitch);
    const cy = 1.6 + Math.sin(G.cameraPitch) * dist;
    const desiredPos = new THREE.Vector3(cx, cy, cz);
    // snap when far away (boot / staging) so the camera never lags a fast car
    if (camera.position.distanceTo(desiredPos) > 25) camera.position.copy(desiredPos);
    else camera.position.lerp(desiredPos, Math.min(1, dt * 8));
    camera.lookAt(target.x, target.y + 0.6, target.z);
  }

  let last = performance.now();
  let fpsFrames = 0; let fpsT = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!G.started || G.paused) {
      // menu idle: slow orbit over the boulevard
      if (!G.started) {
        const t = now / 1000;
        camera.position.set(168 + Math.sin(t * 0.08) * 26, 12, 40 + Math.cos(t * 0.08) * 26);
        camera.lookAt(168, 2, 0);
        updateEffects(G, dt);
        updatePeds(G.peds, dt, { x: 168, z: 0 }, null);
        renderer.render(scene, camera);
      }
      return;
    }
    handleKeys();
    updateSky(dt);
    updatePlayer(G, dt, G.input);
    updatePolice(G, dt);
    updateMissions(G, dt);
    updateSide(G, dt);
    updatePeds(G.peds, dt, G.player, G.lastGunfire);
    updateTraffic(G.traffic, dt);
    updateEffects(G, dt);
    if (G.rain) {
      const pos = G.rainPts.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - dt * 30;
        if (y < 0) y = 40;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      G.rainPts.position.set(G.player.x, 0, G.player.z);
    }
    // ferris wheel spin
    if (G.world.ferris) G.world.ferris.children[0].rotation.z += dt * 0.25;
    // crew cooldowns
    for (const k of Object.keys(G.crewCd)) G.crewCd[k] = Math.max(0, G.crewCd[k] - dt);
    // respect level
    G.respectLevel = G.respect >= 1500 ? 4 : G.respect >= 800 ? 3 : G.respect >= 250 ? 2 : 1;
    updateCamera(dt);
    G.hud.update(G, dt);
    renderer.render(scene, camera);
    fpsFrames++; fpsT += dt;
    if (fpsT >= 1) { G.fps = Math.round(fpsFrames / fpsT); fpsFrames = 0; fpsT = 0; }
  }

  // screenshot staging via ?shot=
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) applyShot(G, shot);
  G.shot = shot;
  // test hook: deterministic state for automated playtests
  window.__CV = G;
  window.__CV_VERSION = 'coral-vista-j-1.0';
  requestAnimationFrame(loop);
  window.addEventListener('error', (e) => { window.__CV_ERROR = (window.__CV_ERROR || '') + String(e.message) + '\n'; });
}

document.addEventListener('DOMContentLoaded', boot);
