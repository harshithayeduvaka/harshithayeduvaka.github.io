# Harshitha Yeduvaka — Portfolio

Personal portfolio for Harshitha Yeduvaka (MSc International Marketing & Business
Development, SKEMA Paris). Goal: land a **marketing internship in Paris, 2026**.
Audience: marketing hiring managers and recruiters (FR/EU), plus startup founders.

Concept: **a coffee-coded desk**. The first screen is a desk (ref: jackiehu.design):
an open notebook with her name, title and tagline written on it, plus headphones (music),
an instax camera (click = her photo slides out as a print), a pen and a record card.
Below it, the later sections ("passes": experience, ohmyATS demo, projects, skills,
geography) and contact. She asked for: no CV-copy intro, no object labels/numbers,
no Spotify, warm coffee palette, no em dashes (—) in visible copy, no skills section,
no "PASS" rail labels. Timeline tags: "Foundations" (education), "The Story So Far" (work).
Case studies open in an on-page deck viewer (<dialog>); real decks = `slides` image list
per project in content.js, otherwise slides are built from the project's text.

## Stack
- Plain HTML + CSS + ES modules. No build step, no framework.
- Vendored libraries in `vendor/` (no CDN): GSAP 3.13 + ScrollTrigger, Lenis 1.1.13, Three.js r170.
- Hosting: GitHub Pages from `main` (repo `harshithayeduvaka/harshitha-yeduvaka.github.io`).

## Run locally
```
cd ~/Desktop/harshitha-yeduvaka.github.io
python3 -m http.server 8000     # then open http://localhost:8000
```
A server is required: ES modules don't load from `file://`.

## Files
```
index.html          markup skeleton for every pass (sections are filled by JS)
styles/main.css     all styles; design tokens live in :root at the top
scripts/content.js  ALL editable content (desk objects, jobs, projects, skills, links)
scripts/app.js      animation orchestration + section rendering + ohmyATS demo
scripts/webgl.js    wireframe globe (Three.js); initField is unused legacy
scripts/sound.js    Web Audio synth: desk click sounds + original lo-fi loop (no audio files)
assets/             her photo (the instax print) and desk objects (assets/objects/; notebook
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
  Horizontal scroll and the physics pile fall back to stacked layouts on mobile.
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

Type: **Fraunces** (display, soft serif), **Inter Tight** (body), **Martian Mono**
(labels, uppercase, 0.08em tracking), **Allura** (handwriting on the notebook).
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
