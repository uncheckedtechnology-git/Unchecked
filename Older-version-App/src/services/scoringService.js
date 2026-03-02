// src/services/scoringService.js

function vecFromIntents(intents = {}) {
  return [
    intents.hookups || 0,
    intents.marriage || 0,
    intents.long_term || 0,
    intents.friendship || 0,
    intents.other || 0,
  ];
}

function cosineSimilarity(a, b) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function scoreIntentSimilarity(intentsA, intentsB) {
  const a = vecFromIntents(intentsA);
  const b = vecFromIntents(intentsB);
  return cosineSimilarity(a, b); // 0..1
}

export function scoreBubbleCompatibility(okWithA = [], selfB = []) {
  // If B has selfConcern items that A did NOT mark as ok-with, apply small penalty
  if (!selfB.length) return 1;
  const okSet = new Set(okWithA);
  let missing = 0;
  for (const s of selfB) {
    if (!okSet.has(s)) missing++;
  }
  const ratioMissing = missing / selfB.length; // 0..1
  return Math.max(0, 1 - ratioMissing * 0.6); // keep it gentle
}

export function finalMatchScore(userA, userB) {
  const intent = scoreIntentSimilarity(userA?.intents, userB?.intents);
  const bubbleAB = scoreBubbleCompatibility(userA?.okWith, userB?.selfConcerns);
  const bubbleBA = scoreBubbleCompatibility(userB?.okWith, userA?.selfConcerns);
  const bubble = (bubbleAB + bubbleBA) / 2;

  // Weighted
  return Math.round((0.7 * intent + 0.3 * bubble) * 100); // 0..100
}
