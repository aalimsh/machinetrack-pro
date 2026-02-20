// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuu8TK3cMtJ13AgfbZn_iKQXPT0Mi51jk",
  authDomain: "machine-tracking-7164f.firebaseapp.com",
  databaseURL: "https://machine-tracking-7164f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "machine-tracking-7164f",
  storageBucket: "machine-tracking-7164f.firebasestorage.app",
  messagingSenderId: "863506027884",
  appId: "1:863506027884:web:08d89dea43d51174ddcf49",
  measurementId: "G-PEVESDBWGB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
