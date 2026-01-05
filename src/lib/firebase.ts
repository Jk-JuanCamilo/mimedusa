import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDZptAF29D7dm6oBquSGcCnHzOZLFGMNUQ",
  authDomain: "medussa-ia.firebaseapp.com",
  projectId: "medussa-ia",
  storageBucket: "medussa-ia.firebasestorage.app",
  messagingSenderId: "319236393772",
  appId: "1:319236393772:web:ff4172279ef633dbba7a89",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
