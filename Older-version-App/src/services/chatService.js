// src/services/chatService.js
import {
  collection,
  doc,
  addDoc,
  orderBy,
  limit,
  query,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
  setDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

export function listenMessages(matchId, pageSize, onData) {
  const col = collection(db, "chats", matchId, "messages");
  const q = query(col, orderBy("createdAt", "desc"), limit(pageSize));
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onData(msgs); // newest-first
  });
}

// Listen to match doc for read receipts / blocked / pinned changes
export function listenMatch(matchId, onData) {
  const ref = doc(db, "matches", matchId);
  return onSnapshot(ref, (snap) => {
    onData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

/**
 * Sends a message + updates match metadata for list UI:
 * - lastMessage, lastMessageAt, lastMessageFromUid
 * - unreadBy[otherUid]++
 * - unreadBy[fromUid]=0
 * - phase="chat" (helps you later remove from likes received after chat starts)
 */
export async function sendMessage(matchId, fromUid, text, otherUid) {
  const clean = (text || "").trim();
  if (!clean || !matchId || !fromUid) return;

  const msgCol = collection(db, "chats", matchId, "messages");
  await addDoc(msgCol, {
    fromUid,
    text: clean,
    createdAt: serverTimestamp(),
  });

  const matchRef = doc(db, "matches", matchId);

  const patch = {
    lastMessage: clean,
    lastMessageAt: serverTimestamp(),
    lastMessageFromUid: fromUid,
    updatedAt: serverTimestamp(),
    phase: "chat",
  };

  if (otherUid) patch[`unreadBy.${otherUid}`] = increment(1);
  patch[`unreadBy.${fromUid}`] = 0;
  patch[`lastReadAtBy.${fromUid}`] = serverTimestamp();

  try {
    await updateDoc(matchRef, patch);
  } catch {
    await setDoc(matchRef, patch, { merge: true });
  }
}

export async function markMatchRead(matchId, uid) {
  if (!matchId || !uid) return;

  const matchRef = doc(db, "matches", matchId);
  const patch = { updatedAt: serverTimestamp() };
  patch[`unreadBy.${uid}`] = 0;
  patch[`lastReadAtBy.${uid}`] = serverTimestamp();

  try {
    await updateDoc(matchRef, patch);
  } catch {
    await setDoc(matchRef, patch, { merge: true });
  }
}
