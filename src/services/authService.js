import { auth, db } from "../config/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export async function signupEmail({ email, password, name, dobISO, gender, interestedIn }) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  const uid = cred.user.uid;

  const userRef = doc(db, "users", uid);

  // create user doc (DOB LOCKED by storing dobLocked=true)
  await setDoc(
    userRef,
    {
      uid,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      dobISO, // "YYYY-MM-DD"
      dobLocked: true,
      gender, // "man" | "woman" | "nonbinary" | "other"
      interestedIn, // "men" | "women" | "all"
      profileComplete: false, // onboarding pending
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return uid;
}

export async function loginEmail({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  return cred.user.uid;
}

export async function logout() {
  await signOut(auth);
}

export async function ensureAuthedUserDoc(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function signupEmailCredentialsOnly({ email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  const uid = cred.user.uid;

  // Create minimal doc; onboarding will fill the rest
  await setDoc(
    doc(db, "users", uid),
    {
      uid,
      email: email.trim().toLowerCase(),
      profileComplete: false,
      signupBasicsComplete: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return uid;
}

export async function emailExists(email) {
  return emailExistsInUsersCollection(email);
}

export async function emailExistsInUsersCollection(email) {
  const em = email.trim().toLowerCase();
  if (!em) return false;

  const q = query(collection(db, "users"), where("email", "==", em), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}
