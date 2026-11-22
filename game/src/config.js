// CORAL VISTA — game data: city, story, cars, weapons, crew, radio.
// All names, characters and places are original.
export const CITY = {
  name: 'CORAL VISTA',
  state: 'Coral Coast',
  size: 480,
  seaX: 205,
  sandX0: 158,
  boulevardX: 168,
  sunsetHour: 17.75,
};

export const DISTRICTS = [
  { id: 'strand', name: 'KORAL STRAND', sub: 'Strand Boulevard', color: '#ff9e3d', standing: 58, x: 168, z: 0 },
  { id: 'marina', name: 'MARINA ROW', sub: 'Yacht Basin', color: '#19d3c5', standing: 41, x: 120, z: -120 },
  { id: 'neon', name: 'NEON MILE', sub: 'Casino Row', color: '#ff4fd8', standing: 33, x: 0, z: -60 },
  { id: 'palms', name: 'PALM COURTS', sub: 'Old Town', color: '#ffd23d', standing: 62, x: -60, z: 60 },
  { id: 'docks', name: 'TIDE DOCKS', sub: 'Fish Market', color: '#4d8dff', standing: 27, x: -120, z: 120 },
];

export const CARS = [
  { id: 'pelican', name: 'PELICAN GT', color: 0xff4f3d, top: 62, accel: 26, grip: 1.0, price: 0 },
  { id: 'manta', name: 'MANTA S', color: 0x19d3c5, top: 58, accel: 24, grip: 1.05, price: 4200 },
  { id: 'coral', name: 'CORAL COUPE', color: 0xff9e3d, top: 55, accel: 22, grip: 1.0, price: 2600 },
  { id: 'viper', name: 'VIPER LOW', color: 0xb44dff, top: 66, accel: 30, grip: 0.95, price: 9800 },
  { id: 'sunset', name: 'SUNSET ROADSTER', color: 0xffd23d, top: 60, accel: 25, grip: 1.0, price: 5400 },
  { id: 'tide', name: 'TIDE RUNNER', color: 0x4d8dff, top: 52, accel: 20, grip: 1.1, price: 1800 },
  { id: 'gull', name: 'GULL SEDAN', color: 0xf2f2f2, top: 48, accel: 18, grip: 1.1, price: 900 },
  { id: 'sting', name: 'STINGRAY X', color: 0x2aff7a, top: 64, accel: 28, grip: 0.98, price: 7600 },
];

export const WEAPONS = [
  { id: 'fists', name: 'FISTS', slot: 1, ammo: Infinity, mag: Infinity, dmg: 8, auto: false },
  { id: 'p38', name: 'P38', slot: 2, ammo: 60, mag: 12, dmg: 22, auto: false },
  { id: 'smg', name: 'RATTLER SMG', slot: 3, ammo: 120, mag: 30, dmg: 13, auto: true },
  { id: 'shotgun', name: 'GATOR 12G', slot: 4, ammo: 24, mag: 6, dmg: 55, auto: false },
  { id: 'ar', name: 'AR-9', slot: 5, ammo: 90, mag: 30, dmg: 26, auto: true },
  { id: 'sniper', name: 'LONGSHOT', slot: 6, ammo: 12, mag: 4, dmg: 90, auto: false },
  { id: 'rpg', name: 'CORAL RPG', slot: 7, ammo: 4, mag: 1, dmg: 160, auto: false },
];

export const CREW = [
  { id: 'plates', key: 'Z', name: 'SWAP PLATES', member: 'Mira', role: 'Driver', cd: 45, desc: 'Lose one wanted star instantly' },
  { id: 'fix', key: 'X', name: 'QUICK FIX', member: 'Lio', role: 'Mechanic', cd: 30, desc: 'Repair your car to full condition' },
  { id: 'eyes', key: 'C', name: 'EYES OUT', member: 'Kiki', role: 'Lookout', cd: 60, desc: 'Police lose you twice as fast for 20s' },
];

export const RADIO = [
  { id: 'tide', name: 'TIDE 98.4', tag: 'Island Pop', hue: '#19d3c5' },
  { id: 'neon', name: 'NEON 101.7', tag: 'Synthwave', hue: '#ff4fd8' },
  { id: 'coral', name: 'CORAL 88.2', tag: 'Reggae Sun', hue: '#ff9e3d' },
  { id: 'static', name: 'STATIC 104.9', tag: 'Late Night Talk', hue: '#b44dff' },
];

export const GARAGE_UPGRADES = [
  { id: 'armor', name: 'ARMOR PLATING', cost: 1500, desc: '+40 max armor' },
  { id: 'engine', name: 'TURBO ENGINE', cost: 2400, desc: '+18% top speed' },
  { id: 'tires', name: 'GRIP TIRES', cost: 900, desc: '+15% handling' },
  { id: 'paint', name: 'CORAL PEARL PAINT', cost: 600, desc: 'Fresh candy paint job' },
];

export const MISSIONS = [
  { id: 1, title: 'FIRST FARE', fixer: 'LUNA MARLOWE', role: 'Fixer', pay: 800,
    brief: 'A courier van is waiting at Tide Docks. Bring it to the Strand garage — no scratches, no sirens.',
    stages: [
      { kind: 'goto', text: 'Pick up the courier van at Tide Docks', x: -120, z: 110, r: 9 },
      { kind: 'goto', text: 'Deliver the van to the Strand garage', x: 150, z: 40, r: 9 },
    ] },
  { id: 2, title: 'REPO RODEO', fixer: 'TIA ROSA', role: 'Diner Owner', pay: 1200,
    brief: 'The valet skipped town with a Sunset Roadster. Take it back — and lose the patrol on your tail.',
    stages: [
      { kind: 'goto', text: 'Find the Roadster on Neon Mile', x: 0, z: -55, r: 9 },
      { kind: 'goto', text: 'Deliver the Roadster to El Desguace', x: -115, z: -115, r: 9 },
      { kind: 'lose', text: 'Lose the heat', secs: 8 },
    ] },
  { id: 3, title: 'SALT & SIRENS', fixer: 'UNCLE DEE', role: 'Fixer', pay: 1600,
    brief: 'Every cruiser on the bay wants that coral Vireo. Forty seconds on the parade, then you vanish.',
    stages: [
      { kind: 'wanted', text: 'Raise the heat to 3 stars on the parade', stars: 3 },
      { kind: 'survive', text: 'Survive the parade', secs: 25 },
      { kind: 'lose', text: 'Lose the heat', secs: 8 },
    ] },
  { id: 4, title: 'THE LONG PIER', fixer: 'LUNA MARLOWE', role: 'Fixer', pay: 2000,
    brief: 'A rival crew is moving product down the pier. Wreck their Regent before it reaches the water.',
    stages: [
      { kind: 'goto', text: 'Reach the pier entrance', x: 150, z: -80, r: 9 },
      { kind: 'wreck', text: 'Wreck the rival Regent', target: 'regent', hp: 100 },
    ] },
  { id: 5, title: 'NEON HEIST', fixer: 'KIKI', role: 'Lookout', pay: 2600,
    brief: 'The casino vault on Neon Mile. In through the back, out before the alarm brings the whole bay.',
    stages: [
      { kind: 'goto', text: 'Reach the casino back door', x: 30, z: -60, r: 8 },
      { kind: 'goto', text: 'Grab the stash and reach the getaway car', x: 60, z: -30, r: 8 },
      { kind: 'lose', text: 'Lose the heat', secs: 10 },
    ] },
  { id: 6, title: 'HARBOUR LIGHTS', fixer: 'MIRA', role: 'Driver', pay: 2200,
    brief: 'Race the harbour loop against three street crews. Win and the Strand is yours tonight.',
    stages: [
      { kind: 'race', text: 'Win the harbour loop race', laps: 1 },
    ] },
  { id: 7, title: 'STORM SURGE', fixer: 'UNCLE DEE', role: 'Fixer', pay: 3000,
    brief: 'A storm is rolling in off the sea. Move the stash from the docks before the roads flood.',
    stages: [
      { kind: 'goto', text: 'Collect the stash at Tide Docks', x: -120, z: 120, r: 9 },
      { kind: 'goto', text: 'Drop it at Palm Courts', x: -60, z: 60, r: 9 },
      { kind: 'goto', text: 'Drop the second stash at Marina Row', x: 120, z: -120, r: 9 },
    ] },
  { id: 8, title: 'FIVE STAR FRENZY', fixer: 'LUNA MARLOWE', role: 'Fixer', pay: 4000,
    brief: 'They put five stars on you. Survive the full response — cruisers, roadblocks, Air One and SWAT.',
    stages: [
      { kind: 'wanted', text: 'Raise the heat to 5 stars', stars: 5 },
      { kind: 'survive', text: 'Survive the five-star response', secs: 40 },
      { kind: 'lose', text: 'Lose the heat', secs: 10 },
    ] },
  { id: 9, title: 'THE CORAL JOB', fixer: 'TIA ROSA', role: 'Diner Owner', pay: 5000,
    brief: 'One last job: the mayoral motorcade crosses the Strand at dusk. Take the lead car — clean.',
    stages: [
      { kind: 'goto', text: 'Intercept the motorcade on the Strand', x: 168, z: -40, r: 10 },
      { kind: 'wreck', text: 'Stop the lead limo', target: 'limo', hp: 120 },
      { kind: 'lose', text: 'Lose the heat', secs: 10 },
    ] },
  { id: 10, title: 'VISTA ROYALE', fixer: 'LUNA MARLOWE', role: 'Fixer', pay: 8000,
    brief: 'The whole city is watching. Win the grand race from the docks to the Strand and take the crown.',
    stages: [
      { kind: 'race', text: 'Win the Vista Royale grand race', laps: 1 },
      { kind: 'goto', text: 'Reach the winner’s circle on the beach', x: 180, z: 20, r: 10 },
    ] },
];

export const DISPATCH_CALLSIGNS = ['KITE-1', 'MARLIN-3', 'CORAL-48', 'CORAL-85', 'CORAL-43', 'TIDE-2', 'TIDE-6', 'PIER-5', 'REEF-9', 'SURF-12'];
export const DISPATCH_ROLES = ['RAMMING', 'FLANKING', 'ROADBLOCK', 'SPOTLIGHT', 'FIRING', 'PURSUE', 'PIT', 'CLOSING IN'];

export const PACKAGE_SPOTS = [
  [-100, -100], [-40, -100], [40, -110], [100, -80], [140, -40], [150, 60],
  [100, 100], [40, 110], [-20, 90], [-100, 40], [-140, -20], [180, -100],
];

export const STUNT_JUMPS = [
  { x: 60, z: 0, name: 'Neon Ramp' },
  { x: 120, z: 60, name: 'Marina Leap' },
  { x: 168, z: 90, name: 'Strand Flyer' },
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
