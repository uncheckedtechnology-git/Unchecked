// src/services/configService.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { DEFAULT_CONFIG, DEFAULT_CONFIG_DOC_PATH } from "../data/defaults";
import { getJSON, setJSON, LS_KEYS } from "./localStore";

function mergeDeep(base, incoming) {
  // MVP: shallow merge is fine (arrays overwrite).
  // Keep it predictable for config edits.
  return { ...base, ...(incoming || {}) };
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Normalize bubbles so your UI never crashes:
 * - ensures { id, label } exist
 * - keeps optional { emoji, accent, category }
 */
function normalizeBubbleSet(list) {
  return safeArray(list)
    .map((b, idx) => {
      if (!b) return null;

      // allow string shorthand: "Open to long distance"
      if (typeof b === "string") {
        const id = `b:${slugify(b) || idx}`;
        return { id, label: b };
      }

      const label = String(b.label || "").trim();
      const id =
        String(b.id || "").trim() ||
        `b:${slugify(label) || idx}`;

      if (!label) return null;

      return {
        id,
        label,
        emoji: b.emoji ? String(b.emoji) : undefined,
        accent: b.accent ? String(b.accent) : undefined,
        category: b.category ? String(b.category) : undefined,
      };
    })
    .filter(Boolean);
}

/**
 * Where we store bubble sets in config:
 * config.bubbleSets.okWith: BubbleOption[]
 * config.bubbleSets.selfConcerns: BubbleOption[]
 */
function getBubbleSetsFromConfig(cfg) {
  // allow either "bubbleSets" or legacy "bubbles" if you ever named it differently
  const sets = cfg?.bubbleSets || cfg?.bubbles || {};
  return sets && typeof sets === "object" ? sets : {};
}

export async function loadConfig() {
  // 1) cached (fast)
  const cached = await getJSON(LS_KEYS.CONFIG_CACHE);

  // 2) remote refresh
  try {
    const ref = doc(db, DEFAULT_CONFIG_DOC_PATH);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, DEFAULT_CONFIG, { merge: true });
      await setJSON(LS_KEYS.CONFIG_CACHE, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }

    const remote = snap.data();
    const merged = mergeDeep(DEFAULT_CONFIG, remote);
    await setJSON(LS_KEYS.CONFIG_CACHE, merged);
    return merged;
  } catch (e) {
    // fallback to cache, then defaults
    if (cached) return mergeDeep(DEFAULT_CONFIG, cached);
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(partial) {
  const ref = doc(db, DEFAULT_CONFIG_DOC_PATH);
  await setDoc(ref, partial, { merge: true });

  const current = (await getJSON(LS_KEYS.CONFIG_CACHE)) || DEFAULT_CONFIG;
  const merged = mergeDeep(current, partial);
  await setJSON(LS_KEYS.CONFIG_CACHE, merged);
  return merged;
}

/**
 * ✅ Used by OkWith + SelfConcerns:
 * - kind: "okWith" | "selfConcerns" | any future set name
 * Returns normalized BubbleOption[]
 */
export async function loadBubbleSet(kind) {
  const cfg = await loadConfig();
  const sets = getBubbleSetsFromConfig(cfg);
  const raw = sets?.[kind];
  return normalizeBubbleSet(raw);
}

/**
 * Optional helper if you later build an Admin editor UI:
 * saves one bubble set back into config doc (merge)
 */
export async function saveBubbleSet(kind, bubbles) {
  const normalized = normalizeBubbleSet(bubbles);
  return saveConfig({
    bubbleSets: {
      [kind]: normalized,
    },
  });
}
