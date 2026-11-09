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
  phone: "+33 745577349",
  linkedin: "https://www.linkedin.com/in/harshithayeduvaka/",
  portfolio: "#", // TODO: real portfolio/repo URL
  resume: "resume.pdf",
  positioning:
    "B2B implementation professional with 2+ years managing onboarding for 65+ enterprise accounts. Cut client churn 15% and reduced onboarding cycles 30% through CRM optimisation and structured account management.",
  tagline: "B2B implementation that turns onboarding into retention.",
  available: "AVAILABLE FOR A MARKETING INTERNSHIP · PARIS · 2026",
  // Contact form. FormSubmit forwards submissions to the email in the URL.
  // The FIRST submission sends an activation email to that inbox: click it once.
  formEndpoint: "https://formsubmit.co/ajax/yeduvakaharshitha@gmail.com",
};

// About (PASS 02). Every fact here comes from the CV. Rewrite in your own voice.
export const about = {
  photo: { src: "assets/harshitha-480.jpg", src2x: "assets/harshitha-960.jpg", w: 480, h: 640,
           alt: "Harshitha Yeduvaka smiling, standing on a tree-lined street in a yellow dress" },
  paragraphs: [
    "I started in B2B implementation at Keka HR in Hyderabad, onboarding 65+ enterprise accounts and learning what makes a client stay.",
    "In Berlin, at NOMAD X COLLECTIVE, I moved into growth marketing: A/B-tested email sequences, Meta Ads and campaign attribution.",
    "Now I'm in Paris, doing an MSc in International Marketing & Business Development at SKEMA and building ohmyATS, a tool that helps graduates get their CVs past ATS screening.",
    "[TODO: one line in your own words: the kind of marketing team you want to join, and why]",
  ],
};

// "Off the CV" desk under the About bio (layout ref: jackiehu.design).
// The open notebook is the centrepiece with her name written across both pages;
// the other objects sit around it. Order = stacking order (first is at the bottom).
// desk: starting spot on the desktop layout, in % of the desk (x, y, width) + tilt in degrees.
// sound: shutter | click | page | music.  note: your words, shown on click.
export const kit = [
  { id: "notebook", label: "NOTEBOOK", name: "Plain notebook", sound: "page",
    img: "assets/objects/notebook.png", w: 960, h: 709, // transparent cut-out
    alt: "Open cream notebook with a red ribbon bookmark",
    ink: { name: meta.name, lines: [meta.role, meta.tagline] }, // written on the pages
    desk: { x: 14, y: 9, w: 58, r: -11 },
    note: "[TODO: what goes in this notebook]" },
  { id: "camera", label: "CAMERA", name: "instax mini Evo", sound: "shutter",
    img: "assets/objects/camera.jpg", w: 361, h: 350,
    alt: "Brown and silver instant camera",
    desk: { x: 2, y: 64, w: 19, r: 8 },
    note: "[TODO: why this camera / what you shoot]" },
  { id: "headphones", label: "HEADPHONES", name: "Over-ears", sound: "music",
    img: "assets/objects/headphones.jpg", w: 560, h: 560,
    alt: "Black over-ear wireless headphones",
    desk: { x: 1, y: 3, w: 18, r: -18 },
    note: "[TODO: one line on why you love this song]" },
  { id: "pen", label: "PEN", name: "Gel pen", sound: "click",
    img: "assets/objects/pen.jpg", w: 447, h: 447,
    alt: "Clear retractable gel pen with black ink",
    desk: { x: 54, y: 30, w: 17, r: 18 }, // lies across the notebook's right edge
    note: "[TODO: what you write by hand]" },
];

// The record card next to the headphones.
// link = a Spotify TRACK link (Spotify app → ⋯ → Share → Copy Song Link), e.g.
//   "https://open.spotify.com/track/XXXXXXXXXXXXXXXXXXXXXX"
// With a Spotify link, the headphones open the official Spotify player on the card
// (30-second preview for visitors not logged in to Spotify, full song if they are).
// Until then, they play an original placeholder loop generated in scripts/sound.js.
export const music = {
  title: "Coffee & Chill",
  artist: "Cloudchord",
  link: "https://open.spotify.com/track/2C7VA1VMLDgeNjr4i3h0V1",
};

// Metrics the parser extracts in Pass 02 (real numbers she moved).
export const metrics = [
  { value: "2+ yrs", label: "METRIC · EXPERIENCE" },
  { value: "65+", label: "METRIC · ENTERPRISE ACCOUNTS" },
  { value: "−15%", label: "METRIC · CLIENT CHURN" },
  { value: "−30%", label: "METRIC · ONBOARDING CYCLE" },
];

// Reverse chronology — a parser walking back through history.
// type: "work" | "education" (education panels get their own label).
export const experience = [
  {
    year: "2026",
    dates: "Mar 2026 – Present",
    type: "work",
    org: "ohmyATS",
    role: "Founder & Developer",
    city: "Paris",
    accent: "signal-red",
    vocab: ["ATS", "scoring", "EN·FR·DE", "100+ profiles", "frontend"],
    bullets: [
      "Building a solo full-stack tool that helps graduates optimise CVs to pass ATS screening and reach interviews.",
      "Trained the scoring engine on 100+ real profiles (strong and weak) to improve match accuracy.",
      "Supports 3 languages (EN·FR·DE); expanding to Dutch, Spanish, Italian.",
      "Built the frontend UI, ship bug fixes, and iterate on result quality continuously.",
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
      "Designed & ran A/B tests on email sequences — open rates +15%, isolating the messaging that drove replies and sign-ups.",
      "Grew follower base +12% and engagement +17% through integrated growth-marketing initiatives.",
      "Scaled paid social (Meta Ads) and analysed campaign performance for attribution and ROI.",
    ],
  },
  {
    year: "2024",
    dates: "2024 – 2027",
    type: "education",
    org: "SKEMA Business School",
    role: "MSc International Marketing & Business Development",
    city: "Paris",
    accent: "ultramarine",
    vocab: ["Brand Strategy", "GTM", "Market Research", "ROI"],
    bullets: [
      "Relevant coursework: Brand Strategy, Design-Led Marketing, GTM Strategy, Market Research, ROI Analysis.",
      "Consulting projects for Dior, Coop Atlantique and an eco-packaging brand (see Case studies below).",
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
      "Ran end-to-end B2B onboarding for 65+ enterprise accounts (incl. Zivame, Future Group), training clients to self-configure their workflows.",
      "Cut client churn 15% in one quarter across 25+ SME accounts via pipeline management, lead-scoring refinement, and CLV optimisation.",
    ],
  },
];

// Case studies render as parser output rows that resolve into full studies.
export const projects = [
  {
    id: "dior",
    client: "Dior",
    kind: "Omnichannel Marketing Analyst",
    when: "Sep–Dec 2024",
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
    client: "COOP ATLANTIQUE",
    kind: "Strategy Consultant · Business Simulation",
    when: "Sep–Dec 2024",
    score: "10%",
    scoreLabel: "DECISION-MAKING EFFICIENCY",
    context: "Four-person consultancy report on Coop Atlantique, a cooperative retailer with 185 stores across western France, for SKEMA's business simulation.",
    mine: "Resources & capabilities, the VRIN analysis, and the verdict on whether Coop Atlantique has a competitive advantage.",
    audited: "Porter's Five Forces (rivalry 2.875/3 and buyer power 2/3, both high), VRIN, and ROS/ROA/asset turnover against Carrefour, Auchan, Casino and Aldi.",
    found: "A real but narrow advantage: the cooperative model and local, ethical sourcing are rare and hard to copy, but only for a niche segment. ROA sat at 0% in 2023 and revenue stalled around €1.04B.",
    recommended: "Refocus on related diversification: an organic/local private label, click-and-collect and e-commerce, niche formats (zero-waste stores, a discount banner), and an SEO/SEM keyword strategy.",
    impact: "Improved cross-functional decision-making efficiency 10%.",
    // link: "", linkLabel: "View deck",  // optional: add a URL to show a link
  },
  {
    id: "maya",
    client: "Eco-Packaging",
    kind: "Strategic Branding · The MAYA Principle",
    when: "Jan–Apr 2025",
    score: "GTM",
    scoreLabel: "GO-TO-MARKET STRATEGY",
    context: "Brand strategy for sustainable packaging using the MAYA principle.",
    audited: "Comparative analysis of sustainable-packaging positioning and accessibility.",
    found: "A tension between novelty and familiarity blocking mainstream adoption.",
    recommended: "MAYA-optimised brand strategy balancing advanced design with market familiarity.",
    impact: "Sharpened GTM execution and market accessibility.",
  },
];

export const skills = {
  "CAMPAIGN & ATTRIBUTION": ["GA4", "SQL", "Meta Ads", "LinkedIn Ads", "ROI Analysis"],
  "BRAND & STRATEGY": ["Content Drafting", "Brand-Fit", "Positioning", "SEO/SEM", "GTM"],
  "TESTING & VERIFICATION": ["A/B Testing", "Hypothesis→Evidence", "CRM Audit", "Segmentation", "Lead Scoring"],
  TOOLS: ["HubSpot", "Notion", "Asana", "Zapier", "Excel", "Canva", "Generative AI"],
};

export const languages = [
  { name: "English", level: "C2", pct: 100 },
  { name: "Telugu", level: "C2 · Native", pct: 100 },
  { name: "Hindi", level: "C2 · Native", pct: 100 },
  { name: "French", level: "B2", pct: 70 },
];

// Hyderabad → Berlin → Paris. Content, not trivia.
export const geography = [
  { city: "Hyderabad", lat: 17.385, lon: 78.4867, year: "2023", role: "Keka HR" },
  { city: "Berlin", lat: 52.52, lon: 13.405, year: "2025", role: "NOMAD X" },
  { city: "Paris", lat: 48.8566, lon: 2.3522, year: "2026", role: "SKEMA · ohmyATS" },
];

// Real words the token stream carries.
export const corpus = [
  "churn −15%", "65+ accounts", "Meta Ads", "CLV", "onboarding", "MAYA",
  "Zivame", "attribution", "GTM", "A/B", "lead scoring", "ROI", "HubSpot",
  "segmentation", "SEO/SEM", "+17%", "cohort", "Dior", "Porter", "GA4",
  "pipeline", "+15% open", "engagement", "brand-fit", "ATS", "SQL",
  "Future Group", "positioning", "CRM audit", "+12%", "conversion",
];
