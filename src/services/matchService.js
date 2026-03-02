// src/services/matchService.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

// --- Likes Received (for Matches tab) ---
export async function getLikesReceived(myUid) {
  // users who liked me (right-swiped me) but not necessarily matched
  const likesRef = collection(db, "users", myUid, "likes_received");
  const snaps = await getDocs(query(likesRef, orderBy("createdAt", "desc"), limit(50)));
  const uids = snaps.docs.map((d) => d.id);

  // Fetch all user docs in parallel instead of one-by-one
  const userSnaps = await Promise.all(
    uids.map((uid) => getDoc(doc(db, "users", uid)))
  );

  return userSnaps
    .filter((u) => u.exists())
    .map((u) => u.data());
}

// --- Matches (chat list) ---
export async function getMyMatches(myUid) {
  const col = collection(db, "matches");
  const snaps = await getDocs(query(col, where("participants", "array-contains", myUid), limit(50)));
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// --- Swipe feed helpers ---
export async function loadSeenSet(myUid) {
  const likedRef = collection(db, "users", myUid, "likes_sent");
  const passRef = collection(db, "users", myUid, "passes");

  const [liked, passed] = await Promise.all([
    getDocs(query(likedRef, limit(500))),
    getDocs(query(passRef, limit(500))),
  ]);

  const seen = new Set();
  liked.forEach((d) => seen.add(d.id));
  passed.forEach((d) => seen.add(d.id));
  seen.add(myUid);
  return seen;
}

export async function fetchCandidates(myUid, { take = 40, filters = {} } = {}) {
  // fetch users, filter out seen
  const seen = await loadSeenSet(myUid);
  const snaps = await getDocs(query(collection(db, "users"), limit(200)));

  const users = [];
  snaps.forEach((d) => {
    const u = d.data();
    if (!u?.uid) return;
    if (seen.has(u.uid)) return;
    if (!u.profileComplete) return;

    // Apply age filter
    if (filters.ageMin || filters.ageMax) {
      const dob = u.dobISO || u.dob;
      if (dob) {
        const birthDate = new Date(typeof dob?.toDate === "function" ? dob.toDate() : dob);
        const now = new Date();
        let age = now.getFullYear() - birthDate.getFullYear();
        const m = now.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
        if (filters.ageMin && age < filters.ageMin) return;
        if (filters.ageMax && age > filters.ageMax) return;
      }
    }

    // Apply gender filter
    if (filters.genders && Array.isArray(filters.genders) && filters.genders.length > 0) {
      if (u.gender && !filters.genders.includes(u.gender)) return;
    }

    users.push(u);
  });

  return users.slice(0, take);
}

// --- Like/Pass actions + auto match ---
export async function passUser(myUid, otherUid) {
  await setDoc(doc(db, "users", myUid, "passes", otherUid), {
    createdAt: serverTimestamp(),
  });
}

export async function likeUser(myUid, otherUid, score = 0) {
  // record like I sent
  await setDoc(doc(db, "users", myUid, "likes_sent", otherUid), {
    createdAt: serverTimestamp(),
    score,
  });

  // record like they received (for Matches blur)
  await setDoc(doc(db, "users", otherUid, "likes_received", myUid), {
    createdAt: serverTimestamp(),
    score,
  });

  // check if they already liked me -> match
  const theyLikedMe = await getDoc(doc(db, "users", myUid, "likes_received", otherUid));
  if (theyLikedMe.exists()) {
    const matchId = [myUid, otherUid].sort().join("_");
    await setDoc(
      doc(db, "matches", matchId),
      {
        participants: [myUid, otherUid].sort(),
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        score,
      },
      { merge: true }
    );
  }
}

// --- Matching score (intents + bubble overlap) ---
export function computeMatchScore(me, other) {
  const a = me?.intents || {};
  const b = other?.intents || {};
  const keys = ["hookups", "marriage", "long_term", "friendship", "other"];
  // closer distribution -> higher
  let dist = 0;
  keys.forEach((k) => {
    dist += Math.abs((a[k] || 0) - (b[k] || 0));
  });
  const intentScore = Math.max(0, 100 - dist / 2); // 0..100 approx

  const ok = new Set(me?.okWith || []);
  const self = new Set(other?.selfConcerns || []);
  let overlap = 0;
  ok.forEach((x) => {
    if (self.has(x)) overlap += 1;
  });

  // higher overlap = more compatible (you accept what they worry about)
  const bubbleScore = Math.min(40, overlap * 8); // cap

  return Math.round(intentScore + bubbleScore); // ~0..140
}


// Pin / favourite (per-user)
export async function setMatchPinned(matchId, myUid, pinned) {
  if (!matchId || !myUid) return;

  const ref = doc(db, "matches", matchId);
  const patch = {};
  patch[`pinnedBy.${myUid}`] = !!pinned;
  patch[`pinnedAtBy.${myUid}`] = pinned ? serverTimestamp() : null;

  await setDoc(ref, patch, { merge: true });
}
