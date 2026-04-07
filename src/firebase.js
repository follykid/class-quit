// client/src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBl_UHEIz-ycuKQHOkpc6TpFBaQArxEW8Y",
  authDomain: "quiz-battle-folly.firebaseapp.com）",
  databaseURL: "https://quiz-battle-folly-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quiz-battle-folly",
  storageBucket: "quiz-battle-folly.firebasestorage.app",
  messagingSenderId: "476075896523",
  appId: "1:476075896523:web:6aa11d7a4566056ba7354e",
};

const app = initializeApp(firebaseConfig);

export const fs = getFirestore(app);
export const rtdb = getDatabase(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);

if (import.meta.env.DEV && !globalThis.__EMU_CONNECTED__) {
  connectFirestoreEmulator(fs, "127.0.0.1", 18081);
  connectDatabaseEmulator(rtdb, "127.0.0.1", 19001);
   connectFunctionsEmulator(functions, "127.0.0.1", 15002); // ✅ 用你 emulator 顯示的 Functions port
  globalThis.__EMU_CONNECTED__ = true;
}