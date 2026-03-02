// src/config/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

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
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);
export { app };
