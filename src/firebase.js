import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBBKASTzbfv6RLJzctEuNPP3jVA0-KLw",
  authDomain: "folly-bc053.firebaseapp.com",
  projectId: "folly-bc053",
  storageBucket: "folly-bc053.firebasestorage.app",
  messagingSenderId: "265320644026",
  appId: "1:265320644026:web:5e27980897f2bca380b183",
  databaseURL: "https://folly-bc053-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);

export const rtdb = getDatabase(app);