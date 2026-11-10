// sound.js — tiny Web Audio synth for the desk objects. No audio files:
// every sound is generated in the browser, so nothing to license or download.
// Audio only starts after a click (browsers require a user gesture).

let ctx, master;
let muted = false;
try { muted = localStorage.getItem("desk-muted") === "1"; } catch {}

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem("desk-muted", m ? "1" : "0"); } catch {}
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.02);
}

// white-noise buffer, reused by every noisy sound
let noiseBuf;
function noise() {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  return s;
}

// a short filtered noise burst: the building block for clicks and shutters
function burst(t, { freq = 3000, q = 1, dur = 0.03, gain = 0.5, type = "bandpass" } = {}) {
  const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  n.connect(f).connect(g).connect(master);
  n.start(t, Math.random()); n.stop(t + dur + 0.02);
}

// a tiny pitched "tick" (plastic resonance)
function tick(t, freq, dur = 0.025, gain = 0.25) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "triangle"; o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.01);
}

const SOUNDS = {
  // camera: mirror slap, short whirr, shutter close
  shutter(t) {
    burst(t, { freq: 2500, q: 0.8, dur: 0.05, gain: 0.9 });
    tick(t, 180, 0.06, 0.35);
    burst(t + 0.07, { freq: 5200, q: 0.6, dur: 0.12, gain: 0.18, type: "highpass" });
    burst(t + 0.12, { freq: 1800, q: 1.2, dur: 0.06, gain: 0.7 });
    tick(t + 0.12, 140, 0.05, 0.3);
  },
  // retractable pen: click down, clack up
  click(t) {
    burst(t, { freq: 4200, q: 3, dur: 0.018, gain: 0.7 });
    tick(t, 2300, 0.02, 0.18);
    burst(t + 0.09, { freq: 3400, q: 3, dur: 0.016, gain: 0.5 });
    tick(t + 0.09, 1900, 0.018, 0.14);
  },
  // page turn: a sweep of paper noise that swells and flicks off
  page(t) {
    const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "bandpass"; f.Q.value = 0.7;
    f.frequency.setValueAtTime(700, t);
    f.frequency.exponentialRampToValueAtTime(3800, t + 0.38);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.22);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    n.connect(f).connect(g).connect(master);
    n.start(t, Math.random()); n.stop(t + 0.5);
    burst(t + 0.4, { freq: 2600, q: 1, dur: 0.05, gain: 0.35 }); // the flick
  },
  // cup: one small, gentle sip of hot coffee (~0.7s). A soft breath of air drawn
  // in through the lips, a light liquid flutter in the middle, then a quiet close.
  slurp(t) {
    const dur = 0.7;
    // the sip: soft mid-range air whose pitch rises a little as it's drawn in
    const n = noise(), bp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = "bandpass"; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(1600, t + dur * 0.8);
    lp.type = "lowpass"; lp.frequency.value = 3000; // no harsh hiss
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.12);
    g.gain.setValueAtTime(0.09, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    // a gentle liquid flutter, only through the middle of the sip
    const lfo = ctx.createOscillator(), lg = ctx.createGain(), wob = ctx.createGain();
    lfo.type = "sine"; lfo.frequency.value = 17; wob.gain.value = 0.85;
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(0.25, t + 0.25);
    lg.gain.linearRampToValueAtTime(0, t + 0.55);
    lfo.connect(lg).connect(wob.gain);
    n.connect(bp).connect(lp).connect(g).connect(wob).connect(master);
    n.start(t, Math.random()); n.stop(t + dur + 0.02);
    lfo.start(t); lfo.stop(t + dur + 0.02);
    // the tiny soft "tup" as the lips close
    tick(t + dur - 0.06, 420, 0.05, 0.05);
  },
  // folder: a mouse click. A sharp "press" then a softer "release" ~70ms later.
  mouseclick(t) {
    burst(t, { freq: 3800, q: 4, dur: 0.012, gain: 0.9 });
    tick(t, 1500, 0.015, 0.22);
    burst(t + 0.07, { freq: 3000, q: 4, dur: 0.01, gain: 0.45 });
    tick(t + 0.07, 1250, 0.012, 0.12);
  },
  // (kept for reference) a soft rising "pop"
  pop(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.18);
    burst(t, { freq: 1800, q: 1, dur: 0.03, gain: 0.15 });
  },
  // cup: a soft hiss of steam off a hot drink. Airy high noise that swells and
  // fades with a gentle flutter, over a faint low "whoosh" of warm air.
  steam(t) {
    const dur = 2.2;
    // the hiss
    const n = noise(), hp = ctx.createBiquadFilter(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    hp.type = "highpass"; hp.frequency.value = 2200;
    bp.type = "bandpass"; bp.Q.value = 0.6;
    bp.frequency.setValueAtTime(4200, t);
    bp.frequency.linearRampToValueAtTime(5600, t + dur); // brightens slightly as it rises
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.35);
    g.gain.setValueAtTime(0.14, t + 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    // flutter: a slow wobble in loudness so it breathes rather than buzzes
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain(), wob = ctx.createGain();
    lfo.frequency.value = 5.5; lfoGain.gain.value = 0.35; wob.gain.value = 1;
    lfo.connect(lfoGain).connect(wob.gain);
    n.connect(hp).connect(bp).connect(g).connect(wob).connect(master);
    n.start(t, Math.random()); n.stop(t + dur + 0.05);
    lfo.start(t); lfo.stop(t + dur + 0.05);
    // the warm air underneath
    const n2 = noise(), lp = ctx.createBiquadFilter(), g2 = ctx.createGain();
    lp.type = "lowpass"; lp.frequency.value = 700;
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.05, t + 0.5);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.85);
    n2.connect(lp).connect(g2).connect(master);
    n2.start(t, Math.random()); n2.stop(t + dur);
  },
  // alarm clock: a classic twin-bell ring, 2 seconds. The hammer rattles between the two
  // bells ~18 times a second; the ring swells in, holds, and fades as it winds down.
  ring(t) {
    const dur = 2, rate = 18, n = Math.floor(dur * rate);
    for (let i = 0; i < n; i++) {
      const at = t + i / rate, f = i % 2 ? 2350 : 2620;
      const env = Math.min(1, i / 3) * (i > n - 8 ? (n - i) / 8 : 1); // fade in / wind down
      [1, 2.76, 5.4].forEach((m, j) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f * m;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, [0.07, 0.022, 0.008][j] * env), at + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, at + (i === n - 1 ? 0.5 : 0.16));
        o.connect(g).connect(master); o.start(at); o.stop(at + 0.55);
      });
      burst(at, { freq: 6000, q: 3, dur: 0.008, gain: 0.08 * env }); // hammer strike
    }
  },
  // binder clip, 2 seconds: squeeze the arms (creak), let go (snap), flip a wire arm
  // over (two light clicks), then a final snap shut with a little metal ring.
  snap(t) {
    const metal = (at, gain) => {
      burst(at, { freq: 5200, q: 4, dur: 0.02, gain });
      tick(at, 2900, 0.025, gain * 0.35);
      [3100, 4700].forEach((f) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(gain * 0.05, at + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
        o.connect(g).connect(master); o.start(at); o.stop(at + 0.3);
      });
    };
    const creak = (at, len) => {
      const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = "bandpass"; f.Q.value = 6;
      f.frequency.setValueAtTime(1800, at); f.frequency.linearRampToValueAtTime(2600, at + len);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.06, at + len * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      n.connect(f).connect(g).connect(master); n.start(at, Math.random()); n.stop(at + len + 0.02);
    };
    creak(t, 0.35);            // squeeze open
    metal(t + 0.38, 0.55);     // let go: snap
    metal(t + 0.85, 0.2);      // wire arm flips over
    metal(t + 1.05, 0.16);
    creak(t + 1.3, 0.3);       // squeeze again
    metal(t + 1.65, 0.6);      // final snap shut (rings out to ~2s)
  },
  // needle drop before the music starts
  needle(t) {
    tick(t, 90, 0.08, 0.4);
    burst(t, { freq: 1200, q: 0.7, dur: 0.08, gain: 0.3 });
  },
};

export function play(key) {
  if (!SOUNDS[key]) return;
  ac();
  SOUNDS[key](ctx.currentTime + 0.01);
}

// Play a recorded sound file (e.g. assets/sounds/click.mp3). If the file is missing
// or can't be decoded, play the synthesized `fallback` sound instead.
const fileCache = {};
export function playFile(url, fallback, maxDur = 0) {
  ac();
  if (!(url in fileCache)) {
    fileCache[url] = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((b) => ctx.decodeAudioData(b))
      .catch(() => null);
  }
  fileCache[url].then((buf) => {
    if (!buf) return play(fallback);
    const s = ctx.createBufferSource(), g = ctx.createGain(), t = ctx.currentTime;
    s.buffer = buf;
    s.connect(g).connect(master);
    s.start(t);
    if (maxDur) { // cut to maxDur seconds with a short fade, so it never clicks off
      g.gain.setValueAtTime(1, t + maxDur - 0.15);
      g.gain.linearRampToValueAtTime(0, t + maxDur);
      s.stop(t + maxDur + 0.02);
    }
  });
}

// ---------------------------------------------------------------------
// Placeholder music: an original four-chord loop (Fmaj7 · Em7 · Dm7 · Cmaj7),
// soft electric-piano-ish, with vinyl crackle. Swap for her song later.
// ---------------------------------------------------------------------
const CHORDS = [
  [53, 57, 60, 64], // Fmaj7
  [52, 55, 59, 62], // Em7
  [50, 53, 57, 60], // Dm7
  [48, 52, 55, 59], // Cmaj7
];
const BAR = 2.2; // seconds per chord
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
let musicBus, loopTimer, crackle, nextBar = 0, barIdx = 0;

function note(t, m, dur, gain) {
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o2.type = "triangle";
  o.frequency.value = midi(m); o2.frequency.value = midi(m) * 2.001;
  const g2 = ctx.createGain(); g2.gain.value = 0.12;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); o2.connect(g2).connect(g); g.connect(musicBus);
  o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}

function scheduleBars() {
  // keep ~2 bars scheduled ahead
  while (nextBar < ctx.currentTime + BAR * 2) {
    const ch = CHORDS[barIdx % CHORDS.length];
    ch.forEach((m, i) => note(nextBar + i * 0.035, m, BAR * 1.1, 0.07)); // soft strum
    note(nextBar, ch[0] - 12, BAR * 0.9, 0.09); // bass
    note(nextBar + BAR * 0.5, ch[2] + 12, 0.5, 0.03); // little top sparkle
    nextBar += BAR; barIdx++;
  }
}

export function startMusic() {
  ac();
  SOUNDS.needle(ctx.currentTime + 0.01);
  musicBus = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 1800;
  musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
  musicBus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.6);
  musicBus.connect(lp).connect(master);

  // vinyl crackle: sparse random pops through a highpass
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() < 0.0008 ? (Math.random() * 2 - 1) : (Math.random() * 2 - 1) * 0.004;
  crackle = ctx.createBufferSource(); crackle.buffer = buf; crackle.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1500;
  const cg = ctx.createGain(); cg.gain.value = 0.25;
  crackle.connect(hp).connect(cg).connect(musicBus);
  crackle.start();

  nextBar = ctx.currentTime + 0.25; barIdx = 0;
  scheduleBars();
  loopTimer = setInterval(scheduleBars, 500);
}

export function stopMusic() {
  if (!ctx || !musicBus) return;
  clearInterval(loopTimer);
  const bus = musicBus, cr = crackle;
  bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
  setTimeout(() => { try { cr.stop(); bus.disconnect(); } catch {} }, 900);
  musicBus = null; crackle = null;
}
