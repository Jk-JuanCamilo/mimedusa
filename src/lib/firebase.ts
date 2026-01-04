import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration
// IMPORTANT: Replace these values with your Firebase project credentials
// Get them from: Firebase Console -> Project Settings -> General -> Your apps -> Web app
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY", // Replace with your API key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace with your auth domain
  projectId: "YOUR_PROJECT_ID", // Replace with your project ID
};

// Validate configuration
const isConfigured = 
  firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" &&
  firebaseConfig.authDomain !== "YOUR_PROJECT_ID.firebaseapp.com" &&
  firebaseConfig.projectId !== "YOUR_PROJECT_ID";

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

export { auth, googleProvider, isConfigured };
