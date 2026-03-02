// src/services/profileCompletion.js

export function isIntentsValid(intents) {
  if (!intents) return false;
  const keys = ["hookups", "marriage", "long_term", "friendship", "other"];
  const sum = keys.reduce((s, k) => s + (Number(intents[k]) || 0), 0);
  return sum === 100;
}

export function computeProfileComplete(user) {
  if (!user) return false;

  // Signup required
  if (!user.name?.trim()) return false;
  if (!user.dobISO) return false;
  if (!user.gender) return false;
  if (!user.interestedIn) return false;

  // Onboarding required (B)
  if (!isIntentsValid(user.intents)) return false;

  // Must exist (can be empty)
  if (!Array.isArray(user.okWith)) return false;
  if (!Array.isArray(user.selfConcerns)) return false;

  return true;
}
