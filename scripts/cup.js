// cup.js — reading progress as a cup of coffee (fixed, bottom left; the music player is on the right).
// Full at the top of the page, empty at the bottom. When scrolling stops the coffee sloshes once.
// At the bottom a "Refill?" button appears: it glides back to the top.
// Only transform/opacity animate. Reduced motion: the level still follows the page, but no slosh,
// no steam, and the refill jumps straight to the top.
// The cup itself is decoration (aria-hidden); the Refill button is the only control.

const FULL_Y = 0, EMPTY_Y = 36; // liquid offset in SVG units: 0 = brim, 36 = below the bottom

export function initCup({ gsap, reduced, getLenis }) {
  const wrap = document.createElement("div");
  wrap.className = "cup-progress";
  wrap.innerHTML = `
    <svg class="cup-progress__cup" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="cupInside"><path d="M14.5 20h29v24a10 10 0 0 1-10 10h-9a10 10 0 0 1-10-10z"/></clipPath>
      </defs>
      <g class="cup-progress__steam"><path d="M25 14c-3-3.5 3-5.5 0-10"/><path d="M33 15c-3-3.5 3-5.5 0-10"/></g>
      <ellipse class="cup-progress__saucer" cx="30" cy="58.5" rx="26" ry="4"/>
      <path class="cup-progress__handle" d="M45.5 25h3.5a7 7 0 0 1 0 14h-3.5"/>
      <path class="cup-progress__body" d="M12 18h34v26a12 12 0 0 1-12 12h-10a12 12 0 0 1-12-12z"/>
      <g clip-path="url(#cupInside)">
        <g class="cup-progress__level">
          <g class="cup-progress__slosh">
            <path class="cup-progress__coffee" d="M4 21.5q6-2.2 12 0t12 0t12 0t12 0t12 0v44h-60z"/>
            <path class="cup-progress__crema" d="M4 21.5q6-2.2 12 0t12 0t12 0t12 0t12 0v2.6q-6 2.2-12 0t-12 0t-12 0t-12 0t-12 0z"/>
          </g>
        </g>
      </g>
      <path class="cup-progress__rim" d="M12 18h34"/>
    </svg>
    <button type="button" class="cup-progress__refill" aria-label="Refill: back to the top of the page" tabindex="-1">Refill?</button>`;
  document.body.appendChild(wrap);

  const level = wrap.querySelector(".cup-progress__level");
  const slosh = wrap.querySelector(".cup-progress__slosh");
  const refill = wrap.querySelector(".cup-progress__refill");
  const hero = document.querySelector(".hero");

  let p = 0, empty = false, stopTimer = 0, raf = 0;
  const update = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const y = scrollY;
    p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    level.style.transform = `translateY(${FULL_Y + (EMPTY_Y - FULL_Y) * p}px)`;
    // shown once the visitor is past the top of the desk (the desk has its own cappuccino)
    wrap.classList.toggle("is-on", y > (hero ? hero.offsetHeight * 0.35 : 200));
    const isEmpty = p > 0.985;
    if (isEmpty !== empty) {
      empty = isEmpty;
      wrap.classList.toggle("is-empty", empty);
      refill.tabIndex = empty ? 0 : -1; // only reachable while it's showing
    }
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(update);
    clearTimeout(stopTimer);
    if (!reduced) stopTimer = setTimeout(settle, 160);
  };
  // scrolling stopped: the coffee sloshes once, a small damped rock (~0.5s)
  const settle = () => {
    if (p > 0.97) return; // nothing left to slosh
    gsap.fromTo(slosh, { rotation: 0 }, { keyframes: [
      { rotation: 5, duration: 0.12, ease: "sine.out" },
      { rotation: -3.2, duration: 0.14, ease: "sine.inOut" },
      { rotation: 1.4, duration: 0.12, ease: "sine.inOut" },
      { rotation: 0, duration: 0.12, ease: "sine.out" },
    ], transformOrigin: "50% 30%", overwrite: true });
  };

  refill.addEventListener("click", () => {
    const land = () => { const top = document.querySelector(".brand"); if (top) top.focus({ preventScroll: true }); };
    const lenis = getLenis();
    if (lenis && !reduced) lenis.scrollTo(0, { duration: 1.4, onComplete: land });
    else { scrollTo(0, 0); land(); }
  });

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  update();
}
