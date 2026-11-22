// CORAL VISTA — screenshot staging: deterministic cover/drive/mission/menu states.
// Screenshots are real renders of the game's own code; these hooks only set the
// starting state (position, wanted level, chase, weather) from a URL parameter.
import { makeCarMesh, makeFireball } from './vehicles.js';
import { addHeat, spawnUnit, igniteCar } from './police.js';
import { startMission } from './missions.js';
import { CARS } from './config.js';

export function applyShot(G, shot) {
  const p = G.player;
  if (shot === 'menu') {
    // start screen stays up; nothing to stage.
    G.started = false;
    return;
  }
  G.started = true;
  G.hud.els.startScreen.classList.remove('show');
  G.audio.ensure();
  if (shot === 'cover') {
    // Golden-hour 5-star chase on the beach boulevard: player in a coral sports
    // car, 3 cruisers, Air One with a big spotlight cone, a burning wreck,
    // a fireball, a roadblock ahead, beach crowd and umbrellas in frame.
    // Car drives slightly toward the beach side so the sea fills the frame.
    G.clockHour = 17.75;
    G.cameraPitch = 0.22;
    p.x = 168; p.z = 62; p.heading = Math.PI - 0.18; // facing north, angled to the sea
    const car = G.cars[0];
    car.x = 168; car.z = 62; car.heading = Math.PI - 0.18; car.speed = 14;
    car.modelIdx = 0;
    p.car = car; p.inCar = true; p.mesh.visible = false;
    car.mesh.position.set(car.x, 0, car.z); car.mesh.rotation.y = car.heading;
    G.audio.engine(true);
    addHeat(G, 5);
    G.police.wanted = 5; G.police.heat = 5;
    // cruisers: one ramming from behind-left, one flanking right, one ahead
    const spots = [
      { x: 163, z: 82, h: Math.PI }, { x: 174, z: 70, h: Math.PI }, { x: 169, z: 22, h: 0 },
    ];
    for (const s of spots) {
      const u = spawnUnit(G, 'cruiser');
      u.x = s.x; u.z = s.z; u.heading = s.h; u.speed = 14;
      u.mesh.position.set(s.x, 0, s.z); u.mesh.rotation.y = s.h;
    }
    spawnUnit(G, 'heli');
    G.police.heli.x = 176; G.police.heli.z = 34; G.police.heli.y = 19;
    G.police.heli.mesh.position.set(176, 19, 34);
    const swat = spawnUnit(G, 'swat');
    G.police.swat = swat;
    swat.x = 161; swat.z = 92; swat.heading = Math.PI;
    swat.mesh.position.set(161, 0, 92);
    // burning wreck on the left shoulder + fireball further ahead-left,
    // clear of the heli spotlight cone (right side)
    G.cars[1].x = 158; G.cars[1].z = 48;
    G.cars[1].mesh.position.set(158, 0, 48);
    igniteCar(G, G.cars[1]);
    G.effects.fireballs.push(makeFireball(G.scene, 160, 3.5, 40, G.effects.fireTex));
    // roadblock ahead
    G.police.roadblockAt = { x: 168, z: 8 };
    // traffic + crowd already spawned; add a few extra beach peds near camera
    G.hud.showDialogue('LUNA MARLOWE', 'Fixer',
      'Five stars and Air One is on you — punch it down the Strand and do NOT stop for the roadblock!');
    startMission(G, 7); // FIVE STAR FRENZY: survive the response
    G.cameraYaw = Math.PI;
    G.hud.flash('IN SIGHT — AIR ONE HAS YOU IN THE LIGHT');
  } else if (shot === 'drive') {
    G.clockHour = 17.4;
    p.x = 168; p.z = 90; p.heading = Math.PI;
    const car = G.cars[0];
    car.x = 168; car.z = 90; car.heading = Math.PI; car.speed = 20; car.modelIdx = 0;
    p.car = car; p.inCar = true; p.mesh.visible = false;
    G.audio.engine(true);
    addHeat(G, 2);
    const u = spawnUnit(G, 'cruiser');
    u.x = 164; u.z = 112; u.heading = Math.PI; u.speed = 18;
    spawnUnit(G, 'heli');
    G.cameraYaw = Math.PI;
    G.hud.showDialogue('MIRA', 'Driver',
      'Strand is clear all the way to Marina Row — keep it under the speed cameras, yeah?');
  } else if (shot === 'mission') {
    G.clockHour = 16.1;
    // On street x=-120 facing south toward the docks: open road corridor,
    // beacon visible down the street, no building in the camera's face.
    p.x = -120; p.z = 55; p.heading = 0;
    p.mesh.visible = true; p.inCar = false;
    const car = G.cars[2];
    car.x = -114; car.z = 95; car.heading = Math.PI * 0.8; car.modelIdx = 4;
    car.mesh.position.set(car.x, 0, car.z); car.mesh.rotation.y = car.heading;
    startMission(G, 0);
    G.cameraYaw = 0;
    G.hud.flash('MISSION 1/10 — FIRST FARE');
  }
  G.hud.update(G, 1);
}
