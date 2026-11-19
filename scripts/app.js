// app.js — motion orchestration, desk interactions, section rendering.
import { play, playFile } from "./sound.js?v=20261119g";
import { initMusic } from "./music.js?v=20261119g";
import { initBookshelf } from "./bookshelf.js?v=20261119g";
import { doodles } from "./doodles.js?v=20261119g";
import { initCup } from "./cup.js?v=20261119g";
import {
  meta, about, kit, tools, experience, projects, playlist, books, marquee,
} from "./content.js?v=20261119g";

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: "power3.out" });
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
// the desk intro plays once per browser session (boot() sets the flag)
let firstVisit = true;
try { firstVisit = sessionStorage.getItem("hy-booted") !== "1"; } catch {}
const isMobile = matchMedia("(max-width: 860px)").matches;
const canDrag = matchMedia("(pointer: fine)").matches; // mouse/trackpad: objects can be dragged (touch: tap only, so the page still scrolls)
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// bump with the ?v= in index.html whenever an image in assets/ is replaced, so browsers refetch it
const ASSET_V = "20261119g";

// ------------------------------------------------------------------
// Paris time + theme (light = Iced Latte / dark = Espresso). The lamp on the desk switches it; with no saved choice it follows the time of day in Paris (evening = lamp on).
// The <head> script applies the same rules before paint.
// ------------------------------------------------------------------
const root = document.documentElement;
const darkOS = matchMedia("(prefers-color-scheme: dark)");
function parisNow() {
  try {
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const g = (t) => +p.find((x) => x.type === t).value;
    return { h: g("hour"), m: g("minute"), s: g("second") };
  } catch { const d = new Date(); return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() }; }
}
const phaseOf = (h) => (h >= 6 && h < 11 ? "morning" : h >= 11 && h < 18 ? "day" : h >= 18 && h < 22 ? "evening" : "night");
const savedTheme = () => { try { const v = localStorage.getItem("theme"); return v === "light" || v === "dark" ? v : null; } catch { return null; } };
const autoTheme = (h) => (h >= 18 || h < 6 ? "dark" : darkOS.matches ? "dark" : "light");
const themeListeners = [];
function setTheme(t, save) {
  if (save) { try { localStorage.setItem("theme", t); } catch {} }
  if (root.dataset.theme === t) { themeListeners.forEach((f) => f(t)); return; }
  const go = () => { root.dataset.theme = t; themeListeners.forEach((f) => f(t)); };
  if (!reduced && document.startViewTransition) document.startViewTransition(go); else go();
}

// ------------------------------------------------------------------
// Single shared RAF: Lenis + GSAP ticker
// ------------------------------------------------------------------
let lenis;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, duration: 1.2, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
}

gsap.ticker.add((time) => {
  if (lenis) lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ------------------------------------------------------------------
// Boot — a short "brewing" loader, then the desk intro plays
// ------------------------------------------------------------------
function boot() {
  const boot = $("#boot");
  const log = $("#bootLog");
  const rule = $(".boot__rule i");
  const lines = ["GRINDING BEANS…", "BLOOMING · 30S", "POURING OVER…", "ENJOY ☕"];
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    gsap.timeline()
      .to(rule, { width: "100%", duration: 0.2, ease: "power2.inOut" })
      .to(boot, { opacity: 0, duration: 0.3, onComplete: () => boot.remove() })
      .add(hero, "-=0.2");
  };
  addEventListener("keydown", finish, { once: true });

  // seen it already this browser session (e.g. a refresh, or back from her CV): skip the loader
  let seen = false;
  try { seen = sessionStorage.getItem("hy-booted") === "1"; sessionStorage.setItem("hy-booted", "1"); } catch {}
  if (seen) { boot.remove(); hero(); return; }

  if (reduced) { log.textContent = lines.join("\n"); gsap.set(rule, { width: "100%" }); finish(); return; }

  // ~1s total: four lines, 0.2s apart, then a quick fade
  const tl = gsap.timeline({ onComplete: finish });
  lines.forEach((ln, i) => {
    tl.call(() => (log.textContent += (i ? "\n" : "") + ln), null, i * 0.2);
  });
  tl.to(rule, { width: "80%", duration: 0.75, ease: "none" }, 0);
  gsap.delayedCall(0.9, finish); // hard cap
}

// ------------------------------------------------------------------
// Hero = the desk. Objects settle onto the desk, then the name is
// written onto the notebook. (Timeline is built in passKit.)
// ------------------------------------------------------------------
let deskIntro = null;
function hero() {
  if (deskIntro) deskIntro.play();
}

// ------------------------------------------------------------------
// The desk. Desktop: objects laid out around the notebook, draggable; a click
// (without dragging) plays the object's sound. Headphones pop out her playlist (music.js).
// Clicking the camera ejects her photo as an instax print. Mobile: tap grid.
// ------------------------------------------------------------------
function passKit() {
  const grid = $("#kitGrid");
  const note = $("#kitNote");
  const desk = true; // the same desk scene on every screen size
  let top = 10;           // z-index counter: last touched object comes to the front
  let mode = "notebook";                        // "notebook" | "chaos"
  const place = (k) => (mode === "chaos" && k.chaos) || k.desk; // where an object sits in this mode

  // --- music: her Spotify playlist (pop-out card + fixed mini player) -------
  let music = { toggleCard() {}, closeCard() {} };
  try { music = initMusic({ playlist, gsap, reduced, isMobile, grid }); } catch (e) { console.error("[music]", e); }

  // --- sound toggle --------------------------------------------------
  // (sound on/off now lives in the fixed mini player, scripts/music.js)

  // Lamp = the dark-mode switch. Lit whenever the theme is Espresso (CSS: the shade glows and a
  // warm pool of light (.lamp-glow, inside the lamp, so it follows drags) spreads over the desk).
  let placeCone = () => {};
  const toggleLamp = () => setTheme(root.dataset.theme === "dark" ? "light" : "dark", true);

  // her handwriting (content.js kit.ink.hand): one <img> per written line
  const handImgs = (lines) => (lines || []).map((h) =>
    `<img class="hand" src="${h.src}?v=${ASSET_V}" alt="" width="${h.w}" height="${h.h}" style="rotate:${h.tilt || 0}deg" draggable="false" />`).join("");

  // --- objects -------------------------------------------------------
  kit.forEach((k, i) => {
    const b = document.createElement("button");
    b.className = `kit__item kit__item--${k.id}`;
    b.type = "button";
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", `${k.label.toLowerCase()}: ${k.alt}. Plays a sound.`);
    if (k.print) {
      // instax print: white frame, photo window, thicker bottom edge.
      // Hidden until the camera is clicked.
      b.setAttribute("aria-label", `Photo: ${k.alt}`);
      b.classList.add("is-hidden");
      b.innerHTML = `<span class="kit__img print"><img src="${k.img}?v=${ASSET_V}" alt="" width="${k.w}" height="${k.h}" loading="lazy" decoding="async" draggable="false" /></span>`;
    } else if (k.cup) {
      // cappuccino from above: saucer, cup + handle, real latte art, steam (on click)
      b.setAttribute("aria-label", `${k.alt}. Plays a sound.`);
      b.innerHTML = `
      <span class="kit__img cup" aria-hidden="true">
        <span class="cup__saucer"></span><span class="cup__handle"></span>
        <span class="cup__body"><span class="cup__crema"><img src="${k.img}?v=${ASSET_V}" alt="" width="${k.w}" height="${k.h}" loading="eager" decoding="async" draggable="false" /></span></span>
        <span class="cup__steam"><i></i><i></i><i></i></span>
      </span>`;
    } else {
      b.innerHTML = `
      <span class="kit__img"><img src="${k.img}?v=${ASSET_V}" alt="" width="${k.w}" height="${k.h}" loading="eager" decoding="async"${k.ink ? ' fetchpriority="high"' : ""} draggable="false" />${
        k.ink ? `<span class="kit__ink" aria-hidden="true"><span class="kit__sign"><img src="assets/signature.png?v=${ASSET_V}" alt="" width="959" height="131" draggable="false" /></span>${
          k.ink.lines.map((l, j) => `<span class="kit__type">${handImgs(k.ink.hand?.[j]) || l}</span>`).join("")}</span>` : ""
      }</span>`;
    }
    if (k.id === "camera") b.setAttribute("aria-label", "Camera: take a photo");
    if (k.id === "lamp") {
      // warm pool + light cone (behind the lamp, on the desk) and a bead pull-chain under the shade
      $(".kit__img", b).insertAdjacentHTML("afterbegin", '<span class="lamp-glow" aria-hidden="true"></span>');
      // the light cone lives on the desk itself, above the objects, so its light falls on them;
      // it's placed under the lamp's shade (in % of the desk, so resizing keeps it in place)
      grid.insertAdjacentHTML("beforeend", '<span class="lamp-cone" aria-hidden="true"><i></i></span>');
      const cone = $(".lamp-cone", grid);
      placeCone = () => {
        const g = grid.getBoundingClientRect(), r = b.getBoundingClientRect();
        if (!g.width) return;
        cone.style.left = ((r.left + r.width / 2 - g.left) / g.width) * 100 + "%";
        cone.style.top = ((r.top + r.height * 0.4 - g.top) / g.height) * 100 + "%";
        cone.style.width = (r.width * 3.2 / g.width) * 100 + "%";
        cone.style.height = (r.height * 1.5 / g.height) * 100 + "%";
      };
      b.addEventListener("pointerup", () => requestAnimationFrame(placeCone)); // after a drag
      requestAnimationFrame(placeCone);
      $(".kit__img", b).insertAdjacentHTML("beforeend", `<svg class="lamp-chain" viewBox="0 0 10 60" aria-hidden="true" focusable="false">
        ${Array.from({ length: 11 }, (_, i) => `<circle cx="5" cy="${2 + i * 4.2}" r="1.35"/>`).join("")}
        <path class="lamp-chain__pull" d="M5 47 q-3.2 0 -3.2 4.5 q0 6.5 3.2 7.5 q3.2 -1 3.2 -7.5 q0 -4.5 -3.2 -4.5z"/></svg>`);
      const syncLamp = (t) => {
        placeCone();
        const on = t === "dark";
        b.setAttribute("aria-pressed", String(on));
        b.setAttribute("aria-label", "Toggle lamp (dark mode)");
        b.title = on ? "Switch the lamp off" : "Switch the lamp on";
      };
      themeListeners.push(syncLamp); syncLamp(root.dataset.theme);
    }
    if (k.id === "alarm") clockFace(b);
    if (k.sound === "music") { b.setAttribute("aria-label", "Headphones: open my playlist"); b.setAttribute("aria-expanded", "false"); }
    b.style.setProperty("--r", `${k.desk.r}deg`);
    if (desk) {
      b.style.left = k.desk.x + "%";
      b.style.top = k.desk.y + "%";
      b.style.width = k.desk.w + "%";
      b.style.zIndex = k.id === "pen" ? 55 : i + 1; // the pen always lies on top of everything
    }

    // click = activate (keyboard Enter/Space also lands here)
    let dragged = false;
    b.addEventListener("click", (e) => {
      if (dragged) { dragged = false; return; } // that was the end of a drag
      if (e.detail) b.blur(); // mouse click: no focus box (keyboard users keep it)
      if (k.ink) { // notebook: the writing replays (no sound, the book itself stays still)
        rewriteNotebook();
        return;
      }
      if (k.sound === "music") {
        music.toggleCard(b);
      } else {
        // cup: one sip of coffee (assets/sounds/sip.mp3, Pixabay "slurp" by freesound_community):
        // skip its 0.09s of silence, play the first sip only (0.75s, the second slurp is cut). Synth if missing.
        if (k.cup) playFile("assets/sounds/sip.mp3", "sip", 0.75, 0.09);
        // alarm / clip: a recorded effect if saved as assets/sounds/<ring|snap>.mp3, else the 2s synth
        else if (k.sound === "ring" || k.sound === "snap") playFile(`assets/sounds/${k.sound}.mp3`, k.sound, 2);
        else if (k.sound === "lamp") { // pull the chain: it swings and settles (~0.4s), the light switches
          playFile("assets/sounds/lamp.mp3", "lamp", 1);
          if (!reduced) gsap.fromTo($(".lamp-chain", b), { rotation: 0, y: 0 }, { keyframes: [
            { y: 3, rotation: 0, duration: 0.07, ease: "power1.out" },
            { y: 0, rotation: 16, duration: 0.1, ease: "power1.out" },
            { rotation: -10, duration: 0.1, ease: "sine.inOut" },
            { rotation: 5, duration: 0.08, ease: "sine.inOut" },
            { rotation: 0, duration: 0.1, ease: "sine.out" },
          ] });
          toggleLamp();
        }
        else play(k.sound);
        if (k.sound === "shutter") ejectPrint();
        if (k.cup) steam(b);
      }
      note.textContent = k.note || "";
      if (!reduced && k.id === "alarm") { // the alarm clock rattles while it rings
        gsap.fromTo(b.querySelector(".kit__img"), { rotate: 0, x: 0 }, // whole clock, live face included
          { keyframes: [...Array(32)].map((_, i) => ({ rotate: i % 2 ? -5 : 5, x: i % 2 ? -1.5 : 1.5, duration: 0.056 }))
              .concat({ rotate: 0, x: 0, duration: 0.25, ease: "elastic.out(1,0.5)" }) });
      } else if (!reduced && !k.cup && k.sound !== "lamp") { // the cup only steams; everything else does a little hop
        // (the polaroid hops as one piece: frame and photo together)
        gsap.fromTo(b.querySelector(k.print ? ".print" : "img"), { y: 0, rotate: 0 },
          { keyframes: [{ y: -14, rotate: -4, duration: 0.18 }, { y: 0, rotate: 0, duration: 0.5, ease: "elastic.out(1,0.45)" }] });
      }
    });

    // drag (mouse/trackpad only; on touch screens a drag would fight scrolling). Objects can go anywhere on the page, not just the desk:
    // they're only kept inside the page itself (left/right edges, top/bottom of the
    // document). Dragging near the top/bottom of the window scrolls the page, so an
    // object can be carried down into any section. Offsets live in --dx/--dy so the
    // tilt stays intact.
    if (canDrag) {
      let sx, sy, sScroll, ox, oy, minX, maxX, minY, maxY, moving = false, px = 0, py = 0, raf = 0;
      const scrollY = () => (lenis ? lenis.scroll : window.scrollY);
      const place = () => {
        const dx = px - sx, dy = py + scrollY() - (sy + sScroll); // page-space movement
        b.style.setProperty("--dx", Math.min(maxX, Math.max(minX, ox + dx)) + "px");
        b.style.setProperty("--dy", Math.min(maxY, Math.max(minY, oy + dy)) + "px");
      };
      const edgeScroll = () => { // auto-scroll while the pointer is near the window's top/bottom
        if (!moving || !dragged) return;
        const zone = 70, h = window.innerHeight;
        const v = py > h - zone ? (py - (h - zone)) / zone : py < zone ? -(zone - py) / zone : 0;
        if (v) {
          const to = scrollY() + v * 18;
          if (lenis) lenis.scrollTo(to, { immediate: true }); else window.scrollTo(0, to);
          place();
        }
        raf = requestAnimationFrame(edgeScroll);
      };
      b.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        try { b.setPointerCapture(e.pointerId); } catch {} // keeps the drag even if the cursor outruns the object
        b.style.zIndex = k.id === "pen" ? 55 : Math.min(++top, 54); // above every section, below the logo; the pen stays on top
        sx = px = e.clientX; sy = py = e.clientY; sScroll = scrollY();
        ox = parseFloat(b.style.getPropertyValue("--dx")) || 0;
        oy = parseFloat(b.style.getPropertyValue("--dy")) || 0;
        // limits: stay within the page (a quarter of the object may hang off the side)
        const r = b.getBoundingClientRect(), docW = document.documentElement.clientWidth;
        const docTop = r.top + scrollY(), docH = document.documentElement.scrollHeight;
        minX = ox - r.left - r.width * 0.25;            maxX = ox + (docW - r.right) + r.width * 0.25;
        minY = oy - docTop;                             maxY = oy + (docH - docTop - r.height);
        moving = true; dragged = false;
      });
      b.addEventListener("pointermove", (e) => {
        if (!moving) return;
        px = e.clientX; py = e.clientY;
        if (!dragged && Math.hypot(px - sx, py - sy) < 5) return; // tiny jitter still counts as a click
        if (!dragged) { dragged = true; raf = requestAnimationFrame(edgeScroll); if (k.sound === "music") music.closeCard(); }
        b.classList.add("is-dragging");
        place();
      });
      const end = () => { moving = false; cancelAnimationFrame(raf); b.classList.remove("is-dragging"); };
      b.addEventListener("pointerup", end);
      b.addEventListener("pointercancel", end);
    }
    grid.appendChild(b);
  });

  // --- camera click: like a real instax mini Evo, the print slides out of the
  //     camera's short side (the right-hand edge as it lies on the desk), photo
  //     top first and milky white. Then it is pulled out, dropped beside the
  //     camera, and develops. ---------------------------------------------------
  const printBtn = $(".kit__item--print"), camBtn = $(".kit__item--camera");
  const printSpec = kit.find((k) => k.print), camSpec = kit.find((k) => k.id === "camera");
  let ejectTl = null;

  function developPrint() {
    const pr = printBtn.querySelector(".print");
    pr.classList.remove("is-developing");
    void pr.offsetWidth; // restart the CSS animation
    pr.classList.add("is-developing");
  }

  function ejectPrint() {
    if (!printBtn || !camBtn) return;
    if (ejectTl) ejectTl.kill();
    printBtn.classList.remove("is-hidden");
    developPrint();
    if (reduced) return;
    if (!desk) { // phones: the print just slides in next to the camera
      gsap.fromTo(printBtn, { opacity: 0, "--s": 0.8 }, { opacity: 1, "--s": 1, duration: 0.6 });
      return;
    }
    const v = (el, n) => parseFloat(el.style.getPropertyValue(n)) || 0;
    const camDx = v(camBtn, "--dx"), camDy = v(camBtn, "--dy");
    // camera body size + centre (offsets ignore transforms; minus the button's padding)
    const pad = parseFloat(getComputedStyle(camBtn).paddingLeft) || 0;
    const camW = camBtn.offsetWidth - pad * 2, camH = camW * (camSpec.h / camSpec.w);
    const camCx = camBtn.offsetLeft + camBtn.offsetWidth / 2 + camDx;
    const camCy = camBtn.offsetTop + camBtn.offsetHeight / 2 + camDy;
    const a = (place(camSpec).r * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
    // print resting centre (no padding on the print button on desktop)
    const prCx = printBtn.offsetLeft + printBtn.offsetWidth / 2;
    const prCy = printBtn.offsetTop + printBtn.offsetHeight / 2;
    // real proportions: a mini print is ~56% of the camera's short side wide
    const s = (camH * 0.56) / printBtn.offsetWidth;
    const hS = printBtn.offsetHeight * s;
    const slot = camW / 2 - 4; // just inside the right-hand edge
    // a point along the camera's own x-axis (local) → desk offsets for the print
    const at = (lx) => ({
      "--dx": camCx + lx * cos - prCx + "px",
      "--dy": camCy + lx * sin - prCy + "px",
    });
    const out = (f) => slot - hS / 2 + f * hS; // print centre when fraction f is outside

    camBtn.style.zIndex = top = Math.min(top + 1, 54);
    printBtn.style.zIndex = top - 1; // tucked behind the camera while it ejects
    ejectTl = gsap.timeline()
      // photo top points out of the slot: rotate a quarter-turn from the camera's tilt
      .set(printBtn, { ...at(out(0)), "--s": s, "--r": `${place(camSpec).r + 90}deg`, clipPath: "inset(0% 0% 100% 0%)" })
      // motor pushes it out ~80% (the part outside the slot is what you see)
      .to(printBtn, { ...at(out(0.8)), clipPath: "inset(0% 0% 20% 0%)", duration: 1.3, ease: "power1.inOut" })
      // a beat, then it is pulled free...
      .to(printBtn, { ...at(out(1.15)), clipPath: "inset(0% 0% 0% 0%)", duration: 0.25, ease: "power1.in" }, "+=0.35")
      .call(() => { printBtn.style.zIndex = top = Math.min(top + 1, 54); })
      // ...and dropped beside the camera
      .to(printBtn, {
        "--dx": camDx + "px", "--dy": camDy + "px", "--s": 1, "--r": `${place(printSpec).r}deg`,
        duration: 0.8, ease: "back.out(1.3)",
      });
  }

  // --- notebook click: a small zoom-in on the writing, then it settles back.
  //     (The text is NOT rewritten on click; that only happens once, on load.) No sound.
  let inkTl = null;
  function rewriteNotebook() {
    const ink = $(".kit__ink");
    if (!ink || reduced) return;
    if (inkTl) inkTl.kill();
    inkTl = gsap.fromTo(ink, { scale: 1 }, { keyframes: [
      { scale: 1.07, duration: 0.35, ease: "power2.out" },
      { scale: 1, duration: 0.9, ease: "power2.inOut" },
    ] });
  }

  // --- intro (first visit of the session only; reduced motion: none) ---
  // 1) The desk starts empty; someone sits down to work: the notebook slides in, the pen rolls
  //    in, the cup is set down, then camera, lamp, headphones, clock, clip and folder (~1.5s).
  //    Each object's shadow fades in as it lands.
  // 2) The pen lifts and writes her name, title and tagline in her own handwriting: each line is
  //    revealed left to right with the pen tip on the reveal edge. Then the pen goes back to rest.
  if (!reduced && firstVisit) {
    const W = () => grid.offsetWidth;
    const item = (id) => $(`.kit__item--${id}`, grid);
    const pen = item("pen"), nb = item("notebook");
    const lines = $$(".kit__sign img, .kit__type .hand", grid);
    // how each object arrives (offsets in % of the desk width, so phones match laptops)
    const arrive = {
      notebook: { dy: 0.06 }, pen: { dx: 0.1, dy: -0.03 }, cup: { dy: -0.02, s: 1.1 },
      camera: { dx: -0.07 }, lamp: { dy: -0.05, s: 1.04 }, headphones: { dx: -0.06 },
      alarm: { dy: -0.04 }, clip: { s: 1.25 },
    };
    const order = Object.keys(arrive).map(item).filter(Boolean);
    const folderEl = $("#folder");
    gsap.set(order, { opacity: 0 });
    order.forEach((el) => el.classList.add("is-airborne"));
    if (folderEl) gsap.set(folderEl, { opacity: 0, y: 12 });
    gsap.set(lines, { clipPath: "inset(-40% 100% -40% -5%)" });
    // the pen photo shows the nib out: hide its metal tip (the last 3.6% of the pen) until the click
    const penPic = pen && $("img", pen);
    if (penPic) gsap.set(penPic, { clipPath: "inset(0% 0% 3.6% 0%)" });

    deskIntro = gsap.timeline({ paused: true, onStart: () => grid.classList.add("is-intro") });
    order.forEach((el, i) => {
      const a = arrive[Object.keys(arrive)[i]];
      deskIntro.fromTo(el,
        { opacity: 0, "--dx": (a.dx || 0) * W() + "px", "--dy": (a.dy || 0) * W() + "px", "--s": a.s || 1 },
        { opacity: 1, "--dx": "0px", "--dy": "0px", "--s": 1, duration: 0.4, ease: "power2.out",
          onComplete: () => el.classList.remove("is-airborne") }, i * 0.13);
    });
    if (folderEl) deskIntro.to(folderEl, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", clearProps: "transform,opacity" }, order.length * 0.13);

    // the writing: positions are measured when it starts (everything has landed by then)
    deskIntro.add(() => {
      placeCone(); // everything has landed: put the lamp's light where the lamp now is
      if (!pen || !nb || !lines.length) { gsap.set(lines, { clipPath: "none" }); return; }
      const g = grid.getBoundingClientRect();
      const deg = (el) => parseFloat(getComputedStyle(el).getPropertyValue("--r")) || 0;
      const rp = deg(pen) * Math.PI / 180;
      const pr = pen.getBoundingClientRect(), penImg = $("img", pen);
      // the writing point = the tip of the nib: in the upright pen photo it's 34.9% across (the clip on
      // the right makes the picture wider than the barrel) and at the very bottom (measured from
      // pen.avif); then everything turns with the pen's tilt
      const ox = penImg.offsetWidth * (0.349 - 0.5);
      const oy = penImg.offsetHeight * (0.999 - 0.5);
      const tip0 = { x: pr.left + pr.width / 2 - g.left + ox * Math.cos(rp) - oy * Math.sin(rp),
                     y: pr.top + pr.height / 2 - g.top + ox * Math.sin(rp) + oy * Math.cos(rp) };
      const to = (pt) => ({ "--dx": pt.x - tip0.x + "px", "--dy": pt.y - tip0.y + "px" });
      const tl = gsap.timeline({ onComplete: () => {
        gsap.set(lines, { clearProps: "clipPath" });
        grid.classList.remove("is-intro");
      } });
      const widths = lines.map((im) => im.offsetWidth), total = widths.reduce((x, y) => x + y, 0);
      // a retractable pen: click it before writing and again when it's put down. The plunger end
      // dips toward the nib and springs back. The click sound only plays if the visitor has already
      // interacted with the page (never autoplayed; a blocked sound would otherwise play late).
      const penBody = $(".kit__img", pen);
      const clickPen = () => { // plunger pressed: the pen gives a little, the nib slides out
        const tlc = gsap.timeline();
        tlc.to(penBody, { scaleY: 0.955, transformOrigin: "50% 100%", duration: 0.06, ease: "power2.in" })
          .call(() => { if (navigator.userActivation?.hasBeenActive) play("click"); })
          .to(penImg, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.1, ease: "power2.out", onComplete: () => gsap.set(penImg, { clearProps: "clipPath" }) })
          .to(penBody, { scaleY: 1, duration: 0.14, ease: "back.out(3)", clearProps: "transform" }, "<");
        return tlc;
      };
      tl.add(clickPen()).to(pen, { "--s": 1.08, duration: 0.15, ease: "power1.out" }, "+=0.08"); // click, then lift
      lines.forEach((im, i) => {
        const r = im.getBoundingClientRect();
        const th = (deg(nb) + (parseFloat(im.style.rotate) || 0)) * Math.PI / 180;
        const cx = r.left + r.width / 2 - g.left, cy = r.top + r.height / 2 - g.top;
        const hw = im.offsetWidth / 2, low = im.offsetHeight * 0.18; // a little under the middle: the writing line
        const nx = -Math.sin(th) * low, ny = Math.cos(th) * low;
        const start = { x: cx - hw * Math.cos(th) + nx, y: cy - hw * Math.sin(th) + ny };
        const end = { x: cx + hw * Math.cos(th) + nx, y: cy + hw * Math.sin(th) + ny };
        const dur = Math.max(0.28, 1.7 * widths[i] / total);
        tl.to(pen, { ...to(start), "--s": 1.08, duration: i ? 0.2 : 0.3, ease: "power2.inOut" }) // travel, lifted
          .to(pen, { "--s": 1, duration: 0.06 })                                                  // nib down
          .to(im, { clipPath: "inset(-40% -5% -40% -5%)", duration: dur, ease: "none" }, "<")
          .to(pen, { ...to(end), duration: dur, ease: "none" }, "<");
      });
      tl.to(pen, { "--dx": "0px", "--dy": "0px", "--s": 1, duration: 0.45, ease: "power2.inOut" }); // back to rest; the nib stays out
    }, "+=0.15");
  }

  // --- cup click: a curl of steam rises (restarts the CSS animation) ---
  function steam(b) {
    const s = b.querySelector(".cup__steam");
    s.classList.remove("is-on"); void s.offsetWidth; s.classList.add("is-on");
  }

  // --- desk modes: "notebook" (tidy, name written in the notebook) and "chaos"
  //     (objects scattered and tilted; name, title and tagline spill onto the desk).
  //     Any drag offsets are cleared so everything lands in its spot for the mode.
  const chaosInk = $("#chaosInk");
  const nbInk = $(".kit__ink");
  if (chaosInk) {
    const inkData = kit.find((k) => k.ink).ink;
    const [title, tagline] = inkData.lines.map((l, j) => handImgs(inkData.hand?.[j]) || l);
    chaosInk.innerHTML = `
      <span class="chaos-ink__name"><img src="assets/signature.png?v=${ASSET_V}" alt="" width="959" height="131" draggable="false" /></span>
      <span class="chaos-ink__title">${title}</span>
      <span class="chaos-ink__tag">${tagline}</span>`;
  }
  const modeBtns = $$(".modes__btn");
  function setMode(next) {
    if (next === mode) return;
    mode = next;
    modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    grid.classList.toggle("is-chaos", mode === "chaos");
    const t = reduced ? 0 : 0.9;
    kit.forEach((k, i) => {
      const b = $(`.kit__item--${k.id}`), p = place(k);
      if (!b) return;
      gsap.to(b, { left: p.x + "%", top: p.y + "%", width: p.w + "%", "--r": `${p.r}deg`,
        "--dx": "0px", "--dy": "0px", duration: t, ease: "power3.inOut", delay: reduced ? 0 : i * 0.04 });
    });
    music.closeCard();
    gsap.delayedCall(t + 0.1, () => placeCone()); // the lamp moved
    // the writing: off the notebook pages and onto the desk (or back)
    gsap.to(nbInk, { opacity: mode === "chaos" ? 0 : 1, duration: t * 0.5 });
    if (mode === "chaos") {
      gsap.fromTo(chaosInk.children, { opacity: 0, y: 18, rotation: 0 },
        { opacity: 1, y: 0, rotation: 0, duration: t, ease: "back.out(1.6)", stagger: reduced ? 0 : 0.08, delay: t * 0.3 });
    } else {
      gsap.to(chaosInk.children, { opacity: 0, duration: t * 0.4 });
    }
    play("page");
  }
  modeBtns.forEach((b) => b.addEventListener("click", (e) => { if (e.detail) b.blur(); setMode(b.dataset.mode); }));

}

// ------------------------------------------------------------------
// Folder at the top of the desk: click it and the tool icons pop out
// together, fanning into an arc below it. Click again (or press Esc) to
// tuck them back in. Mobile: they open as a grid under the folder.
// ------------------------------------------------------------------
function passToolkit() {
  const folder = $("#folder"), list = $("#toolkit");
  if (!folder || !list) return;
  list.innerHTML = tools.map((t) =>
    `<li class="tool"><span class="tool__tile${t.tile === "full" ? " tool__tile--full" : ""}"${t.bg ? ` style="background:${t.bg}"` : ""}><img src="${t.icon}" alt="" loading="lazy" decoding="async" /></span><span class="tool__name">${t.name}</span></li>`).join("");
  const items = $$(".tool", list);
  let open = false, tl = null;
  // folder centre in page space (includes any drag offset)
  const centreX = () => folder.offsetLeft + gsap.getProperty(folder, "x") + folder.offsetWidth / 2;
  // park the (zero-size) tool list on the folder's centre: the icons are placed around it
  const anchor = () => {
    list.style.left = centreX() + "px";
    list.style.top = folder.offsetTop + gsap.getProperty(folder, "y") + folder.offsetHeight * 0.4 + "px";
  };

  // fan positions (px offsets from the folder's centre): icons spread sideways along a
  // soft curve, leaving a clear gap around the folder. Normally half go each side; if
  // one side runs out of screen, the extra icons move to the other side instead of
  // sliding over the folder.
  const fan = () => {
    const fw = folder.offsetWidth, n = items.length;
    const tw = items[0] ? items[0].offsetWidth : 62; // icon width (62px; smaller on phones)
    let step = Math.max(tw * 1.16, fw * 1.15);
    const gap = Math.max(tw * 1.13, fw * 1.1), half = tw * 0.65;
    const gl = list.offsetParent ? list.offsetParent.getBoundingClientRect().left : 0;
    const cx = gl + centreX(), vw = document.documentElement.clientWidth;
    const roomL = cx - 8, roomR = vw - 8 - cx;
    const fits = (room) => (room < gap + half ? 0 : Math.floor((room - gap - half) / step) + 1);
    let capL = fits(roomL), capR = fits(roomR);
    if (capL + capR < n) {
      // not even the two sides together fit them all: tighten the spacing evenly
      // so every icon still fits (both sides keep the same, equal step)
      const usable = Math.max(0, roomL - gap - half) + Math.max(0, roomR - gap - half);
      const sides = (roomL >= gap + half ? 1 : 0) + (roomR >= gap + half ? 1 : 0);
      step = Math.max(tw * 0.71, usable / Math.max(1, n - sides));
      capL = fits(roomL); capR = fits(roomR);
    }
    let nL = Math.floor(n / 2);                       // odd count: extra one goes right
    nL = Math.min(nL, capL);                          // not enough room on the left
    nL = Math.max(nL, n - capR);                      // not enough room on the right
    nL = Math.max(0, Math.min(n, nL));
    const nR = n - nL, deep = Math.max(nL, nR, 1);
    return items.map((_, i) => {
      const left = i < nL, j = left ? nL - 1 - i : i - nL; // 0 = next to the folder
      const x = (left ? -1 : 1) * (gap + j * step);
      const k = (j + 1) / deep;
      return { x, y: fw * 0.25 * k * k, r: (left ? -1 : 1) * k * 7 };
    });
  };

  // re-place an open fan around the folder's current spot (no animation)
  const relayout = () => {
    if (!open) return;
    anchor();
    const pos = fan();
    items.forEach((it, i) => gsap.set(it, { x: pos[i].x, y: pos[i].y, rotate: pos[i].r }));
  };

  const set = (on) => {
    open = on;
    folder.setAttribute("aria-expanded", String(on));
    list.classList.toggle("is-open", on);
    if (tl) tl.kill();
    // park the list on the folder's centre, then fan the icons out from there
    anchor(); // level with the folder, wherever it has been dragged
    const pos = fan();
    if (reduced) {
      items.forEach((it, i) => gsap.set(it, on ? { x: pos[i].x, y: pos[i].y, rotate: pos[i].r, scale: 1, opacity: 1 } : { opacity: 0 }));
      return;
    }
    tl = on
      ? gsap.timeline().fromTo(items,
          { x: 0, y: 0, scale: 0.3, rotate: 0, opacity: 0 },
          { x: (i) => pos[i].x, y: (i) => pos[i].y, rotate: (i) => pos[i].r, scale: 1, opacity: 1,
            duration: 0.6, ease: "back.out(1.7)", stagger: { each: 0.015, from: "center" } })
      : gsap.timeline().to(items, { x: 0, y: 0, scale: 0.3, rotate: 0, opacity: 0, duration: 0.35, ease: "power2.in", stagger: { each: 0.01, from: "edges" } });
  };

  folder.addEventListener("click", (e) => {
    if (e.detail) folder.blur(); // mouse click: no focus box (keyboard users keep it)
    playFile("assets/sounds/click.mp3", "mouseclick"); // her Pixabay click if present, else synth
    if (!reduced) gsap.fromTo(folder, { scale: 1 }, { keyframes: [{ scale: 1.12, duration: 0.12 }, { scale: 1, duration: 0.4, ease: "elastic.out(1,0.4)" }] });
    set(!open);
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && open) set(false); });
  // clicking anywhere outside the folder and its tools closes the stack
  document.addEventListener("pointerdown", (e) => {
    if (open && !folder.contains(e.target) && !list.contains(e.target)) set(false);
  });

  // the folder is draggable (desktop); an open fan travels with it. A press that
  // doesn't move is still a normal click (opens/closes the stack).
  if (canDrag) {
    let sx, sy, ox, oy, moving = false, moved = false;
    folder.style.cursor = "grab";
    folder.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      try { folder.setPointerCapture(e.pointerId); } catch {}
      sx = e.clientX; sy = e.clientY;
      ox = gsap.getProperty(folder, "x"); oy = gsap.getProperty(folder, "y");
      moving = true; moved = false;
    });
    folder.addEventListener("pointermove", (e) => {
      if (!moving) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true; folder.style.cursor = "grabbing";
      folder.style.zIndex = 56; list.style.zIndex = 57; // above the desk objects while it travels
      gsap.set(folder, { x: ox + dx, y: oy + dy });
      if (open) relayout(); // icons re-flow around the folder as it moves
    });
    const end = () => { moving = false; folder.style.cursor = "grab"; setTimeout(() => { moved = false; }, 0); };
    folder.addEventListener("pointerup", end);
    folder.addEventListener("pointercancel", end);
    // the click that ends a drag must not toggle the stack
    folder.addEventListener("click", (e) => { if (moved) { e.stopImmediatePropagation(); moved = false; } }, true);
  }
  // keep an open fan attached to the folder if the window is resized
  addEventListener("resize", relayout);
}

// ------------------------------------------------------------------
// The Story So Far: a flip-book notebook (content.js `experience[].book`), one spread per role,
// newest first. Left page = company logo (taped, slightly tilted) + name + city/dates; right page = what she did.
//
// One set of HTML for every layout (CSS decides):
//   photo 1 (left page) | leaf 1 = [role 1 text | back: photo 2] | leaf 2 = [role 2 | back: photo 3] | role 3
// Desktop (>= 900px, motion OK): the leaves lie on the right page, leaf 1 on top. The section pins
// and the scroll turns leaf 1, then leaf 2, around the spine (rotateY 0 -> -180deg), so each turn
// shows the next photo on the left and the next text on the right. A shade sweeps over the turning
// page. Phones / reduced motion: the leaves "dissolve" (display: contents) and the six faces stack
// as three single pages (photo, then text). Text is real HTML; tape, rules and doodles are aria-hidden.
// ------------------------------------------------------------------
function pass03() {
  const root3 = $("#flip");
  const roles = experience.filter((e) => e.type === "work" && e.book);
  if (!root3 || roles.length !== 3) return;

  // left page: the company's logo (a square tile, taped on, slightly tilted), its name, city + dates.
  // The name is written out, so the logo itself is decorative (alt="").
  const photo = (e, n, cls = "") => `
    <div class="flip__face flip__photo ${cls}" data-n="${n}"><div class="flip__in">
      <span class="flip__logo" style="--tilt:${e.book.tilt}deg">
        <span class="flip__tape" aria-hidden="true"></span>
        <img src="${e.book.logo}?v=${ASSET_V}" alt="" width="480" height="480" loading="lazy" decoding="async" draggable="false" />
      </span>
      <p class="flip__company">${e.book.company}</p>
      <p class="flip__meta mono">${e.book.meta}</p>
    </div></div>`;
  const text = (e, n, cls = "") => `
    <article class="flip__face flip__text ${cls}" data-n="${n}" aria-labelledby="flip-role-${n}"><div class="flip__in">
      <h3 class="flip__role" id="flip-role-${n}">${e.role}</h3>
      <p class="flip__result">${e.book.result}</p>
      <p class="flip__line">${e.book.line}</p>
      ${e.link ? `<a class="flip__link" href="${e.link}" target="_blank" rel="noopener">Visit ${e.org}<span class="visually-hidden"> (opens in a new tab)</span></a>` : ""}
      <span class="flip__doodle-wrap" aria-hidden="true">${doodles[e.book.doodle] || ""}</span>
    </div></article>`;
  const [a, b, c] = roles;
  root3.innerHTML = `
    <div class="flip__book">
      <span class="flip__cover" aria-hidden="true"></span>
      <div class="flip__spread">
        ${photo(a, 1, "flip__left")}
        <div class="flip__leaf flip__leaf--1">${text(a, 1, "flip__front")}${photo(b, 2, "flip__back")}<span class="flip__shade" aria-hidden="true"></span></div>
        <div class="flip__leaf flip__leaf--2">${text(b, 2, "flip__front")}${photo(c, 3, "flip__back")}<span class="flip__shade" aria-hidden="true"></span></div>
        ${text(c, 3, "flip__right")}
      </div>
    </div>
    <div class="flip__dots" role="group" aria-label="Notebook pages">
      ${roles.map((e, i) => `<button type="button" class="flip__dot" data-i="${i}" aria-label="Page ${i + 1}: ${e.role}">${i + 1}</button>`).join("")}
    </div>`;

  // page turning: desktop with motion only (the CSS uses the same condition for the 3D layout)
  const mm = gsap.matchMedia();
  mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
    const leaves = $$(".flip__leaf", root3);
    const shades = leaves.map((l) => $(".flip__shade", l));
    const dots = $$(".flip__dot", root3);
    // timeline in "turns": leaf 1 turns over 0..1, a short rest, leaf 2 over 1.25..2.25, rest
    gsap.set(leaves, { transformPerspective: 1600, transformOrigin: "0% 50%" }); // perspective ~1600px, hinged on the spine
    const sync = () => {
      const turned = leaves.map((l) => (gsap.getProperty(l, "rotationY") || 0) < -90);
      // a turned leaf lies on the left, above the earlier ones
      leaves.forEach((l, i) => { l.style.zIndex = turned[i] ? 10 + i : 3 - i; });
      // only the visible text can be reached with the keyboard
      $$(".flip__front", root3).forEach((f, i) => { f.inert = turned[i] || (i > 0 && !turned[i - 1]); });
      const at = turned[1] ? 2 : turned[0] ? 1 : 0;
      dots.forEach((d, i) => d.setAttribute("aria-current", i === at ? "true" : "false"));
    };
    const tl = gsap.timeline({ defaults: { ease: "none" }, onUpdate: sync });
    leaves.forEach((leaf, i) => {
      const t0 = i * 1.25;
      tl.fromTo(leaf, { rotationY: 0 }, { rotationY: -180, duration: 1, ease: "power1.inOut" }, t0)
        // the shade darkens the page as it lifts toward the reader, then clears as it lands
        .fromTo(shades[i], { opacity: 0 }, { opacity: 0.32, duration: 0.5, ease: "power1.in" }, t0)
        .to(shades[i], { opacity: 0, duration: 0.5, ease: "power1.out" }, t0 + 0.5);
    });
    tl.to({}, { duration: 0.2 }); // a beat on the last spread before the page scrolls on
    const total = tl.duration();
    const stops = [0, 1.1 / total, 2.35 / total]; // progress at which each spread is fully open

    const st = ScrollTrigger.create({
      trigger: "#p03", start: "top top", end: "+=" + Math.round(innerHeight * 2.5), pin: true, scrub: 0.6,
      animation: tl,
    });
    sync();
    dots.forEach((d, i) => d.addEventListener("click", () => {
      const y = st.start + (st.end - st.start) * stops[i] + 2;
      if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else scrollTo(0, y);
    }));
    return () => { leaves.forEach((l) => { l.style.zIndex = ""; }); $$(".flip__front", root3).forEach((f) => { f.inert = false; }); };
  });
}

// ------------------------------------------------------------------
// PASS 05 — Case studies. Each row opens its deck in a viewer on the same page.
// A project with `slides` (image paths) shows those images; otherwise the deck is
// built from the project's own text (context, audit, findings, recommendation, impact).
// ------------------------------------------------------------------
function deckSlides(p) {
  if (p.slides && p.slides.length) {
    return p.slides.map((src, i) =>
      `<figure class="slide slide--img"><img src="${src}" alt="${p.client}, slide ${i + 1}" loading="lazy" decoding="async" /></figure>`);
  }
  const text = (label, body, cls = "") =>
    `<section class="slide ${cls}"><p class="slide__label mono">${label}</p><p class="slide__body">${body}</p></section>`;
  return [
    `<section class="slide slide--cover">
       <p class="slide__label mono">${[p.kind, p.when].filter(Boolean).join(" · ")}</p>
       <h3 class="slide__client display">${p.client}</h3>
       <p class="slide__score"><b>${p.score}</b><span class="mono">${p.scoreLabel}</span></p>
     </section>`,
    text("Context", p.context + (p.mine ? `<span class="slide__mine"><b class="mono">My part</b> ${p.mine}</span>` : "")),
    text("What we audited", p.audited),
    text("What we found", p.found),
    text("What we recommended", p.recommended),
    text("Impact", p.impact, "slide--impact"),
  ];
}

function pass05() {
  const list = $("#workList");
  const dlg = $("#deck"), stage = $("#deckStage"), dots = $("#deckDots");
  const count = $("#deckCount"), title = $("#deckTitle");
  let slides = [], at = 0, opener = null;

  const go = (i) => {
    at = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => {
      s.classList.toggle("is-active", k === at);
      s.classList.toggle("is-before", k < at);
      s.setAttribute("aria-hidden", String(k !== at));
    });
    $$("i", dots).forEach((d, k) => d.classList.toggle("is-active", k === at));
    count.textContent = `${at + 1} / ${slides.length}`;
    $("#deckPrev").disabled = at === 0;
    $("#deckNext").disabled = at === slides.length - 1;
  };

  const open = (p, btn) => {
    opener = btn;
    title.textContent = p.client;
    stage.innerHTML = deckSlides(p).join("");
    slides = $$(".slide", stage);
    dots.innerHTML = slides.map(() => "<i></i>").join("");
    go(0);
    if (lenis) lenis.stop();
    document.documentElement.classList.add("deck-open");
    dlg.showModal();
  };
  const close = () => dlg.close();
  dlg.addEventListener("close", () => {
    if (lenis) lenis.start();
    document.documentElement.classList.remove("deck-open");
    if (opener) opener.focus();
  });

  $("#deckClose").addEventListener("click", close);
  $("#deckPrev").addEventListener("click", () => go(at - 1));
  $("#deckNext").addEventListener("click", () => go(at + 1));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); }); // click outside the deck
  dlg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(at + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(at - 1); }
  });
  // swipe on touch screens
  let sx = null;
  stage.addEventListener("pointerdown", (e) => { sx = e.clientX; });
  stage.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50) go(at + (dx < 0 ? 1 : -1));
  });

  // Glass cards, one per project: deck cover, title, The Stack, The Impact, Open deck.
  // The whole card is clickable (the button's ::after covers it), and the button is the one
  // keyboard stop per card.
  const cover = (p) => p.slides && p.slides.length
    ? `<img class="work-card__img" src="${p.slides[0]}" alt="" width="1600" height="900" loading="lazy" decoding="async" draggable="false" />`
    : `<span class="work-card__img work-card__img--text" aria-hidden="true">${p.client}</span>`;
  const sub = (p) => [p.kind, p.when].filter(Boolean).join(" · ");
  list.classList.add("work-grid");
  list.innerHTML = projects.map((p, i) => `
    <article class="work-card" style="--i:${i}" aria-labelledby="work-${p.id}">
      <div class="work-card__thumb">${cover(p)}</div>
      <div class="work-card__body">
        <h3 class="work-card__title" id="work-${p.id}">${p.client}</h3>
        <p class="work-card__kind">${sub(p)}</p>
        <ul class="work-card__facts">
          <li><b>The Stack:</b> ${(p.stack || ["[TOOLS]"]).join(", ")}</li>
          <li><b>The Impact:</b> ${p.impact || "[METRIC]"}</li>
        </ul>
        <button type="button" class="work-card__open" data-i="${i}" aria-haspopup="dialog">Open deck <span aria-hidden="true">→</span><span class="visually-hidden">: ${p.client}</span></button>
      </div>
    </article>`).join("");
  $$(".work-card__open", list).forEach((b) => b.addEventListener("click", () => open(projects[+b.dataset.i], b)));
  reveal($$(".work-card", list));
}

// ------------------------------------------------------------------
// Section titles rise in as they scroll into view (fires once)
// ------------------------------------------------------------------
function passAboutMe() {
  const body = $("#aboutBody");
  if (!body) return;
  body.innerHTML = about.paragraphs.map((p) => `<p>${p}</p>`).join(""); // all paragraphs same size + style
  // static text (the pool-water ripple was removed at her request)

  // the letter: her signature at the end (no photo, at her request)
  const letter = $("#letter");
  body.insertAdjacentHTML("afterend",
    `<img class="letter__sign" src="assets/signature.png?v=${ASSET_V}" alt="Signed, Harshitha Yeduvaka" width="959" height="131" loading="lazy" decoding="async" draggable="false" />`);

  // scroll in: the sheet fades in and settles into its tilt
  if (!reduced) {
    gsap.from(letter, { opacity: 0, y: 40, rotation: 1.5, duration: 1, ease: "power3.out", clearProps: "transform,opacity",
      scrollTrigger: { trigger: letter, start: "top 82%" } });
  }

  // marquee: one list for everyone, plus an identical copy (aria-hidden) so the loop is seamless
  const mq = $("#marquee");
  if (mq && marquee && marquee.length) {
    const items = marquee.map((m) => `<li><span class="marquee__label">${m.label}:</span> ${m.value}<span class="marquee__sep" aria-hidden="true">✦</span></li>`).join("");
    mq.innerHTML = `<div class="marquee__track"><ul class="marquee__list">${items}</ul><ul class="marquee__list" aria-hidden="true">${items}</ul></div>`;
  }

  // in-page links in the text (e.g. "reading fiction" -> On My Shelf): glide there with
  // the site's smooth scroll, then move keyboard focus to that section's heading
  $$('a[href^="#"]', body).forEach((a) => a.addEventListener("click", (e) => {
    const target = $(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    const heading = $(".pass__title", target) || target;
    const land = () => { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); };
    history.replaceState(null, "", a.getAttribute("href"));
    if (lenis) lenis.scrollTo(target, { offset: -24, duration: 1.4, onComplete: land });
    else { target.scrollIntoView({ block: "start" }); land(); }
  }));
}

// On My Shelf: two wooden shelves of books (scripts/bookshelf.js)
function passBookshelf() {
  const root = $("#shelves");
  if (root) initBookshelf({ root, books, gsap, reduced, getLenis: () => lenis });
}

function revealTitles() {
  $$(".pass__title").forEach((t) => {
    if (t.id === "about-h") return; // About heading: no animation
    if (reduced) return;
    gsap.from(t, { yPercent: 20, opacity: 0, duration: 0.8,
      scrollTrigger: { trigger: t, start: "top 85%" } });
  });

  // Story So Far + About + Case Studies titles: zoom in slightly while hovered (back on leave),
  // and a small zoom "pulse" on click/tap (also works on touch screens without hover)
  if (reduced) return;
  ["#p03-h", "#about-h", "#p05-h"].forEach((sel) => {
    const t = $(sel);
    if (!t) return;
    t.style.cursor = "pointer";
    t.style.transformOrigin = "left center";
    t.style.width = "fit-content"; // hug the text so the zoom starts at its edge,
    t.style.maxWidth = "100%";     // but still wrap on narrow phones
    let hovering = false;
    t.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      hovering = true;
      gsap.to(t, { scale: 1.06, duration: 0.4, ease: "power2.out", overwrite: true });
    });
    t.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      hovering = false;
      gsap.to(t, { scale: 1, duration: 0.5, ease: "power2.inOut", overwrite: true });
    });
    t.addEventListener("click", () => {
      if (hovering) { // already zoomed by hover: a little extra bounce
        gsap.fromTo(t, { scale: 1.06 }, { keyframes: [{ scale: 1.1, duration: 0.18 }, { scale: 1.06, duration: 0.4, ease: "power2.inOut" }], overwrite: true });
        return;
      }
      gsap.fromTo(t, { scale: 1 }, { keyframes: [
        { scale: 1.07, duration: 0.35, ease: "power2.out" },
        { scale: 1, duration: 0.9, ease: "power2.inOut" },
      ], overwrite: true });
    });
  });
}

// ------------------------------------------------------------------
// Contact + chrome
// ------------------------------------------------------------------
function contact() {
  const btn = $("#mailto"), pop = $("#emailPop"), send = $("#mailtoLink");
  btn.textContent = meta.email;
  send.href = `mailto:${meta.email}`;
  $("#resume").href = meta.resume;
  $("#linkedin").href = meta.linkedin;

  // email menu: Copy email / Send an email. Closes on outside click, Esc, or after a choice.
  const setOpen = (on, kb = false) => {
    pop.hidden = !on;
    btn.setAttribute("aria-expanded", String(on));
    if (on && kb) pop.querySelector("[role=menuitem]").focus(); // keyboard: move focus into the menu
  };
  btn.addEventListener("click", (e) => setOpen(pop.hidden, e.detail === 0));
  document.addEventListener("pointerdown", (e) => { if (!pop.hidden && !e.target.closest(".email-menu")) setOpen(false); });
  pop.addEventListener("keydown", (e) => {
    const items = $$("[role=menuitem]", pop), i = items.indexOf(document.activeElement);
    if (e.key === "Escape") { setOpen(false); btn.focus(); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus(); }
  });
  send.addEventListener("click", () => setOpen(false));

  const toast = $("#toast");
  $("#copyEmail").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(meta.email); } catch {}
    setOpen(false); btn.focus();
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1600);
  });
}

// Contact form: POST to FormSubmit via fetch, report status inline.
function contactForm() {
  const form = $("#contactForm");
  const status = $("#cfStatus");
  const btn = form.querySelector("button");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form._honey.value) return; // bot
    btn.disabled = true;
    status.className = "contact-form__status mono";
    status.textContent = "SENDING…";
    try {
      const res = await fetch(meta.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === "false") throw new Error(data.message || res.status);
      form.reset();
      status.classList.add("ok");
      status.textContent = "SENT · THANK YOU, I'LL REPLY SOON";
    } catch (err) {
      console.error("[contactForm]", err);
      status.classList.add("err");
      status.textContent = `COULDN'T SEND · PLEASE EMAIL ${meta.email.toUpperCase()}`;
    } finally {
      btn.disabled = false;
    }
  });
}

// ------------------------------------------------------------------
// Scroll reveal: soft fade + 12px rise as elements enter, staggered by --i (CSS).
// Plain IntersectionObserver; reduced motion = nothing is hidden in the first place.
// ------------------------------------------------------------------
let revealIO;
function reveal(els) {
  if (reduced || !("IntersectionObserver" in window)) return;
  revealIO ||= new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-in");
    revealIO.unobserve(e.target);
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  els.forEach((el) => { el.classList.add("reveal"); revealIO.observe(el); });
}

// ------------------------------------------------------------------
// Theme: Iced Latte (light) / Espresso (dark). The <head> script applies a saved choice before
// paint; with none, CSS follows prefers-color-scheme. Switching cross-fades (View Transitions,
// opacity only) where supported; reduced motion switches instantly.
// ------------------------------------------------------------------
function themeSwitch() { // the lamp on the desk is the only switch now (passKit)
  // time of day in Paris, checked every 30s: morning shadows on the desk, evening = lamp on + warm
  // tint. Only changes the theme by itself when the visitor hasn't picked one.
  const tick = () => {
    const { h } = parisNow();
    root.dataset.daylight = phaseOf(h);
    if (!savedTheme()) setTheme(autoTheme(h), false);
  };
  darkOS.addEventListener("change", tick);
  setInterval(tick, 30000);
  tick();
}

// The alarm clock tells the real time in Paris: a face drawn over the photo's dial
// (same size and spot), hands set every second. Reduced motion: no second hand.
function clockFace(btn) {
  const box = $(".kit__img", btn);
  const nums = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1, a = (n * 30 - 90) * Math.PI / 180;
    return `<text x="${(120 + 86 * Math.cos(a)).toFixed(1)}" y="${(120 + 86 * Math.sin(a)).toFixed(1)}">${n}</text>`;
  }).join("");
  const ticks = Array.from({ length: 60 }, (_, i) =>
    `<line x1="120" y1="${i % 5 ? 9 : 7}" x2="120" y2="${i % 5 ? 14 : 18}" transform="rotate(${i * 6} 120 120)"${i % 5 ? "" : ' class="hr"'} />`).join("");
  box.insertAdjacentHTML("beforeend", `
    <svg class="clock-face" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <defs><radialGradient id="dialPaper" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#F3EBDD"/><stop offset="1" stop-color="#E4D7C2"/></radialGradient></defs>
      <circle cx="120" cy="120" r="117" fill="url(#dialPaper)" stroke="#1f1d1b" stroke-width="5"/>
      <g class="clock-face__ticks">${ticks}</g>
      <g class="clock-face__nums">${nums}</g>
      <g class="clock-face__h"><path d="M116.5 128 L118 66 Q120 60 122 66 L123.5 128 Z"/></g>
      <g class="clock-face__m"><path d="M117.8 130 L119 34 Q120 30 121 34 L122.2 130 Z"/></g>
      <g class="clock-face__s"><line x1="120" y1="138" x2="120" y2="26"/></g>
      <circle cx="120" cy="120" r="6.5" fill="#1f1d1b"/><circle cx="120" cy="120" r="2.2" fill="#b9b5ae"/>
    </svg>`);
  const svg = $(".clock-face", box);
  const [hH, hM, hS] = [".clock-face__h", ".clock-face__m", ".clock-face__s"].map((s) => $(s, svg));
  const say = (h, m) => btn.setAttribute("aria-label", `Alarm clock: it's ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} in Paris. Plays a sound.`);
  let lastMin = -1;
  const set = () => {
    const { h, m, s } = parisNow();
    hH.setAttribute("transform", `rotate(${(h % 12) * 30 + m * 0.5} 120 120)`);
    hM.setAttribute("transform", `rotate(${m * 6 + s * 0.1} 120 120)`);
    hS.setAttribute("transform", `rotate(${s * 6} 120 120)`);
    if (m !== lastMin) { lastMin = m; say(h, m); }
  };
  set();
  setInterval(set, 1000);
}

// ------------------------------------------------------------------
// Boot everything
// ------------------------------------------------------------------
async function init() {
  // Build all passes defensively — one failure must not freeze the page.
  const passes = { themeSwitch, coffeeProgress: () => initCup({ gsap, reduced, getLenis: () => lenis }), passKit, passToolkit, pass03, pass05, passAboutMe, passBookshelf, revealTitles, contact, contactForm };
  for (const [name, fn] of Object.entries(passes)) {
    try { fn(); } catch (e) { console.error(`[${name}] failed:`, e); }
  }

  // fonts must be ready so the handwriting is measured correctly
  // (capped at 0.6s: a slow font server must never hold the page behind the loader)
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]); } catch {}

  // Start the loader LAST so nothing above can block it.
  boot();

  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

init();
