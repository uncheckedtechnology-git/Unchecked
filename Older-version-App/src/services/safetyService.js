// src/services/safetyService.js
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

export async function blockMatch(matchId, myUid, otherUid) {
  if (!matchId || !myUid) return;

  const ref = doc(db, "matches", matchId);

  const patch = {
    updatedAt: serverTimestamp(),
  };
  patch[`blockedBy.${myUid}`] = true;
  patch[`blockedAtBy.${myUid}`] = serverTimestamp();
  patch[`blockedOtherUidBy.${myUid}`] = otherUid || null;

  await setDoc(ref, patch, { merge: true });

  // optional audit log (safe MVP)
  await addDoc(collection(db, "blocks"), {
    matchId,
    blockerUid: myUid,
    blockedUid: otherUid || null,
    createdAt: serverTimestamp(),
  });
}

export async function reportUser({ matchId, reporterUid, reportedUid, reason }) {
  if (!reporterUid || !reportedUid) return;

  await addDoc(collection(db, "reports"), {
    matchId: matchId || null,
    reporterUid,
    reportedUid,
    reason: reason || "other",
    createdAt: serverTimestamp(),
  });
}
