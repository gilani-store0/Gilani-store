// firebase.js - تهيئة Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBdoi5KxlVb6G31cue5SGbaw-VW2UGu4cs",
  authDomain: "qb-store.firebaseapp.com",
  projectId: "qb-store",
  storageBucket: "qb-store.firebasestorage.app",
  messagingSenderId: "81820788306",
  appId: "1:81820788306:web:54be52d359ad36c3e0e18b",
  measurementId: "G-4K0MDY0W5M"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };