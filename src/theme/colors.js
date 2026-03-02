// Shared Brand & Semantic Colors
const brandPrimary = "#E8356D";       // rose-pink
const brandPrimary2 = "#C0165A";      // deep crimson
const primaryGrad = ["#E8356D", "#C0165A"];

const success = "#00C896";
const warn = "#FFB347";
const danger = "#FF4060";

export const lightColors = {
  // ── Backgrounds ──────────────────────────────────────────
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  card2: "#F3F4F6", // light grey for inputs

  // ── Text ─────────────────────────────────────────────────
  text: "#111827",
  text2: "#6B7280",
  muted: "#9CA3AF",

  // ── Borders / Overlays ────────────────────────────────────
  border: "rgba(17,24,39,0.12)",
  glowBorder: "rgba(232,53,109,0.25)", // subtle pink glow
  overlay: "rgba(17,24,39,0.40)",

  // ── Brand / Primary ───────────────────────────────────────
  primary: brandPrimary,
  primary2: brandPrimary2,
  primaryGrad,

  // ── Semantic ──────────────────────────────────────────────
  success,
  warn,
  danger,
};

export const darkColors = {
  // ── Backgrounds ──────────────────────────────────────────
  bg: "#0D0D14",          // deep charcoal
  surface: "#14141F",     // slightly raised surface
  card: "rgba(255,255,255,0.06)",   // glass card face
  card2: "rgba(255,255,255,0.04)",  // deeper glass (inputs)

  // ── Text ─────────────────────────────────────────────────
  text: "#F2F2F7",          // near-white primary text
  text2: "#8E8EA8",         // muted secondary text
  muted: "#4A4A6A",         // placeholder / very muted

  // ── Borders / Overlays ────────────────────────────────────
  border: "rgba(255,255,255,0.10)",
  glowBorder: "rgba(232,53,109,0.40)",  // pink glow border
  overlay: "rgba(0,0,0,0.55)",

  // ── Brand / Primary ───────────────────────────────────────
  primary: brandPrimary,
  primary2: brandPrimary2,
  primaryGrad,

  // ── Semantic ──────────────────────────────────────────────
  success,
  warn,
  danger,
};

// Fallback for un-refactored files
export const colors = darkColors;
