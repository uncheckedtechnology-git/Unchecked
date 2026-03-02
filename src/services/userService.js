// src/services/userService.js
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

import { getItem, setItem, LS_KEYS } from "./localStore";
import { makeDefaultIntents, pickDefaultPrompts } from "../data/defaults";

function uuid() {
  // good enough for MVP
  return "u_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function getUid() {
  const u = auth.currentUser;
  return u ? u.uid : null;
}
// 
export async function ensureGhostUid() {
  let uid = await getItem(LS_KEYS.UID);
  if (!uid) {
    uid = uuid();
    await setItem(LS_KEYS.UID, uid);
  }
  return uid;
}

export async function ensureUserDoc(uid, config) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const intents = makeDefaultIntents(config);
    const prompts = pickDefaultPrompts(config, config?.max_prompts || 3);

    const base = {
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      profileComplete: false,

      name: "",
      age: null,

      // preferences
      filters: {
        ageMin: 18,
        ageMax: 35,
        distanceKm: 10,
        distanceEnabled: false,
      },

      // core differentiators
      intents,
      otherText: "",
      okWith: [],
      selfConcerns: [],
      photos: [], // array of { uri, type: "local"|"remote" }
      prompts, // array of { q, a }

      // for future
      gender: null,
      lookingForGenders: [],

      // stats
      lastActiveAt: serverTimestamp(),
    };

    await setDoc(ref, base, { merge: true });
    return base;
  }

  return snap.data();
}

export async function updateUser(uid, patch) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}
