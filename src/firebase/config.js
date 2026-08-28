import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sanambrosiodb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sanambrosiodb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sanambrosiodb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

// Evitar inicializar múltiples veces
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicializar servicios principales
export const db = getFirestore(app);
export const auth = getAuth(app);

// Inicializar Messaging condicionalmente (compatible con navegadores y PWA)
export let messaging = null;

export const initMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported && typeof window !== "undefined") {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (error) {
    console.warn("Firebase Messaging no está soportado en este entorno:", error);
  }
  return null;
};

export default app;
