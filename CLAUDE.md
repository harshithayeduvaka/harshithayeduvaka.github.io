# Harshitha Yeduvaka — Portfolio

Personal portfolio for Harshitha Yeduvaka (MSc International Marketing & Business
Development, SKEMA Paris). Goal: land a **marketing internship in Paris, 2026**.
Audience: marketing hiring managers and recruiters (FR/EU), plus startup founders.

Concept: **"PARSE"**. The site reads like an ATS parser walking through her CV
(nods to her product, ohmyATS). Sections are numbered "passes".

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
scripts/content.js  ALL editable content (bio, metrics, jobs, projects, skills, links)
scripts/app.js      animation orchestration + section rendering + ohmyATS demo
scripts/webgl.js    token-field background + wireframe globe (Three.js)
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

## Design tokens ("Blueprint / Signal")
| Token          | Value     | Use                                   |
|----------------|-----------|---------------------------------------|
| `--ultramarine`| `#1B21D8` | primary ink, headings, links          |
| `--chalk`      | `#F1F2F6` | page background                       |
| `--graphite`   | `#141519` | body text, dark panels                |
| `--saffron`    | `#F0A202` | metrics, highlights, focus ring       |
| `--paper-blue` | `#C8CEE6` | rules, borders, muted text            |
| `--signal-red` | `#E2372B` | used sparingly: "rejected / missing"  |

Type: **Bricolage Grotesque** (display, variable wght/wdth), **Inter Tight** (body),
**Martian Mono** (labels, uppercase, 0.08em tracking). Fluid scale `--fs-11` → `--fs-hero`.
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
Open TODOs: `meta.portfolio` URL, About closing line (`about.paragraphs`), more projects
and their links, FormSubmit activation, OG image, favicon, sitemap, absolute canonical URL.
Note: the repo is `harshitha-yeduvaka.github.io` under user `harshithayeduvaka`. The names
differ, so GitHub Pages serves it as a project site at
`harshithayeduvaka.github.io/harshitha-yeduvaka.github.io/` unless the repo is renamed (Phase 5).
Headless-Chrome testing: the window can't go below 500px wide; test phones via an iframe of fixed width.
