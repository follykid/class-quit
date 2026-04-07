import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // 導入資料庫模組

const firebaseConfig = {
  apiKey: "AIzaSyBJtierBWwp-mp5q8_RNr2ej2z1koPE1-Q",
  authDomain: "quiz-web-app-d608c.firebaseapp.com",
  // *** 請注意：下方這行 databaseURL 非常重要 ***
  databaseURL: "https://quiz-web-app-d608c-default-rtdb.asia-southeast1.firebasedatabase.app", 
  projectId: "quiz-web-app-d608c",
  storageBucket: "quiz-web-app-d608c.firebasestorage.app",
  messagingSenderId: "110275956303",
  appId: "1:110275956303:web:e877d24232ad638042e43a",
  measurementId: "G-854V07MPPQ"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 匯出資料庫物件供其他頁面使用
export const db = getDatabase(app);