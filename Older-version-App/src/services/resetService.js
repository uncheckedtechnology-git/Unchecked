// src/services/resetService.js
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";

async function deleteAllDocsInSubcollection(pathParts) {
  // pathParts: ["users", uid, "likes_sent"]
  let deleted = 0;

  while (true) {
    const colRef = collection(db, ...pathParts);
    const q = query(colRef, limit(450));
    const snap = await getDocs(q);
    if (snap.empty) break;

    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(doc(db, ...pathParts, d.id)));
    await batch.commit();

    deleted += snap.size;
  }

  return deleted;
}

/**
 * Dev reset for CURRENT data model:
 * - clears users/{uid}/likes_sent
 * - clears users/{uid}/passes
 * - (optional) clears users/{uid}/likes_received (only if you want)
 * - resets cached counters on users/{uid}
 */
export async function resetMySwipes(uid, { alsoClearReceived = false } = {}) {
  if (!uid) throw new Error("Missing uid");

  const a = await deleteAllDocsInSubcollection(["users", uid, "likes_sent"]);
  const b = await deleteAllDocsInSubcollection(["users", uid, "passes"]);

  let c = 0;
  if (alsoClearReceived) {
    c = await deleteAllDocsInSubcollection(["users", uid, "likes_received"]);
  }

  // reset local counters (safe for testing)
  const batch = writeBatch(db);
  batch.set(
    doc(db, "users", uid),
    {
      swipedRightCount: 0,
      swipedLeftCount: 0,
      likesReceivedCount: 0,
      passesReceivedCount: 0,
    },
    { merge: true }
  );
  await batch.commit();

  return { likesSentDeleted: a, passesDeleted: b, likesReceivedDeleted: c };
}
