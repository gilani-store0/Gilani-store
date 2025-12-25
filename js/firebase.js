// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdoi5KxlVb6G31cue5SGbaw-VW2UGu4cs",
  authDomain: "qb-store.firebaseapp.com",
  projectId: "qb-store",
  storageBucket: "qb-store.firebasestorage.app",
  messagingSenderId: "81820788306",
  appId: "1:81820788306:web:54be52d359ad36c3e0e18b",
  measurementId: "G-4K0MDY0W5M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);