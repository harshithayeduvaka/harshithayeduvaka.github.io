// bookshelf.js — "On My Shelf": her books standing on two wooden shelves (Read / TBR).
// Click (or Enter / Space) a spine: the book tips forward from its top, its neighbours
// lean into the gap, it slides out toward you and turns so the front cover faces you.
// Close (×, Esc, click outside): the same motion in reverse, neighbours settle upright.
// Book data: content.js `books`. Covers: assets/covers/<slug>.jpg.

// ---------- tunables (degrees / seconds) ----------------------------------------
const TIP = -16;               // book tips toward you, pivoting on its bottom front edge (rotateX)
const LEAN = 4;                // direct neighbours lean into the gap (rotateZ)
const LEAN_FAR = 1;            // books two places away
const TIP_DUR = 0.24;          // a) tip forward
const SLIDE_AT = 0.2, SLIDE_DUR = 0.6;   // c) slide out toward the viewer (+ scale up)
const TURN_AT = 0.36, TURN_DUR = 0.5;    // c) turn 90° so the cover faces you
const CAPTION_AT = 0.6;        // d) title + author fade in
const EASE_SLIDE = "power3.inOut";
const EASE_TURN = "power2.inOut";
const EASE_SETTLE = "back.out(3)";       // neighbours settle with a small overshoot
const CLOSE_SPEED = 1.15;      // closing plays the same timeline backwards, a little faster

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const SHELVES = [{ id: "read", label: "Dog-Eared", aria: "read" }, { id: "tbr", label: "TBR", aria: "to be read" }];

export function initBookshelf({ root, books, gsap, reduced, getLenis = () => null }) {
  const byId = new Map(books.map((b) => [b.slug, b]));

  // ---------- shelves ----------
  const spineHTML = (b) => `<span class="spine__title">${esc(b.title)}</span><span class="spine__author">${esc(b.author)}</span>`;
  root.innerHTML = SHELVES.map((s) => {
    const list = books.filter((b) => b.shelf === s.id);
    if (!list.length) return "";
    return `
    <div class="shelf">
      <h3 class="shelf__label mono">${s.label}</h3>
      <div class="shelf__scroll"><div class="shelf__row">${list.map((b) => `
        <div class="book-slot" style="--w:${b.thickness};--h:${b.height};--spine:${b.spineColor};--ink:${b.textColor}">
          <button type="button" class="book" data-slug="${b.slug}" aria-haspopup="dialog"
            aria-label="${esc(b.title)} by ${esc(b.author)}, ${s.aria}">
            <span class="book__body" aria-hidden="true">
              <span class="book__top"></span>
              <span class="book__spine spine">${spineHTML(b)}</span>
            </span>
          </button>
        </div>`).join("")}
      </div></div>
      <div class="shelf__plank" aria-hidden="true"></div>
    </div>`;
  }).join("");

  // ---------- the open view (one shared <dialog>: focus stays inside, Esc closes) ----------
  const dlg = document.createElement("dialog");
  dlg.className = "bookview";
  dlg.setAttribute("aria-labelledby", "bvTitle");
  dlg.innerHTML = `
    <div class="bookview__dim"></div>
    <div class="bookview__stage">
      <div class="bookview__fly"><div class="bookview__box">
        <span class="bookview__spine spine"></span>
        <span class="bookview__cover"><span class="bookview__ph"><b></b><i></i></span><img alt="" decoding="async" /></span>
      </div></div>
      <div class="bookview__cap">
        <p class="bookview__shelf mono"></p>
        <h3 id="bvTitle" class="bookview__title"></h3>
        <p class="bookview__author"></p>
      </div>
    </div>
    <button type="button" class="bookview__close" aria-label="Close">×</button>`;
  document.body.appendChild(dlg);
  const $ = (s) => dlg.querySelector(s);
  const dim = $(".bookview__dim"), fly = $(".bookview__fly"), box = $(".bookview__box");
  const vSpine = $(".bookview__spine"), cover = $(".bookview__cover"), img = $(".bookview__cover img");
  const cap = $(".bookview__cap");

  // cover: her file → Open Library (ISBN, else title + author search) → typographic cover
  let coverToken = 0;
  function loadCover(b) {
    const token = ++coverToken;
    cover.classList.remove("has-img");
    $(".bookview__ph b").textContent = b.title;
    $(".bookview__ph i").textContent = b.author;
    const tries = [b.cover];
    if (b.isbn) tries.push(`https://covers.openlibrary.org/b/isbn/${encodeURIComponent(b.isbn)}-L.jpg?default=false`);
    let k = 0, searched = !!b.isbn;
    const next = async () => {
      if (token !== coverToken) return;
      if (k < tries.length) { img.src = tries[k++]; return; }
      if (!searched) {
        searched = true;
        try {
          const q = `title=${encodeURIComponent(b.title)}&author=${encodeURIComponent(b.author)}&limit=1&fields=cover_i`;
          const j = await (await fetch(`https://openlibrary.org/search.json?${q}`)).json();
          const id = j.docs?.[0]?.cover_i;
          if (id && token === coverToken) { img.src = `https://covers.openlibrary.org/b/id/${id}-L.jpg`; return; }
        } catch {}
      }
      // nothing found: the typographic cover stays
    };
    img.onload = () => { if (token === coverToken) cover.classList.add("has-img"); };
    img.onerror = next;
    next();
  }

  // ---------- neighbours lean into the gap / settle back ----------
  function lean(slot, on) {
    const row = [...slot.parentElement.children], i = row.indexOf(slot);
    [[i - 1, LEAN, "100% 100%"], [i + 1, -LEAN, "0% 100%"], [i - 2, LEAN_FAR, "100% 100%"], [i + 2, -LEAN_FAR, "0% 100%"]]
      .forEach(([k, deg, origin]) => {
        const el = row[k];
        if (!el) return;
        gsap.killTweensOf(el);
        if (on) gsap.to(el, { rotation: deg, transformOrigin: origin, duration: 0.45, delay: 0.1, ease: "power2.out" });
        else gsap.to(el, { rotation: 0, duration: 0.6, ease: EASE_SETTLE });
      });
  }

  // ---------- open / close ----------
  let cur = null, tl = null, busy = false;

  function open(btn) {
    if (cur || busy) return;
    const b = byId.get(btn.dataset.slug);
    busy = true;
    const slot = btn.parentElement;
    cur = { btn, slot };
    dlg.style.setProperty("--spine", b.spineColor);
    dlg.style.setProperty("--ink", b.textColor);
    vSpine.innerHTML = spineHTML(b);
    $(".bookview__shelf").textContent = b.shelf === "read" ? "Dog-Eared" : "On my TBR";
    $(".bookview__title").textContent = b.title;
    $(".bookview__author").textContent = b.author;
    loadCover(b);

    const spineEl = btn.querySelector(".book__spine");
    const r = spineEl.getBoundingClientRect();           // measured upright, before tipping
    const fs = parseFloat(getComputedStyle(spineEl.firstElementChild).fontSize);
    dlg.showModal();
    getLenis()?.stop();
    document.documentElement.classList.add("book-open");

    gsap.set([fly, box], { clearProps: "transform" });
    const f = fly.getBoundingClientRect();                // final (centred) position
    const s = r.height / f.height;                        // start scale: cover height = spine height
    const t = r.width / s;                                // spine depth so it matches on screen
    fly.style.setProperty("--t", t + "px");
    vSpine.style.fontSize = fs / s + "px";

    if (reduced) {                                         // reduced motion: a simple fade
      gsap.set(fly, { opacity: 1 }); gsap.set(cap, { opacity: 1, y: 0 });
      gsap.fromTo([dim, fly, cap], { opacity: 0 }, { opacity: 1, duration: 0.2, onComplete: () => { busy = false; } });
      return;
    }

    gsap.set(dim, { opacity: 0 });
    gsap.set(cap, { opacity: 0, y: 10 });
    gsap.set(fly, { x: r.left + r.width / 2 - (f.left + f.width / 2), y: r.top + r.height / 2 - (f.top + f.height / 2), scale: s, opacity: 0 });
    gsap.set(box, { rotationY: 90, rotationX: TIP, z: -f.width / 2 });   // spine faces you, tipped like the shelf copy
    gsap.set(btn, { transformOrigin: "50% 100%" });
    lean(slot, true);

    const line = tl = gsap.timeline({
      onComplete: () => { busy = false; },
      onReverseComplete: finishClose,
    })
      .to(btn, { rotationX: TIP, duration: TIP_DUR, ease: "power2.out" }, 0)       // a) finger hooks the top
      .to(dim, { opacity: 1, duration: 0.5, ease: "power1.out" }, 0.1)
      .set(fly, { opacity: 1 }, SLIDE_AT).set(btn, { opacity: 0 }, SLIDE_AT)        // hand over to the flying copy
      .to(fly, { x: 0, y: 0, scale: 1, duration: SLIDE_DUR, ease: EASE_SLIDE }, SLIDE_AT) // c) slide out
      .to(box, { rotationX: 0, duration: 0.35, ease: "power2.out" }, SLIDE_AT + 0.02)
      .to(box, { rotationY: 0, z: 0, duration: TURN_DUR, ease: EASE_TURN }, TURN_AT)       // c) cover turns to you
      .to(cap, { opacity: 1, y: 0, duration: 0.3 }, CAPTION_AT)                            // d) caption
      .call(() => { if (line.reversed()) lean(slot, false); }, null, SLIDE_AT + 0.05);       // closing: neighbours settle
  }

  function close() {
    if (!cur || busy) return;
    busy = true;
    if (reduced) { gsap.to([dim, fly, cap], { opacity: 0, duration: 0.2, onComplete: finishClose }); return; }
    tl.timeScale(CLOSE_SPEED).reverse();
  }

  function finishClose() {
    if (!cur) return;
    const { btn, slot } = cur;
    cur = null; if (tl) tl.kill(); tl = null; busy = false;
    gsap.killTweensOf(btn);
    gsap.set(btn, { clearProps: "transform,opacity" });
    if (reduced) lean(slot, false);
    if (dlg.open) dlg.close();
    document.documentElement.classList.remove("book-open");
    getLenis()?.start();
    btn.focus({ preventScroll: true });
  }

  root.addEventListener("click", (e) => {
    const btn = e.target.closest(".book");
    if (btn) { if (e.detail) btn.blur(); open(btn); }
  });
  $(".bookview__close").addEventListener("click", close);
  dim.addEventListener("click", close);
  dlg.addEventListener("cancel", (e) => { e.preventDefault(); close(); });             // Esc
  dlg.addEventListener("close", () => {                  // closed some other way: snap everything back
    if (!cur) return;
    if (tl) tl.progress(0).kill();
    lean(cur.slot, false);
    finishClose();
  });
}
