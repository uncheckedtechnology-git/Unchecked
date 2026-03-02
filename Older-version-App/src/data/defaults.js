// src/data/defaults.js

export const DEFAULT_CONFIG_DOC_PATH = "config/app";

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function asBubbleObjects(list, prefix) {
  if (!Array.isArray(list)) return [];
  return list
    .map((label, idx) => {
      const clean = String(label || "").trim();
      if (!clean) return null;
      return {
        id: `${prefix}:${slugify(clean) || idx}`,
        label: clean,
        // Optional fields for later personalization from Firebase:
        // emoji: "✨",
        // accent: "#...",
        // category: "..."
      };
    })
    .filter(Boolean);
}

export const DEFAULT_CONFIG = {
  // Admin + demo controls
  allow_demo_seed: true,

  // Feature flags
  enable_storage_uploads: false, // YOU chose default: no
  blur_likes_received: true,

  // Profile constraints
  max_photos: 6,
  max_prompts: 3,

  // Intent sliders (remote configurable)
  intent_options: [
    { key: "hookups", label: "Hookups", min: 0, max: 100, step: 1 },
    { key: "marriage", label: "Marriage", min: 0, max: 100, step: 1 },
    { key: "long_term", label: "Long-term relationship", min: 0, max: 100, step: 1 },
    { key: "friendship", label: "Friendship", min: 0, max: 100, step: 1 },
    { key: "other", label: "Other", min: 0, max: 100, step: 1, hasText: true, textMaxLen: 80 },
  ],

  // “Other” examples (remote configurable)
  other_examples: [
    "Someone to go hiking with",
    "Someone to go for movies",
    "Removing loneliness",
    "A travel buddy",
    "A gym partner",
    "A plus-one for events",
  ],

  // ✅ NEW: bubble sets (remote configurable) used by loadBubbleSet("okWith"/"selfConcerns")
  // You can add emoji/accent/category in Firebase later to make them feel personalized.
  bubbleSets: {
    okWith: asBubbleObjects(
      [
        "Short height",
        "Fair complexion/skin tone",
        "Bad communication skills",
        "Different family background",
        "Low income",
        "High income",
        "Introvert",
        "Extrovert",
        "Different religion",
        "Different politics",
        "Smoking",
        "Drinking",
        "Late replies",
        "Long distance",
        "Busy schedule",
        "No gym/fitness",
        "Gym/fitness focused",
        "Kids now",
        "Kids later",
        "No kids",
        "Career-first",
        "Family-first",
        "Living with parents",
        "Independent living",
      ],
      "ok"
    ),

    selfConcerns: asBubbleObjects(
      [
        "Overthinking",
        "Anxiety",
        "Insecure sometimes",
        "Jealous sometimes",
        "Attachment issues",
        "Avoidant vibe",
        "People pleaser",
        "Workaholic",
        "Mood swings",
        "Trust issues",
        "Low patience",
        "Fear of rejection",
        "Commitment anxiety",
        "Bad at expressing feelings",
        "Gets bored easily",
        "Needs reassurance",
        "Social battery low",
        "Too blunt sometimes",
        "Easily distracted",
        "Sensitive to criticism",
        "Wants control",
        "Overly independent",
        "Conflict avoider",
        "Gets attached fast",
      ],
      "sc"
    ),
  },

  // ✅ LEGACY (kept so nothing breaks if any old code still reads these)
  // Prefer bubbleSets.okWith / bubbleSets.selfConcerns going forward.
  ok_with_bubbles: [
    "Short height",
    "Fair complexion/skin tone",
    "Bad communication skills",
    "Different family background",
    "Low income",
    "High income",
    "Introvert",
    "Extrovert",
    "Different religion",
    "Different politics",
    "Smoking",
    "Drinking",
    "Late replies",
    "Long distance",
    "Busy schedule",
    "No gym/fitness",
    "Gym/fitness focused",
    "Kids now",
    "Kids later",
    "No kids",
    "Career-first",
    "Family-first",
    "Living with parents",
    "Independent living",
  ],

  self_concerns_bubbles: [
    "Overthinking",
    "Anxiety",
    "Insecure sometimes",
    "Jealous sometimes",
    "Attachment issues",
    "Avoidant vibe",
    "People pleaser",
    "Workaholic",
    "Mood swings",
    "Trust issues",
    "Low patience",
    "Fear of rejection",
    "Commitment anxiety",
    "Bad at expressing feelings",
    "Gets bored easily",
    "Needs reassurance",
    "Social battery low",
    "Too blunt sometimes",
    "Easily distracted",
    "Sensitive to criticism",
    "Wants control",
    "Overly independent",
    "Conflict avoider",
    "Gets attached fast",
  ],

  // Prompt questions (remote configurable)
  prompt_questions: [
    "A green flag I always notice is…",
    "A small thing that makes me happy is…",
    "My ideal weekend looks like…",
    "A trait I’m working on is…",
    "The quickest way to my heart is…",
    "A boundary I respect is…",
    "Something I’m genuinely proud of is…",
    "A weird talent I have is…",
    "My kind of first date is…",
    "If we vibe, we should…",
  ],

  // Gender options (for later use; remote configurable)
  genders: ["Man", "Woman", "Non-binary", "Prefer not to say"],
};

// Helper: build a blank profile intent object with defaults
export function makeDefaultIntents(config = DEFAULT_CONFIG) {
  const out = {};
  (config.intent_options || []).forEach((o) => {
    out[o.key] = 0;
  });
  return out;
}

// Helper: pick N default prompt questions
export function pickDefaultPrompts(config = DEFAULT_CONFIG, n = 3) {
  const qs = config.prompt_questions || [];
  return qs.slice(0, n).map((q) => ({ q, a: "" }));
}
