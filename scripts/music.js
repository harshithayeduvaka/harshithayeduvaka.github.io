// music.js — her Spotify playlist.
//  • Clicking the headphones pops a "now playing" card out of them (cover, title,
//    artist, progress, ⏮ ▶ ⏭). The covers are swipeable: swipe to change song.
//  • A small player (cover + ⏮ ▶ ⏭) sits fixed on the right edge of the page and stays
//    there while scrolling. It only moves if the visitor drags it.
//  • Sound comes from Spotify's official embed (iFrame API). It is loaded on the first
//    press of play, so nothing from Spotify loads until a visitor asks for music.
//    Logged-in Spotify users hear full songs; everyone else hears 30-second previews.

import { isMuted, setMuted } from "./sound.js?v=20261111u";

const ICON = {
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 6.5v11L2.5 12zM21.5 6.5v11L13 12z"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 6.5v11l8.5-5.5zM2.5 6.5v11L11 12z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5h4v15H6zM14 4.5h4v15h-4z"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5h4l5-4.5v14l-5-4.5H3z"/><path class="w" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5h4l5-4.5v14l-5-4.5H3z"/><path class="w" d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
};
const fmt = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

export function initMusic({ playlist, gsap, reduced, isMobile, grid }) {
  const tracks = playlist.tracks, n = tracks.length;
  if (!n) return { toggleCard() {}, closeCard() {} };
  let idx = 0, playing = false, pos = 0, dur = tracks[0].ms, ctrl = null, loading = null, wantPlay = false, advancing = false;

  // ---------- now-playing card -------------------------------------------------
  const card = document.createElement("div");
  card.className = "np";
  card.id = "np";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", `Playlist: ${playlist.name}`);
  card.setAttribute("aria-hidden", "true");
  card.innerHTML = `
    <button type="button" class="np__close" aria-label="Close playlist">×</button>
    <div class="np__covers" tabindex="0" aria-label="Songs: swipe or use the arrow keys">
      ${tracks.map((t, i) => `<figure class="np__cover"><img src="${t.cover}" alt="${t.title} cover" width="300" height="300" loading="lazy" decoding="async" draggable="false" /></figure>`).join("")}
    </div>
    <div class="np__dots" aria-hidden="true">${tracks.map(() => "<i></i>").join("")}</div>
    <p class="np__src">${playlist.name}</p>
    <p class="np__title"></p>
    <p class="np__artist"></p>
    <div class="np__bar" role="slider" aria-label="Song position" tabindex="0" aria-valuemin="0"><i></i></div>
    <div class="np__times"><span class="np__el">0:00</span><span class="np__rem"></span></div>
    <div class="np__ctrls">
      <button type="button" data-act="prev" aria-label="Previous song">${ICON.prev}</button>
      <button type="button" data-act="play" class="np__play" aria-label="Play">${ICON.play}</button>
      <button type="button" data-act="next" aria-label="Next song">${ICON.next}</button>
    </div>
    <div class="np__embed" aria-label="Spotify player"></div>
    <a class="np__open" href="${playlist.url}" target="_blank" rel="noopener">Open in Spotify ↗</a>`;
  (isMobile ? document.body : grid).appendChild(card);
  if (isMobile) card.classList.add("np--sheet");

  const covers = card.querySelector(".np__covers");
  const dots = [...card.querySelectorAll(".np__dots i")];
  const elTitle = card.querySelector(".np__title"), elArtist = card.querySelector(".np__artist");
  const bar = card.querySelector(".np__bar"), barFill = bar.querySelector("i");
  const elEl = card.querySelector(".np__el"), elRem = card.querySelector(".np__rem");
  const embedBox = card.querySelector(".np__embed");

  // ---------- floating mini player (fixed, right edge) --------------------------
  const mini = document.createElement("div");
  mini.className = "mini";
  mini.setAttribute("role", "group");
  mini.setAttribute("aria-label", "Music controls");
  mini.innerHTML = `
    <img class="mini__art" src="${tracks[0].cover}" alt="" width="44" height="44" loading="lazy" decoding="async" draggable="false" />
    <button type="button" data-act="prev" aria-label="Previous song">${ICON.prev}</button>
    <button type="button" data-act="play" class="mini__play" aria-label="Play">${ICON.play}</button>
    <button type="button" data-act="next" aria-label="Next song">${ICON.next}</button>
    <i class="mini__sep" aria-hidden="true"></i>
    <button type="button" data-act="sound" class="mini__sound" aria-pressed="false" aria-label="Sound off">${ICON.soundOn}</button>`;
  document.body.appendChild(mini);
  const miniArt = mini.querySelector(".mini__art");

  // ---------- rendering ---------------------------------------------------------
  function renderTrack() {
    const t = tracks[idx];
    elTitle.textContent = t.title;
    elArtist.textContent = t.artist;
    miniArt.src = t.cover;
    miniArt.alt = `${t.title} by ${t.artist}`;
    dots.forEach((d, i) => d.classList.toggle("is-on", i === idx));
    renderTime();
  }
  function renderTime() {
    const p = dur ? Math.min(1, pos / dur) : 0;
    barFill.style.width = p * 100 + "%";
    bar.setAttribute("aria-valuemax", String(Math.round(dur / 1000)));
    bar.setAttribute("aria-valuenow", String(Math.round(pos / 1000)));
    elEl.textContent = fmt(pos);
    elRem.textContent = "-" + fmt(dur - pos);
  }
  function renderPlaying() {
    [card.querySelector(".np__play"), mini.querySelector(".mini__play")].forEach((b) => {
      b.innerHTML = playing ? ICON.pause : ICON.play;
      b.setAttribute("aria-label", playing ? "Pause" : "Play");
    });
    mini.classList.toggle("is-playing", playing);
    card.classList.toggle("is-playing", playing);
  }

  // ---------- Spotify (official embed, loaded on first play) --------------------
  function ensure() {
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      window.onSpotifyIframeApiReady = (API) => {
        const el = document.createElement("div");
        embedBox.appendChild(el);
        API.createController(el, { uri: tracks[idx].uri, width: "100%", height: 80 }, (c) => {
          ctrl = c;
          c.addListener("ready", () => { resolve(c); if (wantPlay) c.play(); });
          c.addListener("playback_update", (e) => {
            const d = e.data || {};
            if (d.duration) dur = d.duration;
            pos = d.position || 0;
            playing = !d.isPaused;
            if (playing) wantPlay = false;
            renderTime(); renderPlaying();
            // song finished: move on to the next one
            if (d.duration && d.isPaused && pos >= d.duration - 400 && !advancing) {
              advancing = true; go(idx + 1, true); setTimeout(() => { advancing = false; }, 1500);
            }
          });
        });
      };
      const s = document.createElement("script");
      s.src = "https://open.spotify.com/embed/iframe-api/v1";
      s.async = true;
      s.onerror = () => { loading = null; reject(new Error("Spotify blocked")); };
      document.head.appendChild(s);
    });
    return loading;
  }

  // switch to song i (wraps around); keep playing if asked
  async function go(i, autoplay) {
    idx = ((i % n) + n) % n;
    pos = 0; dur = tracks[idx].ms;
    renderTrack();
    scrollToIdx();
    if (!ctrl && !autoplay) return;
    try {
      const c = await ensure();
      wantPlay = !!autoplay;
      c.loadUri(tracks[idx].uri);
      if (autoplay) setTimeout(() => { if (wantPlay) c.play(); }, 600);
    } catch { window.open(playlist.url, "_blank", "noopener"); }
  }
  async function toggle() {
    if (!ctrl) { // first press: load Spotify and start the current song
      wantPlay = true;
      try { const c = await ensure(); c.play(); } catch { window.open(playlist.url, "_blank", "noopener"); }
      return;
    }
    ctrl.togglePlay();
  }
  // sound on/off for the whole site (desk sounds). Turning it off also pauses the music.
  const soundBtn = mini.querySelector(".mini__sound");
  const paintSound = () => {
    const off = isMuted();
    soundBtn.innerHTML = off ? ICON.soundOff : ICON.soundOn;
    soundBtn.setAttribute("aria-pressed", String(off));
    soundBtn.setAttribute("aria-label", off ? "Sound on" : "Sound off");
    soundBtn.title = off ? "Sound off" : "Sound on";
    mini.classList.toggle("is-muted", off);
  };
  paintSound();
  const act = (a) => {
    if (a === "sound") {
      setMuted(!isMuted()); paintSound();
      if (isMuted() && (playing || wantPlay)) toggle();
      return;
    }
    return a === "play" ? toggle() : go(idx + (a === "next" ? 1 : -1), playing || wantPlay);
  };

  // ---------- swipeable covers --------------------------------------------------
  let programmatic = false, scrollT = 0;
  function scrollToIdx() {
    programmatic = true;
    covers.scrollTo({ left: idx * covers.clientWidth, behavior: reduced ? "auto" : "smooth" });
    clearTimeout(scrollT); scrollT = setTimeout(() => { programmatic = false; }, 500);
  }
  covers.addEventListener("scroll", () => {
    clearTimeout(scrollT);
    scrollT = setTimeout(() => {
      const i = Math.round(covers.scrollLeft / covers.clientWidth);
      if (programmatic) { programmatic = false; return; }
      if (i !== idx) go(i, playing || wantPlay);
    }, 130);
  }, { passive: true });
  covers.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); act("next"); }
    if (e.key === "ArrowLeft") { e.preventDefault(); act("prev"); }
  });
  // mouse: drag the covers sideways like a touch swipe
  {
    let sx = 0, sl = 0, down = false;
    covers.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; sx = e.clientX; sl = covers.scrollLeft;
      covers.classList.add("is-dragging");
      try { covers.setPointerCapture(e.pointerId); } catch {}
    });
    covers.addEventListener("pointermove", (e) => { if (down) covers.scrollLeft = sl - (e.clientX - sx); });
    const up = (e) => {
      if (!down) return; down = false;
      covers.classList.remove("is-dragging");
      const dx = e.clientX - sx, w = covers.clientWidth;
      const i = Math.max(0, Math.min(n - 1, Math.abs(dx) > w * 0.15 ? idx + (dx < 0 ? 1 : -1) : idx));
      if (i !== idx) go(i, playing || wantPlay); else scrollToIdx();
    };
    covers.addEventListener("pointerup", up);
    covers.addEventListener("pointercancel", up);
  }

  // progress bar: click / arrow keys to seek
  bar.addEventListener("click", (e) => {
    if (!ctrl) return;
    const r = bar.getBoundingClientRect();
    ctrl.seek(((e.clientX - r.left) / r.width) * (dur / 1000));
  });
  bar.addEventListener("keydown", (e) => {
    if (!ctrl || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
    e.preventDefault();
    ctrl.seek(Math.max(0, pos / 1000 + (e.key === "ArrowRight" ? 5 : -5)));
  });

  card.querySelectorAll(".np__ctrls button").forEach((b) => b.addEventListener("click", () => act(b.dataset.act)));

  // ---------- open / close the card (pops out of the headphones) ---------------
  let open = false;
  // The card opens on the LEFT of the headphones (towards the page edge), never over the
  // notebook. Width: 240px max, shrinking to fit (170px min). If the gap left of the
  // headphones is too small, the card covers the headphones instead and stops just before
  // the notebook. Only when even that fails does it open to the right of the headphones.
  function placeCard(hp) {
    if (isMobile) return;
    const g = grid.getBoundingClientRect();
    const h = (hp.querySelector("img") || hp).getBoundingClientRect();
    const nbEl = document.querySelector(".kit__item--notebook img");
    const nb = nbEl ? nbEl.getBoundingClientRect() : null;
    const edges = [h.left - 12];                        // just left of the headphones
    if (nb && nb.left > h.left) edges.push(nb.left - 14); // or just left of the notebook
    const right = edges.find((e) => e - 12 >= 170);    // first spot with enough room
    let left;
    if (right !== undefined) {
      card.style.width = Math.min(240, right - 12) + "px";
      left = right - g.left - card.offsetWidth;
    } else {
      card.style.width = "";
      left = Math.max(8, Math.min(h.right - g.left + 14, g.width - card.offsetWidth - 8));
    }
    const ch = card.offsetHeight;
    let top = h.top - g.top - 10;
    top = Math.max(8, Math.min(top, g.height - ch - 8));
    card.style.left = left + "px"; card.style.top = top + "px";
    // grow from the headphones' centre
    card.style.transformOrigin = `${h.left + h.width / 2 - g.left - left}px ${h.top + h.height / 2 - g.top - top}px`;
  }
  function openCard(hp) {
    if (open) return;
    open = true;
    card.classList.add("is-open");
    card.setAttribute("aria-hidden", "false");
    placeCard(hp);
    renderTrack();
    covers.scrollLeft = idx * covers.clientWidth;
    if (hp) hp.setAttribute("aria-expanded", "true");
    if (!reduced) gsap.fromTo(card, { scale: 0.15, opacity: 0, rotate: -6 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.55, ease: "back.out(1.5)" });
    else gsap.set(card, { scale: 1, opacity: 1, rotate: 0 });
  }
  function closeCard() {
    if (!open) return;
    open = false;
    const hp = document.querySelector(".kit__item--headphones");
    if (hp) hp.setAttribute("aria-expanded", "false");
    card.setAttribute("aria-hidden", "true");
    const done = () => card.classList.remove("is-open"); // stays in the page so music keeps playing
    if (reduced) { gsap.set(card, { opacity: 0 }); done(); return; }
    gsap.to(card, { scale: 0.15, opacity: 0, rotate: -6, duration: 0.3, ease: "power2.in", onComplete: done });
  }
  card.querySelector(".np__close").addEventListener("click", closeCard);
  document.addEventListener("pointerdown", (e) => {
    if (open && !card.contains(e.target) && !e.target.closest(".kit__item--headphones") && !mini.contains(e.target)) closeCard();
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeCard(); });
  // keep the card beside the headphones when the window (and so the desk) changes size
  addEventListener("resize", () => {
    const hp = document.querySelector(".kit__item--headphones");
    if (open && hp) placeCard(hp);
  });

  // ---------- mini player: fixed on the right; draggable only when dragged ------
  mini.querySelectorAll("button").forEach((b) => b.addEventListener("click", (e) => {
    if (mini.dataset.dragged === "1") { e.preventDefault(); return; }
    act(b.dataset.act);
  }));
  {
    let sx = 0, sy = 0, ox = 0, oy = 0, down = false, moved = false;
    mini.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      down = true; moved = false; mini.dataset.dragged = "0";
      const r = mini.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
    });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (!moved) { moved = true; mini.classList.add("is-dragging"); try { mini.setPointerCapture(e.pointerId); } catch {} }
      const w = mini.offsetWidth, h = mini.offsetHeight;
      const x = Math.max(6, Math.min(innerWidth - w - 6, ox + dx));
      const y = Math.max(6, Math.min(innerHeight - h - 6, oy + dy));
      Object.assign(mini.style, { left: x + "px", top: y + "px", right: "auto", transform: "none" });
    });
    addEventListener("pointerup", () => {
      if (!down) return; down = false;
      mini.classList.remove("is-dragging");
      if (moved) { mini.dataset.dragged = "1"; setTimeout(() => { mini.dataset.dragged = "0"; }, 0); }
    });
    // keep a moved player on screen if the window shrinks
    addEventListener("resize", () => {
      if (!mini.style.left) return;
      const r = mini.getBoundingClientRect();
      mini.style.left = Math.max(6, Math.min(innerWidth - r.width - 6, r.left)) + "px";
      mini.style.top = Math.max(6, Math.min(innerHeight - r.height - 6, r.top)) + "px";
    });
  }

  renderTrack(); renderPlaying();
  return {
    toggleCard(hp) { open ? closeCard() : openCard(hp); },
    closeCard,
  };
}
