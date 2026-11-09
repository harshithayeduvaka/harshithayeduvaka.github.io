// app.js — motion orchestration, demo logic, wiring.
import { initField, initGlobe } from "./webgl.js";
import { play, startMusic, stopMusic, isMuted, setMuted } from "./sound.js";
import {
  meta, about, kit, music, metrics, experience, projects, skills, languages,
} from "./content.js";

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: "power3.out" });
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = matchMedia("(max-width: 860px)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ------------------------------------------------------------------
// Single shared RAF: Lenis + GSAP ticker + WebGL renderers
// ------------------------------------------------------------------
let lenis;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, duration: 1.2, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
}
let field, globe;

gsap.ticker.add((time) => {
  if (lenis) lenis.raf(time * 1000);
  if (field && field.render) field.render(time);
  if (globe && globe.render) globe.render(time);
});
gsap.ticker.lagSmoothing(0);

// ------------------------------------------------------------------
// Boot (PASS 00)
// ------------------------------------------------------------------
function boot() {
  const boot = $("#boot");
  const log = $("#bootLog");
  const rule = $(".boot__rule i");
  const lines = [
    "LOADING CORPUS…",
    "TOKENS 2,417",
    "LANGUAGES EN · FR · HI · TE",
    "READY",
  ];
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    gsap.timeline()
      .to(rule, { width: "100%", duration: 0.4, ease: "power2.inOut" })
      .to(boot, { opacity: 0, duration: 0.5, onComplete: () => boot.remove() }, "+=0.1")
      .add(hero, "-=0.2");
  };
  addEventListener("keydown", finish, { once: true });

  if (reduced) { log.textContent = lines.join("\n"); gsap.set(rule, { width: "100%" }); finish(); return; }

  const tl = gsap.timeline({ onComplete: finish });
  lines.forEach((ln, i) => {
    tl.call(() => (log.textContent += (i ? "\n" : "") + ln), null, i * 0.4);
  });
  tl.to(rule, { width: "72%", duration: 2.0, ease: "none" }, 0);
  gsap.delayedCall(2.2, finish); // hard cap
}

// ------------------------------------------------------------------
// PASS 01 — Hero
// ------------------------------------------------------------------
function buildHeroChars() {
  $$("#heroName .line").forEach((line) => {
    const word = line.dataset.word;
    line.innerHTML = "";
    const inner = document.createElement("span");
    inner.style.display = "inline-block";
    [...word].forEach((ch) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = ch;
      inner.appendChild(s);
    });
    line.appendChild(inner);
  });
}

function hero() {
  const chars = $$("#heroName .ch");
  const tl = gsap.timeline();
  if (reduced) {
    gsap.set(chars, { y: 0, opacity: 1 });
    gsap.set(".hero__strap .reveal, .hero__positioning span", { y: 0 });
    if (field) field.condense(1);
    return;
  }
  // token-condense: field snaps onto the name, holds, relaxes
  tl.fromTo(chars,
    { yPercent: 115 },
    { yPercent: 0, duration: 0.9, stagger: 0.03, ease: "power4.out" }, 0);
  if (field && field.uniforms) {
    tl.to(field.uniforms.uCondense, { value: 1, duration: 1.2, ease: "power2.inOut" }, 0)
      .to(field.uniforms.uCondense, { value: 0.12, duration: 1.0, ease: "power1.inOut" }, 1.7)
      .call(() => field.dropRed(), null, 1.9); // signal-red #1: "generic CV" falls
  }
  tl.from(".hero__strap .reveal", { yPercent: 120, duration: 0.7 }, 0.5)
    .from(".hero__positioning span", { yPercent: 120, duration: 0.7 }, 0.7);
}

// ------------------------------------------------------------------
// About — photo + bio (static; its title reveal is handled in pass07)
// ------------------------------------------------------------------
function passAbout() {
  const img = $("#aboutPhoto");
  const ph = about.photo;
  img.src = ph.src;
  img.srcset = `${ph.src} ${ph.w}w, ${ph.src2x} ${ph.w * 2}w`;
  img.sizes = "(max-width: 860px) 70vw, 360px";
  img.width = ph.w; img.height = ph.h;
  img.alt = ph.alt;
  $("#aboutBio").innerHTML = about.paragraphs.map((t) => `<p>${t}</p>`).join("");
}

// ------------------------------------------------------------------
// Off-the-CV desk (About). Desktop: objects scattered on a grid-paper desk,
// draggable; a click (without dragging) plays the object's sound and shows its
// note. Headphones toggle the record card. Mobile: static 2x2 grid, tap to play.
// ------------------------------------------------------------------
function passKit() {
  const grid = $("#kitGrid");
  const note = $("#kitNote");
  const desk = !isMobile; // free-placement layout only on desktop
  let top = 10;           // z-index counter: last touched object comes to the front
  let playing = false;
  if (!desk) $("#kitHint").textContent = "· TAP AN OBJECT";

  // --- record card -------------------------------------------------
  const rec = $("#record"), recBtn = $("#recordPlay"), recState = $("#recordState");
  $("#recordTitle").textContent = music.title;
  $("#recordArtist").textContent = music.artist;
  if (music.link) { const a = $("#recordLink"); a.href = music.link; a.hidden = false; }
  const setPlaying = (on) => {
    playing = on;
    rec.classList.toggle("is-playing", on);
    recBtn.setAttribute("aria-pressed", String(on));
    recBtn.textContent = on ? "❚❚ Pause" : "▶ Play";
    recState.textContent = on ? "NOW PLAYING · PLACEHOLDER LOOP" : "PAUSED";
    const hp = $(".kit__item--headphones");
    if (hp) hp.setAttribute("aria-pressed", String(on));
    on ? startMusic() : stopMusic();
  };
  recBtn.addEventListener("click", () => setPlaying(!playing));
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
    b.innerHTML = `
      <span class="kit__img"><img src="${k.img}" alt="" width="${k.w}" height="${k.h}" loading="lazy" decoding="async" draggable="false" /></span>
      <span class="kit__label mono">OBJ.0${i + 1} · ${k.label}</span>`;
    b.style.setProperty("--r", `${k.desk.r}deg`);
    if (desk) {
      b.style.left = k.desk.x + "%";
      b.style.top = k.desk.y + "%";
      b.style.width = k.desk.w + "%";
      b.style.zIndex = i + 1;
    }

    // click = activate (keyboard Enter/Space also lands here)
    let dragged = false;
    b.addEventListener("click", () => {
      if (dragged) { dragged = false; return; } // that was the end of a drag
      if (k.sound === "music") {
        setPlaying(!playing);
      } else {
        play(k.sound);
        const was = b.getAttribute("aria-pressed") === "true";
        $$(".kit__item:not(.kit__item--headphones)").forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", String(!was));
      }
      note.innerHTML = `<span class="mono">OBJ.0${i + 1} · ${k.name}</span> ${k.note}`;
      if (!reduced) {
        gsap.fromTo(b.querySelector("img"), { y: 0, rotate: 0 },
          { keyframes: [{ y: -14, rotate: -4, duration: 0.18 }, { y: 0, rotate: 0, duration: 0.5, ease: "elastic.out(1,0.45)" }] });
      }
    });

    // drag (desktop only). Offsets live in --dx/--dy so the tilt stays intact.
    if (desk) {
      let sx, sy, ox, oy, minX, maxX, minY, maxY, moving = false;
      b.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        try { b.setPointerCapture(e.pointerId); } catch {} // keeps the drag even if the cursor outruns the object
        b.style.zIndex = ++top;
        sx = e.clientX; sy = e.clientY;
        ox = parseFloat(b.style.getPropertyValue("--dx")) || 0;
        oy = parseFloat(b.style.getPropertyValue("--dy")) || 0;
        // keep at least ~40% of the object on the desk
        const d = grid.getBoundingClientRect(), r = b.getBoundingClientRect();
        minX = ox + (d.left - r.left) - r.width * 0.6;  maxX = ox + (d.right - r.right) + r.width * 0.6;
        minY = oy + (d.top - r.top) - r.height * 0.6;   maxY = oy + (d.bottom - r.bottom) + r.height * 0.6;
        moving = true; dragged = false;
      });
      b.addEventListener("pointermove", (e) => {
        if (!moving) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (!dragged && Math.hypot(dx, dy) < 5) return; // tiny jitter still counts as a click
        dragged = true;
        b.classList.add("is-dragging");
        b.style.setProperty("--dx", Math.min(maxX, Math.max(minX, ox + dx)) + "px");
        b.style.setProperty("--dy", Math.min(maxY, Math.max(minY, oy + dy)) + "px");
      });
      const end = () => { moving = false; b.classList.remove("is-dragging"); };
      b.addEventListener("pointerup", end);
      b.addEventListener("pointercancel", end);
    }
    grid.appendChild(b);
  });

  // --- tidy: send everything back to its starting spot ---------------
  $("#deskTidy").addEventListener("click", () => {
    $$(".kit__item").forEach((b, i) => {
      if (reduced) { b.style.setProperty("--dx", "0px"); b.style.setProperty("--dy", "0px"); }
      else gsap.to(b, { "--dx": "0px", "--dy": "0px", duration: 0.7, ease: "power3.inOut", delay: i * 0.05 });
      b.style.zIndex = i + 1;
    });
    play("page");
  });
}

// ------------------------------------------------------------------
// PASS 02 — Positioning extraction (pinned, scrubbed)
// ------------------------------------------------------------------
function pass02() {
  const marks = $$("#p02Para mark");
  const para = $("#p02Para");
  const rowsWrap = $("#ledgerRows");
  metrics.forEach((m) => {
    const r = document.createElement("div");
    r.className = "ledger__row";
    r.innerHTML = `<span class="v">${m.value}</span><span class="l mono">${m.label}</span>`;
    rowsWrap.appendChild(r);
  });
  const rows = $$(".ledger__row");

  if (reduced) {
    marks.forEach((m) => m.classList.add("lit"));
    gsap.set(rows, { opacity: 1, y: 0 });
    return;
  }

  ScrollTrigger.create({
    trigger: "#p02",
    start: "top top",
    end: "+=180%",
    pin: true,
    scrub: 0.6,
    onUpdate: (self) => {
      const p = self.progress;
      const revealed = Math.min(marks.length, Math.floor(p / 0.22));
      marks.forEach((m, i) => {
        const on = i < revealed;
        m.classList.toggle("lit", on);
        gsap.set(rows[i], { opacity: on ? 1 : 0, y: on ? 0 : 8 });
      });
      para.classList.toggle("spent", p > 0.85);
    },
  });
}

// ------------------------------------------------------------------
// PASS 03 — Experience horizontal
// ------------------------------------------------------------------
function pass03() {
  const track = $("#p03Track");
  experience.forEach((e) => {
    const panel = document.createElement("article");
    panel.className = "panel";
    panel.innerHTML = `
      <div class="rail mono"><span class="rail__idx">${e.year}</span><span>${e.city.toUpperCase()}</span>${e.type === "education" ? '<span class="panel__tag">EDUCATION</span>' : ""}</div>
      <div class="content">
        <p class="panel__year">${e.year}</p>
        <h3 class="panel__org display">${e.org}</h3>
        <p class="panel__role mono">${e.role}<span class="panel__dates"> · ${e.dates}</span></p>
        <ul class="panel__bullets">${e.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
        <span class="panel__city">${e.city}</span>
      </div>`;
    track.appendChild(panel);
  });

  if (isMobile || reduced) {
    track.style.flexDirection = "column";
    $$(".panel").forEach((p) => (p.style.flex = "0 0 auto"));
    return;
  }

  const panels = $$(".panel");
  const prog = $("#p03Progress");
  const bar = $("#p03Progress .bar i");
  const label = $("#p03Label");
  prog.style.display = "flex";

  const tween = gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth),
    ease: "none",
    scrollTrigger: {
      trigger: "#p03",
      start: "top top",
      end: () => "+=" + (track.scrollWidth - window.innerWidth),
      pin: true,
      scrub: 0.5,
      onUpdate: (self) => {
        const idx = Math.min(panels.length, Math.floor(self.progress * panels.length) + 1);
        label.textContent = `PASS 04 · ${idx}/${panels.length}`;
        bar.style.width = self.progress * 100 + "%";
        prog.style.opacity = self.progress > 0.01 && self.progress < 0.99 ? 1 : 0;
      },
    },
  });

  // per-panel org axis-shift (width) + bullet line-masks
  panels.forEach((panel) => {
    const org = panel.querySelector(".panel__org");
    gsap.fromTo(org, { fontVariationSettings: '"wght" 700, "wdth" 62' },
      { fontVariationSettings: '"wght" 700, "wdth" 100', ease: "none",
        scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left center", end: "center center", scrub: true } });
    gsap.from(panel.querySelectorAll(".panel__bullets li"),
      { yPercent: 110, opacity: 0, stagger: 0.05, duration: 0.6,
        scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left 65%" } });
  });
}

// ------------------------------------------------------------------
// PASS 04 — ohmyATS demo (deterministic client-side scoring)
// ------------------------------------------------------------------
const STOP = new Set("a an the and or of to for with you your we our will own on in is are as be by that which most this all through".split(" "));
function tokenize(t) {
  return (t.toLowerCase().match(/[a-z][a-z/+-]{1,}/g) || []).filter((w) => !STOP.has(w) && w.length > 2);
}
function score(jd, cv) {
  const jTok = tokenize(jd), cTok = new Set(tokenize(cv));
  const jSet = [...new Set(jTok)];
  if (!jSet.length) return { pct: 0, missing: [], matched: [] };
  // term frequency in JD as weight (TF); intersection with CV
  const tf = {};
  jTok.forEach((w) => (tf[w] = (tf[w] || 0) + 1));
  let hit = 0, tot = 0;
  const matched = [], missing = [];
  jSet.forEach((w) => {
    const weight = 1 + Math.log(tf[w]);
    tot += weight;
    if (cTok.has(w)) { hit += weight; matched.push(w); }
    else missing.push(w);
  });
  return { pct: Math.round((hit / tot) * 100), missing: missing.slice(0, 4), matched };
}

const RING_CIRC = 2 * Math.PI * 105;
function pass04() {
  const form = $("#demoForm");
  const prog = $("#ringProg");
  const num = $("#ringNum");
  const out = $("#demoOut");
  const wrap = $("#ringWrap");
  prog.style.strokeDasharray = RING_CIRC;
  prog.style.strokeDashoffset = RING_CIRC;

  function run() {
    const { pct, missing } = score($("#jd").value, $("#cv").value);
    const state = { v: 0 };
    wrap.classList.remove("bloom");
    gsap.to(state, {
      v: pct, duration: reduced ? 0.15 : 1.1, ease: "power2.out",
      onUpdate: () => {
        const val = Math.round(state.v);
        prog.style.strokeDashoffset = RING_CIRC * (1 - val / 100);
        num.innerHTML = `${val}%<small>MATCH</small>`;
      },
      onComplete: () => wrap.classList.add("bloom"),
    });
    out.innerHTML = missing.length
      ? `MATCH ${pct}% <span class="miss">· MISSING: ${missing.join(", ")}</span>`
      : `MATCH ${pct}% · FULL COVERAGE`;
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); run(); });
  run(); // prefilled example — never an empty state
}

// ------------------------------------------------------------------
// PASS 05 — Projects (parser output rows)
// ------------------------------------------------------------------
function pass05() {
  const list = $("#workList");
  projects.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "work__row";
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.setAttribute("aria-expanded", "false");
    row.innerHTML = `
      <span class="work__idx mono">R0${i + 1}</span>
      <span class="work__client">${p.client}<small>${p.kind} · ${p.when}</small></span>
      <span class="work__score">${p.score}<small>${p.scoreLabel}</small></span>
      <dl class="work__detail">
        <div><dt class="mono">CONTEXT</dt><dd>${p.context}</dd></div>
        ${p.mine ? `<div><dt class="mono">MY PART</dt><dd>${p.mine}</dd></div>` : ""}
        <div><dt class="mono">AUDITED</dt><dd>${p.audited}</dd></div>
        <div><dt class="mono">FOUND</dt><dd>${p.found}</dd></div>
        <div><dt class="mono">RECOMMENDED</dt><dd>${p.recommended}</dd></div>
        <div><dt class="mono">PROJECTED IMPACT</dt><dd class="proj">${p.impact}</dd></div>
        ${p.link ? `<div><dt class="mono">LINK</dt><dd><a class="work__link" href="${p.link}" target="_blank" rel="noopener">${p.linkLabel || "Open"} ↗</a></dd></div>` : ""}
      </dl>`;
    const toggle = () => {
      const open = row.getAttribute("aria-expanded") === "true";
      $$(".work__row").forEach((r) => r.setAttribute("aria-expanded", "false"));
      row.setAttribute("aria-expanded", String(!open));
      ScrollTrigger.refresh();
    };
    row.addEventListener("click", (e) => { if (!e.target.closest("a")) toggle(); });
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
    list.appendChild(row);
  });
}

// ------------------------------------------------------------------
// PASS 06 — Skills (lightweight physics pile + fallback + filters)
// ------------------------------------------------------------------
function pass06() {
  const cats = Object.keys(skills);
  const fallback = $("#skillsFallback");
  const filters = $("#skillFilters");
  const pile = $("#skills-pile");

  // fallback list (also the reduced-motion / a11y version)
  cats.forEach((c) => {
    const li = document.createElement("li");
    li.innerHTML = `<b class="mono">${c}</b><br>${skills[c].join(" · ")}`;
    fallback.appendChild(li);
  });

  // filter buttons
  ["ALL", ...cats].forEach((c, i) => {
    const b = document.createElement("button");
    b.textContent = c;
    if (i === 0) b.classList.add("active");
    b.addEventListener("click", () => { setFilter(i - 1, b); });
    filters.appendChild(b);
  });

  if (reduced || isMobile) { pile.hidden = true; fallback.hidden = false; filters.hidden = reduced; return; }
  fallback.hidden = true;

  // Build chips
  const chips = [];
  cats.forEach((c, ci) => {
    skills[c].forEach((s) => {
      const el = document.createElement("div");
      el.className = "chip";
      el.dataset.cat = ci;
      el.textContent = s;
      pile.appendChild(el);
      chips.push({ el, ci, x: 0, y: 0, vy: 0, vx: 0, w: 0, h: 0, home: 0 });
    });
  });

  const settle = () => {
    const W = pile.clientWidth, PH = pile.clientHeight;
    let x = 20, y = PH - 60, rowH = 46;
    chips.forEach((c) => {
      if (c.el.hidden) return;
      c.w = c.el.offsetWidth; c.h = c.el.offsetHeight;
      if (x + c.w > W - 20) { x = 20; y -= rowH; }
      c.tx = x; c.ty = y; x += c.w + 12;
    });
  };

  // physics state (verlet-lite drop + repel)
  const W = () => pile.clientWidth;
  chips.forEach((c) => { c.w = c.el.offsetWidth; c.h = c.el.offsetHeight; c.x = Math.random() * (W() - 120); c.y = -60 - Math.random() * 200; });
  settle();

  let mouse = { x: -999, y: -999 };
  pile.addEventListener("pointermove", (e) => {
    const r = pile.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  pile.addEventListener("pointerleave", () => (mouse = { x: -999, y: -999 }));

  let running = false;
  function physics() {
    if (!running) return;
    chips.forEach((c) => {
      if (c.el.hidden) return;
      // spring to settle target
      c.vx += (c.tx - c.x) * 0.02;
      c.vy += (c.ty - c.y) * 0.02;
      // mouse repel
      const dx = c.x + c.w / 2 - mouse.x, dy = c.y + c.h / 2 - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 9000) { const f = (9000 - d2) / 9000; c.vx += (dx / Math.sqrt(d2 + 1)) * f * 4; c.vy += (dy / Math.sqrt(d2 + 1)) * f * 4; }
      c.vx *= 0.86; c.vy *= 0.86;
      c.x += c.vx; c.y += c.vy;
      c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
    });
    requestAnimationFrame(physics);
  }

  ScrollTrigger.create({
    trigger: "#p06", start: "top 70%",
    onEnter: () => { if (!running) { running = true; physics(); } },
  });
  window.addEventListener("resize", () => { chips.forEach((c) => { c.w = c.el.offsetWidth; c.h = c.el.offsetHeight; }); settle(); });

  function setFilter(catIdx, btn) {
    $$("#skillFilters button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    chips.forEach((c) => { c.el.hidden = catIdx >= 0 && c.ci !== catIdx; });
    settle();
  }
}

// ------------------------------------------------------------------
// PASS 07 — Geography + languages + contact
// ------------------------------------------------------------------
function pass07() {
  const langs = $("#langs");
  languages.forEach((l) => {
    const d = document.createElement("div");
    d.className = "lang";
    d.innerHTML = `<div class="lang__top mono"><span>${l.name}</span><span>${l.level}</span></div><div class="lang__bar"><i data-pct="${l.pct}"></i></div>`;
    langs.appendChild(d);
  });

  globe = initGlobe($("#globe"));

  ScrollTrigger.create({
    trigger: "#p07", start: "top 60%",
    onEnter: () => {
      if (globe.startArcs) globe.startArcs();
      $$(".lang__bar i").forEach((i) =>
        gsap.to(i, { width: i.dataset.pct + "%", duration: reduced ? 0.15 : 1, ease: "power3.out" }));
    },
  });

  // reveal titles across passes (mask-wipe, fires once)
  $$(".pass__title").forEach((t) => {
    if (reduced) return;
    gsap.from(t, { yPercent: 20, opacity: 0, duration: 0.8,
      scrollTrigger: { trigger: t, start: "top 85%" } });
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
  $("#closeAvail").textContent = meta.available;
  $("#buildStamp").textContent = "BUILD " + new Date().toISOString().slice(0, 16).replace("T", " ");

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

// live tokens/sec cursor
function cursorReadout() {
  if (reduced || !matchMedia("(hover: hover)").matches || !field) return;
  const cur = $("#cursor");
  addEventListener("pointermove", (e) => {
    cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-160%)`;
    cur.style.opacity = "1";
  });
  gsap.ticker.add(() => { cur.textContent = `TOKENS/SEC ${field.tps()}`; });
}

// ------------------------------------------------------------------
// Boot everything
// ------------------------------------------------------------------
async function init() {
  buildHeroChars();

  // Build all passes defensively — one failure must not freeze the page.
  const passes = { passAbout, passKit, pass02, pass03, pass04, pass05, pass06, pass07, contact, contactForm };
  for (const [name, fn] of Object.entries(passes)) {
    try { fn(); } catch (e) { console.error(`[${name}] failed:`, e); }
  }

  // fonts must be ready before sampling letterforms for the token targets
  try { await document.fonts.ready; } catch {}
  try {
    field = initField($("#field"));
  } catch (e) {
    console.error("[field] WebGL failed, hiding canvas:", e);
    const c = $("#field"); if (c) c.style.display = "none";
  }
  try { cursorReadout(); } catch (e) { console.error(e); }

  // Start the loader LAST so nothing above can block it.
  boot();

  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

init();
