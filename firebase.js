// ============================================
// 🔥 FIREBASE CONFIGURATION
// ============================================
// Neeche diye gaye values ko apne Firebase project
// ke values se replace karein.
// Guide mein step-by-step bataya hai kaise milega.
// ============================================

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, remove, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDuu8TK3cMtJ13AgfbZn_iKQXPT0Mi51jk",
  authDomain: "machine-tracking-7164f.firebaseapp.com",
  databaseURL: "https://machine-tracking-7164f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "machine-tracking-7164f",
  storageBucket: "machine-tracking-7164f.firebasestorage.app",
  messagingSenderId: "863506027884",
  appId: "1:863506027884:web:08d89dea43d51174ddcf49"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, remove, onValue };
