import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, child, set, query, limitToLast, orderByKey, push, update } from 'firebase/database';
import "firebase/database";
import { getAuth, signInAnonymously } from 'firebase/auth';
// Removed getReactNativePersistence import
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkr6fF1ZmZ6DtSlKcPA3UrAYSH4Ib9pIc",
  authDomain: "hydroponics-a6609.firebaseapp.com",
  projectId: "hydroponics-a6609",
  storageBucket: "hydroponics-a6609.firebasestorage.app",
  messagingSenderId: "412721417359",
  appId: "1:412721417359:web:ccd3cd6de717645048f4fa",
  measurementId: "G-PK7SK97G2S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence // Use browserLocalPersistence for compatibility
});

signInAnonymously(auth).catch(error => {
  console.error("Authentication error:", error);
});

export { database, ref, onValue, get, child, auth, set, query, limitToLast, orderByKey, push, update, getDatabase, signInAnonymously };