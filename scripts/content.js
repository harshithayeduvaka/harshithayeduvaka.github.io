// content.js — all CV content lives here as typed data.
// Harshitha can update the whole site by editing this one object.

export const meta = {
  name: "Harshitha Yeduvaka",
  first: "HARSHITHA",
  last: "YEDUVAKA",
  role: "Marketing · B2B Implementation · Paris",
  location: "Paris, France",
  coords: "48.8566° N · 2.3522° E",
  email: "yeduvakaharshitha@gmail.com",
  linkedin: "https://www.linkedin.com/in/harshithayeduvaka/",
  portfolio: "#", // TODO: real portfolio/repo URL
  resume: "resume.pdf",
  positioning:
    "B2B implementation professional with 2+ years managing onboarding for 65+ enterprise accounts. Cut client churn 15% and reduced onboarding cycles 30% through CRM optimisation and structured account management.",
  title: "Marketing & Growth", // written under her name on the notebook
  tagline: "Helping businesses turn marketing efforts into measurable growth.",
  // Contact form. FormSubmit forwards submissions to the email in the URL.
  // The FIRST submission sends an activation email to that inbox: click it once.
  formEndpoint: "https://formsubmit.co/ajax/yeduvakaharshitha@gmail.com",
};

// Her photo: shown on the desk as an instax print that comes out of the camera.
export const about = {
  photo: { src: "assets/harshitha.avif", w: 300, h: 400,
           alt: "Harshitha Yeduvaka smiling, standing on a tree-lined street in a yellow dress" },
  // The "About ⌘" section near the bottom of the page (her words).
  title: "About",
  paragraphs: [
    "I’m a marketing and business development professional based in Paris, and I do my best work when something doesn’t add up yet.",
    "It might be a campaign that should have worked and didn’t, or a market nobody has cracked. That’s where I get curious. I like taking the problem apart and asking the slightly annoying questions until it fits back together as something a team can act on. My favourite part is the moment everyone finally sees the problem clearly and knows what to do next.",
    "Good marketing starts with listening, to the data and to the people behind it. The data shows me what’s happening, and talking to people usually explains why. I enjoy this enough that I went back to study it properly. I’m currently doing a master’s in International Marketing & Business Development.",
    "When I’m not working, I’m either reading fiction or losing at chess online.",
  ],
};

// The desk = the first screen (layout ref: jackiehu.design).
// The open notebook is the centrepiece with her name written across both pages;
// the other objects sit around it. Order = stacking order (first is at the bottom).
// desk: starting spot on the desktop layout, in % of the desk (x, y, width) + tilt in degrees.
// chaos: where the object sits in "chaos mode" (same units). Switched with the icons under the desk.
// sound: shutter | click | page | music.
// note: optional line in your words, shown under the desk on click. Leave "" to show nothing.
export const kit = [
  // A stained-glass table lamp, a little behind the notebook (listed first so it sits under it).
  // Click: it lights up for 1 second with a switch click (assets/sounds/lamp.mp3 if present).
  { id: "lamp", label: "LAMP", name: "Table lamp", sound: "lamp",
    img: "assets/objects/lamp.avif", w: 418, h: 640, // cut out of her photo
    alt: "Stained-glass table lamp with blue and yellow flowers",
    desk: { x: 67, y: -2, w: 16, r: 0 },
    chaos: { x: 72, y: 2, w: 11, r: 0 },
    note: "" },
  { id: "notebook", label: "NOTEBOOK", name: "Plain notebook", sound: "page",
    img: "assets/objects/notebook.avif", w: 960, h: 694, // transparent cut-out (ruled MUJI notebook)
    alt: "Open cream notebook with a red ribbon bookmark",
    ink: { name: meta.name, lines: [meta.title, meta.tagline], // written on the pages
      // her own handwriting for the title and tagline (transparent PNGs, ink #3A2618).
      // Each entry = the lines of one block; the text above stays for screen readers / search.
      hand: [
        [{ src: "assets/hand-title.png", w: 1199, h: 222, tilt: -1 }],
        [{ src: "assets/hand-tagline-1.png", w: 1400, h: 145, tilt: 0.7 }, { src: "assets/hand-tagline-2.png", w: 845, h: 120, tilt: 0.7 }],
      ] },
    desk: { x: 19, y: 12, w: 58, r: -10 },
    chaos: { x: 3, y: 53, w: 38, r: 0 },   // chaos mode: pushed to the bottom-left corner
    note: "" },
  // Her photo as an instax print. Hidden until the camera is clicked; it slides out of
  // the camera and lands here (relative to wherever the camera is).
  { id: "print", label: "PHOTO", name: "instax print", sound: "",
    print: true, img: about.photo.src, w: about.photo.w, h: about.photo.h,
    alt: about.photo.alt,
    desk: { x: 23, y: 57, w: 11, r: -9 },
    chaos: { x: 61, y: 57, w: 10, r: 13 },
    note: "" },
  { id: "camera", label: "CAMERA", name: "instax mini Evo", sound: "shutter",
    img: "assets/objects/camera.avif", w: 361, h: 259, // transparent cut-out
    alt: "Brown and silver instant camera",
    desk: { x: 5, y: 67, w: 18, r: 8 },
    chaos: { x: 5, y: 5, w: 16, r: 0 },
    note: "" },
  { id: "headphones", label: "HEADPHONES", name: "Over-ears", sound: "music",
    img: "assets/objects/headphones.avif", w: 236, h: 320, // transparent cut-out
    alt: "Black over-ear wireless headphones",
    desk: { x: 6, y: 12, w: 10.5, r: -18 },
    chaos: { x: 26, y: 3, w: 9, r: 26 },
    note: "" },
  { id: "pen", label: "PEN", name: "Gel pen", sound: "click",
    img: "assets/objects/pen.avif", w: 46, h: 373, // transparent cut-out (clear plastic)
    alt: "Clear retractable gel pen with black ink",
    desk: { x: 67.1, y: 35.5, w: 2.2, r: 18 }, // on the right page, just past the tagline
    chaos: { x: 42.5, y: 61, w: 2.2, r: 0 },
    note: "" },
  // A little twin-bell alarm clock where the vinyl card used to sit. Click: a short ring + a shake.
  { id: "alarm", label: "ALARM", name: "Alarm clock", sound: "ring",
    img: "assets/objects/alarm.avif", w: 306, h: 420, // transparent cut-out
    alt: "Black twin-bell alarm clock",
    desk: { x: 84, y: 9, w: 10, r: 8 },
    chaos: { x: 86, y: 30, w: 9, r: 0 },
    note: "" },
  // A binder clip, smaller than the alarm. Click: a metal snap.
  { id: "clip", label: "CLIP", name: "Binder clip", sound: "snap",
    img: "assets/objects/clip.avif", w: 153, h: 192, // cut out of a white background
    alt: "Silver binder clip",
    desk: { x: 84, y: 36, w: 5.2, r: -14 },
    chaos: { x: 46.5, y: 63, w: 4, r: -12 },
    note: "" },
  // A cappuccino seen from above (latte art from assets/objects/crema.avif, cup drawn in CSS).
  // Click: a 2s slurp (assets/sounds/slurp.mp3 if present) + steam wisps. r = handle direction.
  { id: "cup", label: "CAPPUCCINO", name: "Cappuccino", sound: "slurp",
    cup: true, img: "assets/objects/crema.avif", w: 360, h: 360,
    alt: "A cappuccino with a rosetta in the foam",
    desk: { x: 77, y: 52, w: 16, r: -20 },
    chaos: { x: 76, y: 63, w: 15, r: -8 },
    note: "" },
];

// The "stack" folder below the notebook: click it and these pop out (all together).
// To add a tool: put its logo in assets/tools/ and add a line here.
// tile: "full" = the logo is already a coloured square (it fills the tile);
//       otherwise the logo sits on a small light tile (`bg` sets its colour).
export const tools = [
  { name: "HubSpot", icon: "assets/tools/hubspot.avif", tile: "full" },
  { name: "GA4", icon: "assets/tools/ga4.avif" },
  { name: "Power BI", icon: "assets/tools/powerbi.avif" },
  { name: "SQL", icon: "assets/tools/sql.avif" },
  { name: "Excel", icon: "assets/tools/excel.avif" },
  { name: "Apollo.io", icon: "assets/tools/apollo.avif", tile: "full" },
  { name: "Notion", icon: "assets/tools/notion.avif" },
  { name: "Asana", icon: "assets/tools/asana.avif", bg: "#F2F2F2" },
  { name: "Canva", icon: "assets/tools/canva.avif", tile: "full" },
  { name: "Brandwatch", icon: "assets/tools/brandwatch.avif" },
];

// Her Spotify playlist. Clicking the headphones pops it out as a "now playing" card
// (swipe the covers to change song); a small player stays fixed on the right of the page.
// Audio plays through Spotify's official embed (scripts/music.js): visitors logged in to
// Spotify hear full songs, others hear Spotify's 30-second previews.
// To change songs: edit the playlist on Spotify, then update this list (title, artist,
// track uri from Share > Copy Song Link, length in ms, cover from the song's page).
export const playlist = {
  name: "tracks i dont skip",
  url: "https://open.spotify.com/playlist/4aRTrJLBB0yLSa9K1L9DTw",
  tracks: [
    { title: "Écoute Chérie", artist: "Vendredi sur Mer", uri: "spotify:track:0qPRYrfn8GqotCTTd5YnhB", ms: 226373,
      cover: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02520ad86f1b1aee23e3597a83" },
    { title: "Kho Gaye Hum Kahan", artist: "Jasleen Royal, Prateek Kuhad", uri: "spotify:track:7nPCAO0Q9AHbM7PWyj9O98", ms: 213055,
      cover: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02563e078ad6506c79c9f3292a" },
    { title: "Les Champs-Elysées", artist: "Joe Dassin", uri: "spotify:track:4VWbPQUPvLes814r6T11Jz", ms: 157626,
      cover: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02159a5ce13b0c1657c87b96bc" },
    { title: "Inthandham", artist: "Vishal Chandrashekhar, S.P. Charan, Krishna Kanth", uri: "spotify:track:0gE8ZP2cTXpRDz53bTkpu6", ms: 218808,
      cover: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02c718a804cc2f93fd94f03788" },
    { title: "Apocalypse", artist: "Cigarettes After Sex", uri: "spotify:track:1oAwsWBovWRIp7qLMGPIet", ms: 290146,
      cover: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02dfed999f959177dfc4f33cdc" },
    { title: "Ditto", artist: "NewJeans", uri: "spotify:track:3r8RuvgbX9s7ammBn07D3W", ms: 185506,
      cover: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02edf5b257be1d6593e81bb45f" },
  ],
};

// Order shown on the site: education first, then work experience (newest first).
// type: "work" | "education" (education panels get their own label).
export const experience = [
  {
    year: "2024",
    dates: "2024 – 2027",
    type: "education",
    org: "SKEMA Business School",
    role: "MSc International Marketing & Business Development",
    city: "Paris",
    accent: "ultramarine",
    vocab: ["Brand Strategy", "GTM", "Market Research", "ROI"],
    bullets: [],
  },
  {
    year: "2026",
    dates: "Mar 2026 – Present",
    type: "work",
    org: "ohmyATS",
    link: "https://ohmyats.lovable.app/", // the org name links here (opens in a new tab)
    role: "Founder & Developer",
    city: "Paris",
    accent: "signal-red",
    vocab: ["ATS", "scoring", "EN·FR·DE", "100+ profiles", "frontend"],
    bullets: [
      "Built a CV-screening tool from scratch, solo. It scores graduate CVs against ATS filters in English, French and German, tuned on 100+ real profiles.",
    ],
  },
  {
    year: "2025",
    dates: "Aug 2025 – Jan 2026",
    type: "work",
    org: "NOMAD X COLLECTIVE",
    role: "Marketing Intern",
    city: "Berlin",
    accent: "saffron",
    vocab: ["A/B", "+15% open", "+12% follows", "+17% eng", "Meta Ads", "ROI"],
    bullets: [
      "Lifted email open rates 15% by testing. A/B tested sequences to find the message that drove sign-ups. Grew followers 12% and engagement 17%, and ran Meta Ads.",
    ],
  },
  {
    year: "2023",
    dates: "Jan 2023 – Jul 2024",
    type: "work",
    org: "Keka HR Technologies",
    role: "Implementation Consultant",
    city: "Hyderabad",
    accent: "ultramarine",
    vocab: ["65+ accounts", "Zivame", "Future Group", "churn −15%", "CLV", "lead scoring"],
    bullets: [
      "Cut client churn 15% in one quarter. That was across 25+ SME accounts. Also onboarded 65+ enterprise clients, including Zivame and Future Group, and trained them to run the platform themselves.",
    ],
  },
];

// Case studies. Clicking one opens its deck in a viewer on the same page.
// To show your REAL deck instead of the auto-built one:
//   1. Export the deck as images (Canva/PowerPoint/Keynote/Google Slides: File → Download → PNG or JPG).
//   2. Put them in assets/decks/<id>/ (e.g. assets/decks/coop/01.jpg, 02.jpg, ...).
//   3. Add to the project:  slides: ["assets/decks/coop/01.jpg", "assets/decks/coop/02.jpg"],
// Without `slides`, the deck is built from context / audited / found / recommended / impact.
// To add a new case study, copy one { ... } block and change the text.
export const projects = [
  {
    id: "comintelli",
    // the real deck (PDF exported to images, assets/decks/comintelli/01..24.jpg)
    slides: Array.from({ length: 24 }, (_, i) => `assets/decks/comintelli/${String(i + 1).padStart(2, "0")}.jpg`),
    client: "Comintelli",
    kind: "International Business Development Strategy",
    when: "", // no date shown
    score: "12 mo",
    scoreLabel: "US ENTRY ROADMAP",
    context: "Swedish competitive-intelligence SaaS: SEK 30m ARR, flat for a year, with half its customers in North America and every decision made in Kista.",
    audited: "Value chain, Porter's Diamond, CAGE distance, decision rights and the Sweden–US culture gap.",
    found: "A method rivals can't copy, run entirely from one office: nobody in America can approve a price or sign a partner, and missing SOC 2 / ISO 27001 stalls US deals.",
    recommended: "Keep the method in Kista, let certified partners sell and serve, and give a Head of the Americas written decision rights.",
    impact: "A 12-month plan with month-12 KPIs: 2–3 certified US partners, certification readiness, and under 30% of decisions sent back to Kista.",
  },
  {
    id: "dior",
    // the real deck (PDF exported to images, assets/decks/dior/01..16.jpg)
    slides: Array.from({ length: 16 }, (_, i) => `assets/decks/dior/${String(i + 1).padStart(2, "0")}.jpg`),
    client: "Dior",
    kind: "Omnichannel Analysis",
    when: "", // no date shown
    score: "15%",
    scoreLabel: "PROJECTED B2C LIFT",
    context: "SKEMA capstone auditing Dior's retail, e-commerce and mobile ecosystems.",
    audited: "Cross-platform personalisation across three channels and the CRM layer underneath.",
    found: "3 critical gaps in CRM segmentation limiting cross-platform personalisation.",
    recommended: "A digital optimisation roadmap, presented to a faculty panel.",
    impact: "Projected to lift B2C engagement 15% (projection, not measured).",
  },
  {
    id: "coop",
    client: "Coop Atlantique",
    kind: "Business Simulation",
    when: "", // no date shown
    score: "10%",
    scoreLabel: "DECISION-MAKING EFFICIENCY",
    context: "Four-person consultancy report on Coop Atlantique, a cooperative retailer with 185 stores across western France, for SKEMA's business simulation.",
    mine: "Resources & capabilities, the VRIN analysis, and the verdict on whether Coop Atlantique has a competitive advantage.",
    audited: "Porter's Five Forces (rivalry 2.875/3 and buyer power 2/3, both high), VRIN, and ROS/ROA/asset turnover against Carrefour, Auchan, Casino and Aldi.",
    found: "A real but narrow advantage: the cooperative model and local, ethical sourcing are rare and hard to copy, but only for a niche segment. ROA sat at 0% in 2023 and revenue stalled around €1.04B.",
    recommended: "Refocus on related diversification: an organic/local private label, click-and-collect and e-commerce, niche formats (zero-waste stores, a discount banner), and an SEO/SEM keyword strategy.",
    impact: "Improved cross-functional decision-making efficiency 10%.",
    // the real deck (PDF exported to images, assets/decks/coop/01..19.jpg)
    slides: Array.from({ length: 19 }, (_, i) => `assets/decks/coop/${String(i + 1).padStart(2, "0")}.jpg`),
  },
  {
    id: "maya",
    // the real deck (PDF exported to images, assets/decks/maya/01..10.jpg)
    slides: Array.from({ length: 10 }, (_, i) => `assets/decks/maya/${String(i + 1).padStart(2, "0")}.jpg`),
    client: "Eco-Packaging",
    kind: "Strategic Branding",
    when: "", // no date shown
    score: "GTM",
    scoreLabel: "GO-TO-MARKET STRATEGY",
    context: "Brand strategy for sustainable packaging using the MAYA principle.",
    audited: "Comparative analysis of sustainable-packaging positioning and accessibility.",
    found: "A tension between novelty and familiarity blocking mainstream adoption.",
    recommended: "MAYA-optimised brand strategy balancing advanced design with market familiarity.",
    impact: "Sharpened GTM execution and market accessibility.",
  },
];


