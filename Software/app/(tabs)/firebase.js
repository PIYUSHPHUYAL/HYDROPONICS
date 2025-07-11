import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, child, set, query, limitToLast, orderByKey, push, update } from 'firebase/database';
import "firebase/database";
import { getAuth, signInAnonymously } from 'firebase/auth';
// Removed getReactNativePersistence import
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "############3",
  authDomain: "##############",
  projectId: "########3",
  storageBucket: "###########",
  messagingSenderId: "#############",
  appId: "##########3",
  measurementId: "########"
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
