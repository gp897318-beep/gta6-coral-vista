// CORAL VISTA — procedural audio: engine, sirens, gunfire, radio stations (WebAudio, no files).
export function createAudio() {
  const A = {
    ctx: null, master: null, engineOsc: null, engineGain: null, engineOn: false,
    sirenOsc: null, sirenGain: null, radioTimer: null, radioIdx: 0, radioOn: false,
    muted: false,
  };
  A.ensure = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    try {
      A.ctx = new (window.AudioContext || window.webkitAudioContext)();
      A.master = A.ctx.createGain(); A.master.gain.value = 0.5;
      A.master.connect(A.ctx.destination);
    } catch (e) { /* audio unavailable */ }
  };
  A.tone = function (freq, dur, type, vol, when = 0, slideTo = 0) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime + when;
    const o = A.ctx.createOscillator(); const g = A.ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(A.master);
    o.start(t); o.stop(t + dur + 0.05);
  };
  A.noise = function (dur, vol, freq = 1200) {
    if (!A.ctx) return;
    const len = Math.floor(A.ctx.sampleRate * dur);
    const buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = A.ctx.createBufferSource(); src.buffer = buf;
    const f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = A.ctx.createGain(); g.gain.value = vol || 0.3;
    src.connect(f); f.connect(g); g.connect(A.master);
    src.start();
  };
  A.engine = function (on) {
    A.ensure(); if (!A.ctx) return;
    if (on && !A.engineOsc) {
      A.engineOsc = A.ctx.createOscillator(); A.engineOsc.type = 'sawtooth';
      A.engineOsc.frequency.value = 55;
      A.engineGain = A.ctx.createGain(); A.engineGain.gain.value = 0.05;
      const f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
      A.engineOsc.connect(f); f.connect(A.engineGain); A.engineGain.connect(A.master);
      A.engineOsc.start();
    } else if (!on && A.engineOsc) {
      A.engineOsc.stop(); A.engineOsc = null; A.engineGain = null;
    }
    A.engineOn = on;
  };
  A.setEngine = function (ratio) {
    if (A.engineOsc && A.ctx) {
      A.engineOsc.frequency.value = 55 + ratio * 160;
      if (A.engineGain) A.engineGain.gain.value = 0.04 + ratio * 0.05;
    }
  };
  A.siren = function (on) {
    A.ensure(); if (!A.ctx) return;
    if (on && !A.sirenOsc) {
      A.sirenOsc = A.ctx.createOscillator(); A.sirenOsc.type = 'triangle';
      A.sirenGain = A.ctx.createGain(); A.sirenGain.gain.value = 0.045;
      A.sirenOsc.connect(A.sirenGain); A.sirenGain.connect(A.master);
      A.sirenOsc.start();
      const wail = () => {
        if (!A.sirenOsc) return;
        const t = A.ctx.currentTime;
        A.sirenOsc.frequency.setValueAtTime(700, t);
        A.sirenOsc.frequency.linearRampToValueAtTime(1100, t + 0.7);
        A.sirenOsc.frequency.linearRampToValueAtTime(700, t + 1.4);
      };
      wail(); A._sirenInt = setInterval(wail, 1400);
    } else if (!on && A.sirenOsc) {
      clearInterval(A._sirenInt);
      A.sirenOsc.stop(); A.sirenOsc = null; A.sirenGain = null;
    }
  };
  A.shoot = function (idx) {
    A.noise(0.12, 0.35, idx === 3 ? 700 : 2400);
    if (idx === 6) { A.noise(0.5, 0.5, 300); A.tone(60, 0.4, 'sine', 0.4, 0, 30); }
  };
  A.crash = function () { A.noise(0.25, 0.4, 500); A.tone(90, 0.2, 'square', 0.15, 0, 50); };
  A.explosion = function () { A.noise(0.9, 0.6, 250); A.tone(70, 0.8, 'sine', 0.5, 0, 28); };
  A.carjack = function () { A.tone(520, 0.12, 'square', 0.12); A.tone(780, 0.16, 'square', 0.12, 0.1); };
  A.pickup = function () { A.tone(880, 0.1, 'sine', 0.2); A.tone(1320, 0.18, 'sine', 0.2, 0.09); };
  A.stunt = function () { [660, 880, 1100].forEach((f, i) => A.tone(f, 0.14, 'square', 0.14, i * 0.09)); };
  A.click = function () { A.tone(220, 0.05, 'square', 0.1); };
  A.missionStart = function () { [392, 523, 659].forEach((f, i) => A.tone(f, 0.22, 'triangle', 0.2, i * 0.12)); };
  A.missionDone = function () { [523, 659, 784, 1046].forEach((f, i) => A.tone(f, 0.25, 'triangle', 0.22, i * 0.13)); };
  // Radio: 4 stations, each a looping chord + bass pattern (procedural, no files).
  const STATION_PATTERNS = [
    { bpm: 112, root: 220, chords: [[0, 4, 7], [5, 9, 12], [3, 7, 10], [7, 11, 14]], wave: 'triangle' },
    { bpm: 96, root: 110, chords: [[0, 3, 7], [8, 12, 15], [5, 8, 12], [10, 14, 17]], wave: 'sawtooth' },
    { bpm: 76, root: 165, chords: [[0, 4, 7, 10], [5, 9, 12], [0, 4, 7], [7, 11, 14]], wave: 'sine' },
    { bpm: 60, root: 196, chords: [[0, 7], [5, 12], [3, 10], [7, 14]], wave: 'square' },
  ];
  A.radio = function (idx, on) {
    A.ensure(); if (!A.ctx) return;
    A.radioIdx = idx;
    if (A.radioTimer) { clearInterval(A.radioTimer); A.radioTimer = null; }
    A.radioOn = on;
    if (!on) return;
    const pat = STATION_PATTERNS[idx % STATION_PATTERNS.length];
    const beat = 60 / pat.bpm / 2;
    let step = 0;
    const play = () => {
      if (!A.ctx) return;
      const chord = pat.chords[Math.floor(step / 4) % pat.chords.length];
      const note = chord[step % chord.length];
      const f = pat.root * Math.pow(2, note / 12);
      A.tone(f, beat * 1.8, pat.wave, 0.09);
      if (step % 4 === 0) A.tone(pat.root / 2, beat * 3, 'sine', 0.16);
      if (step % 2 === 0) A.noise(0.03, 0.05, 6000);
      step++;
    };
    play();
    A.radioTimer = setInterval(play, beat * 1000);
  };
  A.cycleRadio = function () {
    A.radioIdx = (A.radioIdx + 1) % 4;
    if (A.radioOn) A.radio(A.radioIdx, true);
    return A.radioIdx;
  };
  return A;
}
