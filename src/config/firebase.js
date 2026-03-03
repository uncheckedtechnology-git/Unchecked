// src/config/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Credentials hardcoded to ensure standalone APKs don't crash from missing .env files
const firebaseConfig = {
  apiKey: "AIzaSyCs9GtKOLGk2DC027kHnI0bA0rU2QBWhBk",
  authDomain: "unchecked-66828.firebaseapp.com",
  projectId: "unchecked-66828",
  storageBucket: "unchecked-66828.firebasestorage.app",
  messagingSenderId: "927638946144",
  appId: "1:927638946144:web:c96509f066b3be06761e05",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Auth persistence for React Native
// Safe init: avoids "auth/already-initialized" crash on hot reloads & Expo Go
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  // Auth already initialized — reuse existing instance
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
