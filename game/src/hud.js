// CORAL VISTA — HUD: objective, money, stars, dispatch, weapons, minimap, dialogue, menus.
import { WEAPONS, CARS, CREW, RADIO, GARAGE_UPGRADES, DISTRICTS, MISSIONS } from './config.js';
import { dispatchList } from './police.js';
import { packageMarkers } from './missions.js';

export function createHud(G) {
  const $ = (id) => document.getElementById(id);
  const hud = {
    els: {
      objTitle: $('obj-title'), objText: $('obj-text'), objStage: $('obj-stage'),
      objTimer: $('obj-timer'), money: $('money'), stars: $('stars'), clock: $('clock'),
      respect: $('respect'), dispatch: $('dispatch-list'), dispatchCount: $('dispatch-count'),
      inSight: $('in-sight'), objNext: $('obj-next'),
      weapons: $('weapon-slots'), crew: $('crew-list'), minimap: $('minimap'),
      health: $('health-fill'), armor: $('armor-fill'), healthNum: $('health-num'),
      armorNum: $('armor-num'), speed: $('speed-num'), carName: $('car-name'),
      carCond: $('car-cond-fill'), carCondNum: $('car-cond-num'),
      radio: $('radio-name'), dialogue: $('dialogue'), dlgName: $('dlg-name'),
      dlgRole: $('dlg-role'), dlgText: $('dlg-text'), dlgFace: $('dlg-face'),
      flash: $('flash'), district: $('district-name'), districtSub: $('district-sub'),
      standing: $('standing-fill'), standingNum: $('standing-num'),
      startScreen: $('start-screen'), pauseMenu: $('pause-menu'), garageMenu: $('garage-menu'),
      garageList: $('garage-list'), missionList: $('mission-list'),
      pkgCount: $('pkg-count'), saveMsg: $('save-msg'),
    },
    flashT: 0, dlgT: 0, lastUpdate: 0,
  };
  hud.flash = function (msg) {
    hud.els.flash.textContent = msg;
    hud.els.flash.classList.add('show');
    hud.flashT = 2.6;
  };
  hud.showDialogue = function (name, role, text) {
    hud.els.dlgName.textContent = name;
    hud.els.dlgRole.textContent = role;
    hud.els.dlgText.textContent = text;
    hud.els.dlgFace.textContent = name.split(' ').map((w) => w[0]).join('').slice(0, 2);
    hud.els.dialogue.classList.add('show');
    hud.dlgT = 7;
  };
  hud.hideDialogue = function () { hud.els.dialogue.classList.remove('show'); };
  hud.setRadio = function (idx) {
    const r = RADIO[idx];
    hud.els.radio.textContent = '♪ ' + r.name + ' — "' + r.tag + '"';
  };
  hud.update = function (G, dt) {
    const now = performance.now();
    if (hud.flashT > 0) { hud.flashT -= dt; if (hud.flashT <= 0) hud.els.flash.classList.remove('show'); }
    if (hud.dlgT > 0) { hud.dlgT -= dt; if (hud.dlgT <= 0) hud.hideDialogue(); }
    if (now - hud.lastUpdate < 120) { drawMinimap(G, hud); return; }
    hud.lastUpdate = now;
    const p = G.player;
    // objective
    const M = G.missions;
    if (M.active) {
      const st = M.active.stages[M.stageIdx];
      hud.els.objTitle.textContent = 'MISSION ' + M.active.id + '/10 · ' + M.active.title;
      hud.els.objText.textContent = st ? st.text : '';
      hud.els.objStage.textContent = 'STAGE ' + (M.stageIdx + 1) + '/' + M.active.stages.length;
      hud.els.objTimer.textContent = M.stageT > 0 && (st.kind === 'survive' || st.kind === 'lose')
        ? '⏱ ' + Math.max(0, Math.ceil((st.secs || 0) - M.stageT)) + 's' : '';
      const next = M.active.stages[M.stageIdx + 1];
      hud.els.objNext.textContent = next ? 'NEXT: ' + next.text : 'NEXT: Complete the mission';
    } else if (M.taxi) {
      hud.els.objTitle.textContent = 'TAXI FARE';
      hud.els.objText.textContent = 'Drop the passenger off before the timer runs out';
      hud.els.objStage.textContent = 'SIDE JOB';
      hud.els.objNext.textContent = '';
      hud.els.objTimer.textContent = '⏱ ' + Math.ceil(M.taxi.t) + 's';
    } else {
      hud.els.objTitle.textContent = 'FREE ROAM — CORAL VISTA';
      hud.els.objText.textContent = 'Find the next job: press M for missions, T for a taxi fare';
      hud.els.objStage.textContent = M.completed + '/10 DONE';
      hud.els.objNext.textContent = '';
      hud.els.objTimer.textContent = '';
    }
    hud.els.inSight.style.display = G.police.wanted >= 3 ? 'inline-block' : 'none';
    hud.els.money.textContent = '$' + Math.floor(G.money).toLocaleString();
    hud.els.stars.innerHTML = [0, 1, 2, 3, 4].map((i) =>
      '<span class="star' + (i < G.police.wanted ? ' on' : '') + '">★</span>').join('');
    const hh = Math.floor(G.clockHour); const mm = Math.floor((G.clockHour - hh) * 60);
    hud.els.clock.textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    hud.els.respect.textContent = 'RESPECT LV ' + G.respectLevel + ' · ' + Math.floor(G.respect) + ' RP';
    // dispatch
    const list = dispatchList(G);
    const totalUnits = G.police.units.length + (G.police.heliActive ? 1 : 0) + (G.police.roadblockAt ? 1 : 0);
    hud.els.dispatchCount.textContent = (list.length || 0) + ' UNITS · ' + G.police.wanted + '★';
    hud.els.dispatch.innerHTML = list.length
      ? list.map((u) => '<div class="drow"><span class="dname">' + u.name + '</span><span class="ddist">' + u.dist + ' m</span><span class="dstat ' + u.status.replace(/ /g, '') + '">' + u.status + '</span></div>').join('')
        + (totalUnits > list.length ? '<div class="dmore">+' + (totalUnits - list.length) + ' more units' + (G.police.roadblockAt ? ' · roadblock ahead' : '') + '</div>' : '')
      : '<div class="drow"><span class="dname">NO ACTIVE UNITS</span></div>';
    // weapons
    hud.els.weapons.innerHTML = WEAPONS.map((w, i) => {
      const locked = i >= 5 && G.respectLevel < 3;
      return '<div class="wslot' + (i === p.weaponIdx ? ' active' : '') + (locked ? ' locked' : '') + '">' +
        '<div class="wkey">' + w.slot + '</div><div class="wname">' + w.name + '</div>' +
        '<div class="wammo">' + (w.ammo === Infinity ? '∞' : p.mag[i] + '/' + p.ammo[i]) + '</div></div>';
    }).join('');
    // crew
    hud.els.crew.innerHTML = CREW.map((c) => {
      const cd = G.crewCd[c.id] || 0;
      return '<div class="crow"><span class="ckey">' + c.key + '</span><div><div class="cname">' + c.name + '</div>' +
        '<div class="cmember">' + c.member + ' · ' + c.role + '</div></div>' +
        '<span class="ccd">' + (cd > 0 ? Math.ceil(cd) + 's' : 'READY') + '</span></div>';
    }).join('');
    // health / armor / speed
    hud.els.health.style.width = Math.max(0, p.health) + '%';
    hud.els.armor.style.width = Math.max(0, p.armor) + '%';
    hud.els.healthNum.textContent = Math.round(p.health);
    hud.els.armorNum.textContent = Math.round(p.armor);
    const spd = p.inCar && p.car ? Math.abs(p.car.speed) * 2.24 : Math.abs(p.speed) * 2.24;
    hud.els.speed.textContent = Math.round(spd);
    hud.els.carName.textContent = p.inCar && p.car ? CARS[p.car.modelIdx].name : 'ON FOOT';
    const cond = p.inCar && p.car ? p.car.condition : 100;
    hud.els.carCond.style.width = cond + '%';
    hud.els.carCondNum.textContent = Math.round(cond) + '%';
    // district
    let best = DISTRICTS[0]; let bd = 1e9;
    for (const d of DISTRICTS) {
      const dd = Math.hypot(p.x - d.x, p.z - d.z);
      if (dd < bd) { bd = dd; best = d; }
    }
    hud.els.district.textContent = best.name;
    hud.els.districtSub.textContent = best.sub;
    hud.els.standing.style.width = best.standing + '%';
    hud.els.standingNum.textContent = 'STANDING ' + best.standing;
    hud.els.pkgCount.textContent = '◆ ' + M.packages + '/12 PACKAGES';
    // mission list (pause)
    hud.els.missionList.innerHTML = MISSIONS.map((m, i) =>
      '<div class="mrow' + (i < M.completed ? ' done' : '') + (M.active && M.active.id === m.id ? ' active' : '') + '">' +
      '<span>' + m.id + '. ' + m.title + '</span><span>$' + m.pay.toLocaleString() + '</span></div>').join('');
    drawMinimap(G, hud);
  };
  return hud;
}

function drawMinimap(G, hud) {
  const cv = hud.els.minimap;
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const S = cv.width; const scale = S / 500;
  const px = (x) => (x + 250) * scale;
  const pz = (z) => (z + 250) * scale;
  ctx.clearRect(0, 0, S, S);
  // sea + sand
  ctx.fillStyle = '#00b8c9'; ctx.fillRect(px(205), 0, S - px(205), S);
  ctx.fillStyle = '#ffd98a'; ctx.fillRect(px(158), 0, px(205) - px(158), S);
  ctx.fillStyle = '#3d3a4d'; ctx.fillRect(0, 0, px(158), S);
  // roads
  ctx.strokeStyle = '#5a5a70'; ctx.lineWidth = 5;
  for (const x of [-120, -60, 0, 60, 120, 168]) { ctx.beginPath(); ctx.moveTo(px(x), 0); ctx.lineTo(px(x), S); ctx.stroke(); }
  for (const z of [-120, -60, 0, 60, 120]) { ctx.beginPath(); ctx.moveTo(0, pz(z)); ctx.lineTo(S, pz(z)); ctx.stroke(); }
  // packages
  for (const pk of packageMarkers(G)) {
    if (pk.found) continue;
    ctx.fillStyle = '#ffd23d';
    ctx.beginPath(); ctx.arc(px(pk.x), pz(pk.z), 3, 0, 7); ctx.fill();
  }
  // objective beacon
  const M = G.missions;
  if (M.active) {
    const st = M.active.stages[M.stageIdx];
    if (st && st.kind === 'goto') {
      ctx.fillStyle = '#ff2233';
      ctx.beginPath(); ctx.arc(px(st.x), pz(st.z), 5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }
  if (M.taxi) {
    ctx.fillStyle = '#19d3c5';
    ctx.beginPath(); ctx.arc(px(M.taxi.x), pz(M.taxi.z), 5, 0, 7); ctx.fill();
  }
  // police blips
  ctx.fillStyle = '#ff2233';
  for (const u of G.police.units) { ctx.beginPath(); ctx.arc(px(u.x), pz(u.z), 3.5, 0, 7); ctx.fill(); }
  if (G.police.heliActive && G.police.heli) {
    ctx.fillStyle = '#ff9e3d';
    ctx.beginPath(); ctx.arc(px(G.police.heli.x), pz(G.police.heli.z), 4.5, 0, 7); ctx.fill();
  }
  // garage
  ctx.fillStyle = '#2aff7a';
  ctx.fillRect(px(150) - 4, pz(40) - 4, 8, 8);
  // player arrow
  ctx.save();
  ctx.translate(px(G.player.x), pz(G.player.z));
  ctx.rotate(-G.player.heading);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ff4f6d'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  // north
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('N', 8, 14);
}

export function buildGarageList(G) {
  const el = document.getElementById('garage-list');
  el.innerHTML = GARAGE_UPGRADES.map((u) => {
    const owned = G.upgrades[u.id];
    return '<div class="grow"><div><div class="gname">' + u.name + '</div><div class="gdesc">' + u.desc + '</div></div>' +
      '<button class="gbuy" data-upg="' + u.id + '" ' + (owned ? 'disabled' : '') + '>' +
      (owned ? 'OWNED' : '$' + u.cost.toLocaleString()) + '</button></div>';
  }).join('');
  el.querySelectorAll('.gbuy').forEach((b) => {
    b.addEventListener('click', () => {
      const u = GARAGE_UPGRADES.find((x) => x.id === b.dataset.upg);
      if (G.money >= u.cost && !G.upgrades[u.id]) {
        G.money -= u.cost; G.upgrades[u.id] = true;
        if (u.id === 'armor') G.player.armor = Math.min(100, G.player.armor + 40);
        if (u.id === 'paint' && G.player.car) G.player.car.mesh.children[0].material.color.setHex(0xff4fd8);
        G.audio.pickup();
        G.hud.flash(u.name + ' INSTALLED');
        buildGarageList(G);
        G.save();
      }
    });
  });
}
