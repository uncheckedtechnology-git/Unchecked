// src/services/adminService.js
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const CONFIG_DOC = doc(db, "app_config", "public");
const ADMIN_DOC = doc(db, "app_config", "admin");

// VERY simple MVP gate: store pin in Firestore app_config/admin { pin: "1234" }
export async function getAdminPin() {
  const snap = await getDoc(ADMIN_DOC);
  if (!snap.exists()) return null;
  return snap.data()?.pin || null;
}

export async function ensureAdminDoc() {
  const snap = await getDoc(ADMIN_DOC);
  if (snap.exists()) return;
  // ⚠️ Change this PIN in Firebase Console after first run!
  await setDoc(ADMIN_DOC, { pin: "8491" }, { merge: true });
}

export async function loadPublicConfigRaw() {
  const snap = await getDoc(CONFIG_DOC);
  return snap.exists() ? snap.data() : null;
}

export async function savePublicConfigPatch(patch) {
  await updateDoc(CONFIG_DOC, patch);
}
