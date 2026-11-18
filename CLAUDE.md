# Harshitha Yeduvaka — Portfolio

Personal portfolio for Harshitha Yeduvaka (MSc International Marketing & Business
Development, SKEMA Paris). Goal: land a **marketing internship in Paris, 2026**.
Audience: marketing hiring managers and recruiters (FR/EU), plus startup founders.

Concept: **a coffee-coded desk**. The first screen is a desk (ref: jackiehu.design):
an open notebook with her name, title and tagline written on it, plus headphones (her Spotify playlist pops out of them, scripts/music.js),
an instax camera (click = her photo slides out as a print), a pen, a cappuccino, an alarm clock (click = short ring + shake) and a binder clip (click = snap), both where the vinyl card used to be, and a stained-glass lamp partly behind the notebook (click = lights up 1s + switch click; kit item listed first so it sits under the notebook). A small player (⏮ ▶ ⏭) is fixed on the right edge;
it only moves when dragged. Playlist data lives in content.js `playlist`; audio via Spotify's official
iFrame embed (loaded on first play; 30s previews unless logged in). Vinyl record card removed.
Below it: "The Story So Far" badges, case studies, About (a letter on recycled ruled paper, plain tone with no specks: text from content.js `about`, no photo (removed at her request), signature.png, her wooden knight photo cut out as assets/objects/knight.avif; the ruled lines follow `--lh`, so keep paragraph spacing at one line), "On My Shelf" (scripts/bookshelf.js: books from content.js `books`, covers in assets/covers/<slug>.jpg; click a spine = tip, neighbours lean, slide out + turn to the cover in a <dialog>; tunables at the top of bookshelf.js), contact. (ohmyATS demo removed: its badge
links to the real product instead.) She asked for: no CV-copy intro, no object labels/numbers,
no Spotify, warm coffee palette, no em dashes (—) in visible copy, no skills section,
no "PASS" rail labels. Experience = "The Story So Far ✦" (2026-11-18, replaced the ID badges): the desk camera (assets/objects/camera.avif) slides in and
ejects one instant photo per WORK role (content.js `experience`, type "work"; SKEMA/education is not shown here). Each develops
from blank in ~1.1s (plays once), then flies to its spot in the row and gets washi tape. Photo = `photo` {src, alt} in
assets/work/ (ohmyats.avif = screenshot of the live product; nomadx.avif + keka.avif = her mock-ups), caption = role (serif)
+ `note` handwritten in Caveat; company · dates under it; ohmyATS also has a Visit link. Tilts TILT in pass03() (±2.5° max).
Phones: stacked, each photo drops in + develops as it scrolls into view. Reduced motion: finished photos, no camera move.
Featured Work = split view: names list left, one preview panel right (slide one of the deck, metric, Open deck) swapped on hover/focus; phones keep the same split view with smaller type. Case studies open in an on-page deck viewer (<dialog>); real decks = `slides` image list
per project in content.js, otherwise slides are built from the project's text.
Desk modes: notebook (default, pencil icon) vs "tidy" (internally chaos; broom icon; icons under the desk; kit[].chaos positions; name/title/
tagline move from the notebook pages to #chaosInk on the desk). Desktop only.
Desk extras: a blue "stack" folder (below the notebook) pops `tools` (content.js) out sideways, 4 each side; tool logos are
PNGs she supplied in assets/tools/ (tile: "full" for square app icons, else a light tile).
Folder click = assets/sounds/click.mp3 if present (her Pixabay click), else a synthesized click.
Coffee cup = assets/sounds/sip.mp3 (Pixabay "slurp" by freesound_community, Pixabay licence): plays the first sip only (offset 0.09s, 0.75s long, set in app.js).
Brand mark: assets/logo-hy.png (her HY monogram, transparent, brown #522606), top left of the page, scrolls with content (not fixed)
+ favicon; sound on/off is the last button of the fixed mini player (music.js; off also pauses the music). No Tidy button. A top-down cappuccino (kit item `cup`, latte art in
assets/objects/crema.avif) replaced the coffee-ring stain; click = a short sip (sip.mp3 if present, capped 1.5s; else synth `sip`) + steam wisps only (the cup
never hops or lifts; she found that weird).
Testing note: reduced-motion CSS gives every element a 0.15s transition, which headless Chrome
never advances; inject `*{transition:none!important}` in test harnesses to see final states.

## Iced Coffee & Glass refactor (2026-11-18)
- Themes: Iced Latte (light, default) / Espresso (dark). Tokens at the top of main.css: theme tokens (--bg, --text, --accent, --link, --border, --glass-*) vs a fixed material palette (--espresso, --cream, --roast... for paper, wood, badges, deck). Saved in localStorage "theme" ("iced-latte"/"espresso"; legacy "light"/"dark" migrated by the inline <head> script, which also prevents a flash). No saved choice = prefers-color-scheme. Switch = .theme-switch top right; cross-fade via View Transitions.
- Fonts: Fraunces only, everywhere (her request, 2026-11-18). Her handwriting on the notebook is an image. Token: --font.
- Featured Work = glass card grid (pass05): thumb, title, kind, The Stack (content.js projects[].stack, pulled from each project's text), The Impact (projects[].impact), Open deck. Blurred caramel blobs drift behind (#p05::before/::after).
- "What makes me, me?" + "On My Shelf" merged into "Off the Menu" (#about): marquee (content.js `marquee`), letter, desk photo (about.deskPhoto, empty = warm placeholder frame; replaced the knight), shelf (#books kept for the in-text link).
- Reveals for new elements: IntersectionObserver reveal() in app.js (existing GSAP reveals kept). Footer text is exact; "Say hi." = mailto.

## Stack
- Plain HTML + CSS + ES modules. No build step, no framework.
- Vendored libraries in `vendor/` (no CDN): GSAP 3.13 + ScrollTrigger, Lenis 1.1.13. (Three.js removed
  with the globe.)
- Hosting: GitHub Pages from `main` (repo `harshithayeduvaka/harshitha-yeduvaka.github.io`).

## Run locally
```
cd ~/Desktop/harshitha-yeduvaka.github.io
python3 serve.py               # then open http://localhost:8000 (no-cache dev server)
```
A server is required: ES modules don't load from `file://`.
Cache busting: index.html, app.js imports and ASSET_V (desk images + signature) carry `?v=YYYYMMDDx`. Bump all
after editing CSS/JS so browsers fetch fresh files.

## Files
```
index.html          markup skeleton for every pass (sections are filled by JS)
styles/main.css     all styles; design tokens live in :root at the top
scripts/content.js  ALL editable content (desk objects, jobs, projects, skills, links)
scripts/app.js      animation orchestration + section rendering + ohmyATS demo
scripts/sound.js    Web Audio synth: desk click sounds (lo-fi loop no longer used)
scripts/music.js    playlist: pop-out now-playing card, swipeable covers, fixed mini player, Spotify embed
assets/             images are AVIF (small, transparent): her photo (instax print) + desk objects (assets/objects/; notebook
                    and camera are transparent PNG cut-outs)
vendor/             third-party libs, never edit
resume.pdf          downloadable CV (linked from meta.resume)
```

## Conventions
- **Content changes go in `scripts/content.js` only.** Components read from it.
- Never invent facts. Missing content = `[TODO: ...]` placeholder.
- Every animation must have a `prefers-reduced-motion` path (`reduced` flag in app.js,
  `@media (prefers-reduced-motion: reduce)` in CSS) that shows the final static state.
- Each pass in app.js is wrapped in try/catch at init, so one failure can't blank the page.
- Mobile breakpoint: 860px (`isMobile` in JS, `@media (max-width: 860px)` in CSS).
  Desk objects drag anywhere on the page (desktop); dragging near the window edge auto-scrolls.
  Phones show the same layouts as the laptop, scaled down (the desk scene, letter, split Featured Work). Only dragging is laptop-only (`canDrag` = mouse/trackpad), so touch scrolling works.
- Targeted edits over rewrites. Commit after each phase.

## Design tokens ("Coffee")
| Token        | Value     | Use                                   |
|--------------|-----------|---------------------------------------|
| `--espresso` | `#5A3825` | primary ink, headings, links          |
| `--cream`    | `#F6EFE6` | page background                       |
| `--roast`    | `#2B1D16` | body text, dark panels                |
| `--caramel`  | `#A8692E` | metrics, highlights, focus ring       |
| `--latte`    | `#DCC9B4` | rules, borders, muted fills           |
| `--cherry`   | `#B4432F` | used sparingly: "missing"             |

Type: **Fraunces everywhere** (headings, body, labels; her choice). Title + tagline on the notebook and in tidy mode are HER handwriting from her clean scan (assets/hand-title.png, hand-tagline-1/2.png; kit.ink.hand in content.js, per-line `tilt` straightens them; ink kept as written). If `hand` is removed they fall back to Fraunces text. Martian Mono removed. (Formerly: Fraunces display, Inter Tight body, Martian Mono
(labels, uppercase, 0.08em tracking), **her own handwriting** for the name (assets/signature.png, transparent, ink #3A2618; Allura font no longer used for it).
Fluid scale `--fs-11` → `--fs-hero`.
Spacing: `--gutter`, `--rail-w`, `--pass-pad` (all clamp-based). Easing: `--ease-parse`.

## Phase plan (approve each with "next"; commit at the end of each)
- **Phase 0, Plan** ✅ Stack stays plain HTML/CSS/ES modules (already built; Astro adds a
  build step for no gain on a one-page site on GitHub Pages).
- **Phase 1, Baseline** ✅ commit the existing build; add `.gitignore` entries; fix the
  relative `canonical` (needs the absolute `https://harshithayeduvaka.github.io/` URL).
- **Phase 2, Missing sections** ✅ About pass with photo (`assets/`), SKEMA as an
  `type: "education"` timeline panel, `mine`/`link` fields on projects, FormSubmit form
  (`meta.formEndpoint`; needs one-time activation from the inbox). Original notes:
  - About + photo: a short bio block in Pass 02 or the hero. Needs her photo (`[TODO]`).
  - Education: SKEMA MSc in the Pass 03 timeline. Dates and details come from resume.pdf.
  - Project links/images: optional `link`/`image` fields in `projects`, hidden when empty.
  - Contact form: Formspree in the Close section. Needs her form ID (`[TODO]`).
- **Phase 3, Polish**: dark mode (tokens swap under `prefers-color-scheme` + toggle),
  responsive QA at 375/768/1280, hover/focus audit, reduced-motion audit.
- **Phase 4, Quality**: OG image (1200×630), favicon (SVG + PNG), sitemap.xml, robots.txt,
  WCAG AA contrast check of every token pair, Lighthouse 90+.
- **Phase 5, Deploy**: GitHub Pages from `main`, custom domain via CNAME (optional).

## Known gaps
Open TODOs: `meta.portfolio` URL, more projects
and their links, FormSubmit activation, OG image, favicon, sitemap, absolute canonical URL.
Note: the repo is `harshitha-yeduvaka.github.io` under user `harshithayeduvaka`. The names
differ, so GitHub Pages serves it as a project site at
`harshithayeduvaka.github.io/harshitha-yeduvaka.github.io/` unless the repo is renamed (Phase 5).
Headless-Chrome testing: the window can't go below 500px wide; test phones via an iframe of fixed width.
Headless Chrome doesn't advance GSAP's ticker here: screenshot with --force-prefers-reduced-motion
to see the composed final state.
