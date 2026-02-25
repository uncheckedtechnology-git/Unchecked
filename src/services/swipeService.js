// src/services/swipeService.js
import { doc, serverTimestamp, setDoc, increment, writeBatch } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Source of truth: swipes/{fromUid_toUid}
 * Also updates derived counters on users docs (cheap + reversible).
 */
export async function recordSwipe({ fromUid, toUid, decision }) {
  if (!fromUid || !toUid) return;
  if (decision !== "like" && decision !== "pass") return;

  const swipeId = `${fromUid}_${toUid}`;
  const swipeRef = doc(db, "swipes", swipeId);

  const fromRef = doc(db, "users", fromUid);
  const toRef = doc(db, "users", toUid);

  const batch = writeBatch(db);

  batch.set(
    swipeRef,
    {
      fromUid,
      toUid,
      decision,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  // My actions
  if (decision === "like") {
    batch.set(fromRef, { swipedRightCount: increment(1), updatedAt: serverTimestamp() }, { merge: true });
    batch.set(toRef, { likesReceivedCount: increment(1), updatedAt: serverTimestamp() }, { merge: true });
  } else {
    batch.set(fromRef, { swipedLeftCount: increment(1), updatedAt: serverTimestamp() }, { merge: true });
    batch.set(toRef, { passesReceivedCount: increment(1), updatedAt: serverTimestamp() }, { merge: true });
  }

  await batch.commit();
}
