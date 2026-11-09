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
  available: "AVAILABLE FOR A MARKETING INTERNSHIP · PARIS · 2026",
};

// Metrics the parser extracts in Pass 02 (real numbers she moved).
export const metrics = [
  { value: "2+ yrs", label: "METRIC · EXPERIENCE" },
  { value: "65+", label: "METRIC · ENTERPRISE ACCOUNTS" },
  { value: "−15%", label: "METRIC · CLIENT CHURN" },
  { value: "−30%", label: "METRIC · ONBOARDING CYCLE" },
];

// Reverse chronology — a parser walking back through history.
export const experience = [
  {
    year: "2026",
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
    year: "2023",
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
    context: "Competitive strategy inside a live business simulation.",
    audited: "Competitive advantage via Porter's Five Forces across the simulated market.",
    found: "Under-exploited search demand and unclear cross-functional priorities.",
    recommended: "Actionable SEO/SEM keyword strategy tied to decision cadence.",
    impact: "Improved cross-functional decision-making efficiency 10%.",
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
