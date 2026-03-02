// src/services/profileCompletion.js

export function isIntentsValid(intents) {
  // Keeping this for backwards compatibility if needed elsewhere
  if (!intents) return false;
  const keys = ["hookups", "marriage", "long_term", "friendship", "other"];
  const sum = keys.reduce((s, k) => s + (Number(intents[k]) || 0), 0);
  return sum === 100;
}

export function computeProfileComplete(user) {
  if (!user) return false;

  // New V2 Onboarding requirements
  if (!user.name?.trim()) return false;
  if (!user.dobISO) return false;
  if (!user.gender) return false;
  if (!user.interestedIn) return false;

  // We removed the intent sliders and bubbles blocks from V2 onboarding.
  // We no longer require them to consider the profile 'complete'.

  return true;
}
