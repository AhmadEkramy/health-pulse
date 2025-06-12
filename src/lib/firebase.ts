import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUzyALznND4dDY6H-3t6EEyO7gKbPRDPA",
  authDomain: "health-pulse-c6dbc.firebaseapp.com",
  projectId: "health-pulse-c6dbc",
  storageBucket: "health-pulse-c6dbc.firebasestorage.app",
  messagingSenderId: "721325706300",
  appId: "1:721325706300:web:d85e3e86ceb51231380739",
  measurementId: "G-Y5EKL2TC0B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 