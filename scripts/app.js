// app.js — motion orchestration, desk interactions, section rendering.
import { play, playFile, startMusic, stopMusic, isMuted, setMuted } from "./sound.js?v=20261110u";
import {
  meta, about, kit, tools, experience, projects,
} from "./content.js?v=20261110u";

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: "power3.out" });
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = matchMedia("(max-width: 860px)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
// bump with the ?v= in index.html whenever an image in assets/ is replaced, so browsers refetch it
const ASSET_V = "20261110u";

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
// (without dragging) plays the object's sound. Headphones toggle the music.
// Clicking the camera ejects her photo as an instax print. Mobile: tap grid.
// ------------------------------------------------------------------
function passKit() {
  const grid = $("#kitGrid");
  const note = $("#kitNote");
  const desk = !isMobile; // free-placement layout only on desktop
  let top = 10;           // z-index counter: last touched object comes to the front
  let playing = false;
  let mode = "notebook";                        // "notebook" | "chaos"
  const place = (k) => (mode === "chaos" && k.chaos) || k.desk; // where an object sits in this mode

  // --- record card: plays the original loop from sound.js ------------
  const rec = $("#record"), recBtn = $("#recordPlay");
  const setPlaying = (on) => {
    playing = on;
    rec.classList.toggle("is-playing", on);
    recBtn.setAttribute("aria-pressed", String(on));
    recBtn.textContent = on ? "❚❚ Pause" : "▶ Play";
    const hp = $(".kit__item--headphones");
    if (hp) hp.setAttribute("aria-pressed", String(on));
    on ? startMusic() : stopMusic();
  };
  recBtn.addEventListener("click", (e) => { if (e.detail) recBtn.blur(); setPlaying(!playing); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && playing) setPlaying(false); });

  // --- sound toggle --------------------------------------------------
  const mute = $("#deskMute");
  const paintMute = () => {
    mute.setAttribute("aria-pressed", String(isMuted()));
    mute.textContent = isMuted() ? "♪ Sound off" : "♪ Sound on";
  };
  mute.addEventListener("click", () => { setMuted(!isMuted()); paintMute(); });
  paintMute();

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
          k.ink.lines.map((l) => `<span class="kit__type">${l}</span>`).join("")}</span>` : ""
      }</span>`;
    }
    if (k.id === "camera") b.setAttribute("aria-label", "Camera: take a photo");
    b.style.setProperty("--r", `${k.desk.r}deg`);
    if (desk) {
      b.style.left = k.desk.x + "%";
      b.style.top = k.desk.y + "%";
      b.style.width = k.desk.w + "%";
      b.style.zIndex = i + 1;
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
        setPlaying(!playing);
      } else {
        // cup: her Pixabay slurp if saved as assets/sounds/slurp.mp3, else the synth; always 2s
        if (k.cup) playFile("assets/sounds/slurp.mp3", "slurp", 2);
        else play(k.sound);
        if (k.sound === "shutter") ejectPrint();
        if (k.cup) steam(b);
      }
      note.textContent = k.note || "";
      if (!reduced && !k.cup) { // the cup only steams; everything else does a little hop
        // (the polaroid hops as one piece: frame and photo together)
        gsap.fromTo(b.querySelector(k.print ? ".print" : "img"), { y: 0, rotate: 0 },
          { keyframes: [{ y: -14, rotate: -4, duration: 0.18 }, { y: 0, rotate: 0, duration: 0.5, ease: "elastic.out(1,0.45)" }] });
      }
    });

    // drag (desktop only). Objects can go anywhere on the page, not just the desk:
    // they're only kept inside the page itself (left/right edges, top/bottom of the
    // document). Dragging near the top/bottom of the window scrolls the page, so an
    // object can be carried down into any section. Offsets live in --dx/--dy so the
    // tilt stays intact.
    if (desk) {
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
        b.style.zIndex = Math.min(++top, 55); // above every section, below the logo
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
        if (!dragged) { dragged = true; raf = requestAnimationFrame(edgeScroll); }
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
    // camera body size + centre (offsets ignore transforms; buttons have 10px padding)
    const camW = camBtn.offsetWidth - 20, camH = camW * (camSpec.h / camSpec.w);
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

    camBtn.style.zIndex = ++top;
    printBtn.style.zIndex = top - 1; // tucked behind the camera while it ejects
    ejectTl = gsap.timeline()
      // photo top points out of the slot: rotate a quarter-turn from the camera's tilt
      .set(printBtn, { ...at(out(0)), "--s": s, "--r": `${place(camSpec).r + 90}deg`, clipPath: "inset(0% 0% 100% 0%)" })
      // motor pushes it out ~80% (the part outside the slot is what you see)
      .to(printBtn, { ...at(out(0.8)), clipPath: "inset(0% 0% 20% 0%)", duration: 1.3, ease: "power1.inOut" })
      // a beat, then it is pulled free...
      .to(printBtn, { ...at(out(1.15)), clipPath: "inset(0% 0% 0% 0%)", duration: 0.25, ease: "power1.in" }, "+=0.35")
      .call(() => { printBtn.style.zIndex = ++top; })
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

  // --- intro: objects settle onto the desk, then the name is written ---
  const sign = $(".kit__sign"), typed = $$(".kit__type");
  const settle = $$(".kit__item:not(.kit__item--print)");
  if (!reduced) {
    gsap.set(settle, { opacity: 0, "--s": 1.12 });
    gsap.set(rec, { opacity: 0 });
    if (sign) gsap.set(sign, { clipPath: "inset(-30% 100% -30% -5%)" });
    gsap.set(typed, { opacity: 0, y: 6 });
    deskIntro = gsap.timeline({ paused: true })
      .to(settle, { opacity: 1, "--s": 1, duration: 0.7, stagger: 0.09, ease: "power2.out" })
      .to(rec, { opacity: 1, duration: 0.6 }, "-=0.4")
      .to(sign, { clipPath: "inset(-30% -5% -30% -5%)", duration: 1.6, ease: "power1.inOut" }, "-=0.2")
      .to(typed, { opacity: 1, y: 0, duration: 0.5, stagger: 0.25 }, "-=0.2");
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
    const [title, tagline] = kit.find((k) => k.ink).ink.lines;
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
    gsap.to(rec, mode === "chaos"
      ? { rotation: 0, xPercent: 6, yPercent: 10, x: 0, y: 0, duration: t, ease: "power3.inOut" }
      : { rotation: 8, xPercent: 0, yPercent: 0, x: 0, y: 0, duration: t, ease: "power3.inOut" });
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

  // --- the vinyl card is draggable too (desktop). It moves with GSAP x/y so its tilt
  //     and chaos-mode offset stay intact; a press on Play that doesn't move still plays.
  if (desk) {
    let sx, sy, ox, oy, moving = false, moved = false;
    rec.style.cursor = "grab";
    rec.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      try { rec.setPointerCapture(e.pointerId); } catch {}
      rec.style.zIndex = Math.min(++top, 55);
      sx = e.clientX; sy = e.clientY;
      ox = gsap.getProperty(rec, "x"); oy = gsap.getProperty(rec, "y");
      moving = true; moved = false;
    });
    rec.addEventListener("pointermove", (e) => {
      if (!moving) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true; rec.style.cursor = "grabbing";
      gsap.set(rec, { x: ox + dx, y: oy + dy });
    });
    // the click that ends a drag fires right after pointerup; clear the flag just after it
    const end = () => { moving = false; rec.style.cursor = "grab"; setTimeout(() => { moved = false; }, 0); };
    rec.addEventListener("pointerup", end);
    rec.addEventListener("pointercancel", end);
    // a drag that ends over Play must not also press it
    recBtn.addEventListener("click", (e) => { if (moved) { e.stopImmediatePropagation(); moved = false; } }, true);
  }
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
    let step = Math.max(72, fw * 1.15);
    const gap = Math.max(70, fw * 1.1), half = 40;
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
      step = Math.max(44, usable / Math.max(1, n - sides));
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
    if (!open || isMobile) return;
    anchor();
    const pos = fan();
    items.forEach((it, i) => gsap.set(it, { x: pos[i].x, y: pos[i].y, rotate: pos[i].r }));
  };

  const set = (on) => {
    open = on;
    folder.setAttribute("aria-expanded", String(on));
    list.classList.toggle("is-open", on);
    if (tl) tl.kill();
    if (isMobile) { // grid layout: just scale them in
      if (!reduced && on) gsap.fromTo(items, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)", stagger: 0.02 });
      return;
    }
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
  if (!isMobile) {
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
// Experience — vertical timeline
// ------------------------------------------------------------------
function pass03() {
  // One vertical timeline, in the order of content.js `experience`.
  // A group heading is printed once, where the type changes:
  // "Foundations" before education, "The Story So Far" before work.
  const tl = $("#timeline");
  const heading = { education: "Foundations", work: "The Story So Far" };
  let last = null, html = "";
  experience.forEach((e) => {
    if (e.type !== last) {
      html += `<li class="tl__group"><h3 class="tl__heading mono">${heading[e.type] || ""}</h3></li>`;
      last = e.type;
    }
    html += `
      <li class="tl__item">
        <p class="tl__when mono">${e.dates}</p>
        <div class="tl__body">
          <h4 class="tl__org display">${e.link ? `<a href="${e.link}" target="_blank" rel="noopener">${e.org}<span class="tl__ext" aria-hidden="true">↗</span><span class="visually-hidden"> (opens in a new tab)</span></a>` : e.org}</h4>
          <p class="tl__role mono">${e.role}</p>
          ${e.bullets.length ? `<ul class="tl__bullets">${e.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>` : ""}
        </div>
      </li>`;
  });
  tl.innerHTML = html;

  if (reduced) return;
  // the line draws down as you scroll; each entry rises in as it arrives
  gsap.fromTo(tl, { "--draw": 0 }, {
    "--draw": 1, ease: "none",
    scrollTrigger: { trigger: tl, start: "top 75%", end: "bottom 60%", scrub: 0.4 },
  });
  $$(".tl__item, .tl__group", tl).forEach((it) => {
    gsap.from(it, { y: 24, opacity: 0, duration: 0.7, scrollTrigger: { trigger: it, start: "top 85%" } });
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
    play("page");
  };
  const close = () => dlg.close();
  dlg.addEventListener("close", () => {
    if (lenis) lenis.start();
    document.documentElement.classList.remove("deck-open");
    if (opener) opener.focus();
  });

  $("#deckClose").addEventListener("click", close);
  $("#deckPrev").addEventListener("click", () => { go(at - 1); play("page"); });
  $("#deckNext").addEventListener("click", () => { go(at + 1); play("page"); });
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

  projects.forEach((p, i) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "work__row";
    row.setAttribute("aria-haspopup", "dialog");
    row.innerHTML = `
      <span class="work__idx mono">0${i + 1}</span>
      <span class="work__client">${p.client}<small>${[p.kind, p.when].filter(Boolean).join(" · ")}</small></span>
      <span class="work__score">${p.score}<small>${p.scoreLabel}</small></span>
      <span class="work__open mono">Open deck →</span>`;
    row.addEventListener("click", () => open(p, row));
    list.appendChild(row);
  });
}

// ------------------------------------------------------------------
// Section titles rise in as they scroll into view (fires once)
// ------------------------------------------------------------------
function passAboutMe() {
  const body = $("#aboutBody");
  if (!body) return;
  body.innerHTML = about.paragraphs.map((p) => `<p>${p}</p>`).join(""); // all paragraphs same size + style
  // "pool water": the text ripples gently, like letters seen through moving water.
  // An SVG turbulence filter displaces the text; its noise drifts slowly over time.
  // Runs only while the text is on screen (and the tab is visible); off for reduced motion.
  if (reduced) return;
  const turb = $("#poolTurb");
  if (!turb) return;
  body.classList.add("is-pool");
  let raf = 0, visible = false;
  const t0 = performance.now();
  const frame = (now) => {
    const t = (now - t0) / 1000;
    // two slow, out-of-step waves: gentle swell, never choppy
    const fx = 0.004 + 0.0015 * Math.sin(t * 0.55);
    const fy = 0.016 + 0.005 * Math.sin(t * 0.83 + 1.3);
    turb.setAttribute("baseFrequency", `${fx.toFixed(5)} ${fy.toFixed(5)}`);
    raf = requestAnimationFrame(frame);
  };
  const run = (on) => { cancelAnimationFrame(raf); if (on && !document.hidden) raf = requestAnimationFrame(frame); };
  ScrollTrigger.create({ trigger: body, start: "top bottom", end: "bottom top",
    onToggle: (self) => { visible = self.isActive; run(visible); } });
  document.addEventListener("visibilitychange", () => run(visible));
}

function revealTitles() {
  $$(".pass__title").forEach((t) => {
    if (t.id === "about-h") return; // About heading: no animation
    if (reduced) return;
    gsap.from(t, { yPercent: 20, opacity: 0, duration: 0.8,
      scrollTrigger: { trigger: t, start: "top 85%" } });
  });

  // About + Featured Work titles: zoom in slightly while hovered (back on leave),
  // and a small zoom "pulse" on click/tap (also works on touch screens without hover)
  if (reduced) return;
  ["#about-h", "#p05-h"].forEach((sel) => {
    const t = $(sel);
    if (!t) return;
    t.style.cursor = "pointer";
    t.style.transformOrigin = "left center";
    t.style.width = "max-content";
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
  $("#mailto").href = `mailto:${meta.email}`;
  $("#mailto").textContent = meta.email;
  $("#resume").href = meta.resume;
  $("#linkedin").href = meta.linkedin;

  const toast = $("#toast");
  $("#copyEmail").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(meta.email); } catch {}
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1600);
  });

  // magnetic mailto
  if (!reduced && matchMedia("(hover: hover)").matches) {
    const mail = $("#mailto");
    mail.addEventListener("pointermove", (e) => {
      const r = mail.getBoundingClientRect();
      gsap.to(mail, { x: (e.clientX - r.left - r.width / 2) * 0.15, y: (e.clientY - r.top - r.height / 2) * 0.2, duration: 0.4 });
    });
    mail.addEventListener("pointerleave", () => gsap.to(mail, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" }));
  }
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
// Boot everything
// ------------------------------------------------------------------
async function init() {
  // Build all passes defensively — one failure must not freeze the page.
  const passes = { passKit, passToolkit, pass03, pass05, passAboutMe, revealTitles, contact, contactForm };
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
